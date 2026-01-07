import { FastifyInstance } from 'fastify';
import { pool } from '../config/database';
import { authenticateUser } from '../middleware/auth';
import { EvaluationValidator } from '../services/evaluationValidator';
import { ScoringAlgorithm, EvaluatorProfile, EvaluationInput } from '../services/scoringAlgorithm';
import { AssessmentAggregator } from '../services/assessmentAggregator';
import { OutcomeCalculator } from '../services/outcomeCalculator';

export async function evaluationRoutes(fastify: FastifyInstance) {
  /**
   * Submit evaluation for a session
   */
  fastify.post(
    '/evaluations',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { sessionId, vote, confidence, reasoning } = request.body as {
        sessionId: string;
        vote: boolean;
        confidence: number;
        reasoning: string;
      };

      const evaluatorAddress = (request.user as any).address;

      // Validate submission
      const validation = await EvaluationValidator.validateEvaluationSubmission(
        sessionId,
        evaluatorAddress,
        vote,
        confidence,
        reasoning
      );

      if (!validation.isValid) {
        return reply.code(400).send({
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      // Get evaluator profile for weight calculation
      const profileResult = await pool.query(
        `SELECT
          wallet_address as address,
          COALESCE(
            (SELECT SUM(points) FROM credibility_events WHERE user_address = $1),
            50
          ) as credibility_score,
          COALESCE(
            (SELECT
              (COUNT(*) FILTER (WHERE was_correct = true)::float /
               NULLIF(COUNT(*), 0)) * 100
             FROM (
               SELECT e.evaluator_address,
                      CASE
                        WHEN s.winner_address = s.initiator_address THEN e.vote = true
                        WHEN s.winner_address = s.challenger_address THEN e.vote = false
                        ELSE NULL
                      END as was_correct
               FROM evaluations e
               JOIN sessions s ON s.id = e.session_id
               WHERE e.evaluator_address = $1 AND s.status = 'completed'
             ) accuracy_calc),
            50
          ) as evaluation_accuracy,
          COALESCE(
            (SELECT COUNT(*) FROM evaluations WHERE evaluator_address = $1),
            0
          ) as total_evaluations,
          1 as recent_activity
        FROM users
        WHERE wallet_address = $1`,
        [evaluatorAddress.toLowerCase()]
      );

      if (profileResult.rows.length === 0) {
        return reply.code(400).send({
          success: false,
          errors: ['User profile not found'],
        });
      }

      const evaluatorProfile: EvaluatorProfile = {
        address: profileResult.rows[0].address,
        credibilityScore: parseFloat(profileResult.rows[0].credibility_score),
        evaluationAccuracy: parseFloat(profileResult.rows[0].evaluation_accuracy),
        totalEvaluations: parseInt(profileResult.rows[0].total_evaluations),
        recentActivity: parseInt(profileResult.rows[0].recent_activity),
      };

      // Get session voting times
      const sessionResult = await pool.query(
        'SELECT start_time, voting_end_time FROM sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          errors: ['Session not found'],
        });
      }

      const { start_time, voting_end_time } = sessionResult.rows[0];

      // Calculate weight
      const evaluationInput: EvaluationInput = {
        evaluatorAddress,
        vote,
        confidence,
        reasoning,
        submittedAt: new Date(),
      };

      const weightCalc = await ScoringAlgorithm.calculateWeight(
        evaluationInput,
        evaluatorProfile,
        new Date(start_time),
        new Date(voting_end_time)
      );

      // Check for spam
      const previousEvals = await pool.query(
        'SELECT reasoning FROM evaluations WHERE session_id = $1',
        [sessionId]
      );

      const spamCheck = ScoringAlgorithm.detectSpam(
        evaluationInput,
        previousEvals.rows.map(r => ({ ...evaluationInput, reasoning: r.reasoning }))
      );

      if (spamCheck.isSpam) {
        return reply.code(400).send({
          success: false,
          errors: [`Evaluation rejected: ${spamCheck.reason}`],
        });
      }

      // Calculate quality score
      const qualityScore = ScoringAlgorithm.calculateQualityScore(
        evaluationInput,
        weightCalc
      );

      // Insert evaluation
      const result = await pool.query(
        `INSERT INTO evaluations (
          session_id, evaluator_address, vote, weight, confidence, reasoning, quality_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          sessionId,
          evaluatorAddress.toLowerCase(),
          vote,
          weightCalc.finalWeight,
          confidence,
          reasoning,
          qualityScore,
        ]
      );

      // Add evaluator as participant
      await pool.query(
        `INSERT INTO session_participants (session_id, user_address, role)
         VALUES ($1, $2, 'evaluator')
         ON CONFLICT DO NOTHING`,
        [sessionId, evaluatorAddress.toLowerCase()]
      );

      // Invalidate cache
      await AssessmentAggregator.invalidateCache(sessionId);

      return reply.send({
        success: true,
        data: {
          ...result.rows[0],
          weightBreakdown: weightCalc.breakdown,
          qualityScore,
        },
        warnings: validation.warnings,
      });
    }
  );

  /**
   * Get evaluation by ID
   */
  fastify.get('/evaluations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await pool.query(
      'SELECT * FROM evaluations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        success: false,
        error: 'Evaluation not found',
      });
    }

    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * Get evaluations for a session
   */
  fastify.get('/evaluations/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

    const result = await pool.query(
      `SELECT * FROM evaluations
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    const total = await pool.query(
      'SELECT COUNT(*) as count FROM evaluations WHERE session_id = $1',
      [sessionId]
    );

    return reply.send({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(total.rows[0].count),
        limit,
        offset,
      },
    });
  });

  /**
   * Get evaluations by user
   */
  fastify.get('/evaluations/user/:address', async (request, reply) => {
    const { address } = request.params as { address: string };
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

    const result = await pool.query(
      `SELECT e.*, s.topic
       FROM evaluations e
       JOIN sessions s ON s.id = e.session_id
       WHERE e.evaluator_address = $1
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [address.toLowerCase(), limit, offset]
    );

    return reply.send({
      success: true,
      data: result.rows,
    });
  });

  /**
   * Get aggregated assessment for a session
   */
  fastify.get('/evaluations/assessment/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const assessment = await AssessmentAggregator.getAggregatedAssessment(sessionId);

    if (!assessment) {
      return reply.code(404).send({
        success: false,
        error: 'Session not found or has no evaluations',
      });
    }

    return reply.send({
      success: true,
      data: assessment,
    });
  });

  /**
   * Get evaluation metrics
   */
  fastify.get('/evaluations/metrics/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const metrics = await AssessmentAggregator.getEvaluationMetrics(sessionId);

    return reply.send({
      success: true,
      data: metrics,
    });
  });

  /**
   * Get evaluation progress
   */
  fastify.get('/evaluations/progress/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const progress = await AssessmentAggregator.getEvaluationProgress(sessionId);

    return reply.send({
      success: true,
      data: progress,
    });
  });

  /**
   * Get evaluation distribution
   */
  fastify.get('/evaluations/distribution/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const distribution = await AssessmentAggregator.getEvaluationDistribution(sessionId);

    return reply.send({
      success: true,
      data: distribution,
    });
  });

  /**
   * Get outcome summary
   */
  fastify.get('/evaluations/outcome/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    try {
      const summary = await OutcomeCalculator.getOutcomeSummary(sessionId);

      return reply.send({
        success: true,
        data: summary,
      });
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate outcome',
      });
    }
  });

  /**
   * Finalize session results (admin only)
   */
  fastify.post(
    '/evaluations/finalize/:sessionId',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };

      try {
        const outcome = await OutcomeCalculator.finalizeSession(sessionId);

        return reply.send({
          success: true,
          data: outcome,
        });
      } catch (error) {
        return reply.code(400).send({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to finalize session',
        });
      }
    }
  );

  /**
   * Get evaluator participation
   */
  fastify.get('/evaluations/participation/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const participation = await AssessmentAggregator.getEvaluatorParticipation(sessionId);

    return reply.send({
      success: true,
      data: participation,
    });
  });

  /**
   * Check evaluation eligibility
   */
  fastify.get(
    '/evaluations/eligibility/:sessionId',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };
      const evaluatorAddress = (request.user as any).address;

      const sessionValidation = await EvaluationValidator.validateSessionAcceptsEvaluations(
        sessionId
      );

      const userEligibility = await EvaluationValidator.checkEvaluatorEligibility(
        evaluatorAddress
      );

      const rateLimit = await EvaluationValidator.getEvaluationRateLimit(evaluatorAddress);

      return reply.send({
        success: true,
        data: {
          canEvaluate: sessionValidation.isValid && userEligibility.isEligible && rateLimit.canEvaluate,
          sessionValid: sessionValidation.isValid,
          sessionErrors: sessionValidation.errors,
          sessionWarnings: sessionValidation.warnings,
          userEligible: userEligibility.isEligible,
          userReasons: userEligibility.reasons,
          rateLimit,
        },
      });
    }
  );
}
