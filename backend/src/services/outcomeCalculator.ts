import { pool } from '../config/database';
import { AssessmentAggregator } from './assessmentAggregator';

/**
 * Outcome Calculator Service
 * Determines session winners and calculates final results
 */

export interface SessionOutcome {
  sessionId: string;
  winner: 'initiator' | 'challenger' | 'tie';
  winnerAddress: string | null;
  initiatorVotes: number;
  challengerVotes: number;
  initiatorWeight: number;
  challengerWeight: number;
  margin: number;
  marginPercentage: number;
  totalEvaluations: number;
  isValid: boolean;
  invalidReason?: string;
  tieBreakMethod?: string;
}

export interface RewardDistribution {
  winner: {
    address: string;
    amount: number;
    type: 'full' | 'split';
  } | null;
  evaluators: Array<{
    address: string;
    amount: number;
    wasCorrect: boolean;
    weight: number;
  }>;
  platformFee: number;
  totalDistributed: number;
}

export const OutcomeCalculator = {
  /**
   * Calculate session outcome
   */
  async calculateOutcome(sessionId: string): Promise<SessionOutcome> {
    const assessment = await AssessmentAggregator.getAggregatedAssessment(sessionId);

    if (!assessment) {
      throw new Error('Session not found or has no evaluations');
    }

    const session = await pool.query(
      'SELECT initiator_address, challenger_address, wager_amount FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      throw new Error('Session not found');
    }

    const { initiator_address, challenger_address } = session.rows[0];

    // Validate minimum evaluations
    const minEvaluations = 3;
    if (assessment.totalEvaluations < minEvaluations) {
      return {
        sessionId,
        winner: 'tie',
        winnerAddress: null,
        initiatorVotes: assessment.initiatorVotes,
        challengerVotes: assessment.challengerVotes,
        initiatorWeight: assessment.initiatorWeight,
        challengerWeight: assessment.challengerWeight,
        margin: 0,
        marginPercentage: 0,
        totalEvaluations: assessment.totalEvaluations,
        isValid: false,
        invalidReason: `Insufficient evaluations (${assessment.totalEvaluations}/${minEvaluations})`,
      };
    }

    // Calculate margin
    const margin = Math.abs(assessment.initiatorWeight - assessment.challengerWeight);
    const totalWeight = assessment.initiatorWeight + assessment.challengerWeight;
    const marginPercentage = totalWeight > 0 ? (margin / totalWeight) * 100 : 0;

    // Determine winner
    let winner: 'initiator' | 'challenger' | 'tie';
    let winnerAddress: string | null;
    let tieBreakMethod: string | undefined;

    if (assessment.initiatorWeight > assessment.challengerWeight) {
      winner = 'initiator';
      winnerAddress = initiator_address;
    } else if (assessment.challengerWeight > assessment.initiatorWeight) {
      winner = 'challenger';
      winnerAddress = challenger_address;
    } else {
      // Tie - use tie-breaking logic
      const tieBreakResult = await this.breakTie(sessionId, assessment);
      winner = tieBreakResult.winner;
      winnerAddress = tieBreakResult.winnerAddress;
      tieBreakMethod = tieBreakResult.method;
    }

    return {
      sessionId,
      winner,
      winnerAddress,
      initiatorVotes: assessment.initiatorVotes,
      challengerVotes: assessment.challengerVotes,
      initiatorWeight: assessment.initiatorWeight,
      challengerWeight: assessment.challengerWeight,
      margin,
      marginPercentage,
      totalEvaluations: assessment.totalEvaluations,
      isValid: true,
      tieBreakMethod,
    };
  },

  /**
   * Tie-breaking logic
   */
  async breakTie(sessionId: string, assessment: any): Promise<{
    winner: 'initiator' | 'challenger' | 'tie';
    winnerAddress: string | null;
    method: string;
  }> {
    const session = await pool.query(
      'SELECT initiator_address, challenger_address FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      throw new Error('Session not found');
    }

    const { initiator_address, challenger_address } = session.rows[0];

    // Method 1: Higher number of votes (regardless of weight)
    if (assessment.initiatorVotes > assessment.challengerVotes) {
      return {
        winner: 'initiator',
        winnerAddress: initiator_address,
        method: 'vote_count',
      };
    }

    if (assessment.challengerVotes > assessment.initiatorVotes) {
      return {
        winner: 'challenger',
        winnerAddress: challenger_address,
        method: 'vote_count',
      };
    }

    // Method 2: Higher average confidence
    const evaluations = await pool.query(
      `SELECT vote, AVG(confidence) as avg_confidence
       FROM evaluations
       WHERE session_id = $1
       GROUP BY vote`,
      [sessionId]
    );

    const initiatorConfidence = evaluations.rows.find(r => r.vote === true)?.avg_confidence || 0;
    const challengerConfidence = evaluations.rows.find(r => r.vote === false)?.avg_confidence || 0;

    if (initiatorConfidence > challengerConfidence) {
      return {
        winner: 'initiator',
        winnerAddress: initiator_address,
        method: 'confidence',
      };
    }

    if (challengerConfidence > initiatorConfidence) {
      return {
        winner: 'challenger',
        winnerAddress: challenger_address,
        method: 'confidence',
      };
    }

    // Method 3: Earlier average submission time
    const timings = await pool.query(
      `SELECT vote, AVG(EXTRACT(EPOCH FROM created_at)) as avg_time
       FROM evaluations
       WHERE session_id = $1
       GROUP BY vote`,
      [sessionId]
    );

    const initiatorTime = timings.rows.find(r => r.vote === true)?.avg_time || Infinity;
    const challengerTime = timings.rows.find(r => r.vote === false)?.avg_time || Infinity;

    if (initiatorTime < challengerTime) {
      return {
        winner: 'initiator',
        winnerAddress: initiator_address,
        method: 'timing',
      };
    }

    if (challengerTime < initiatorTime) {
      return {
        winner: 'challenger',
        winnerAddress: challenger_address,
        method: 'timing',
      };
    }

    // Final fallback: true tie (extremely rare)
    return {
      winner: 'tie',
      winnerAddress: null,
      method: 'unbreakable_tie',
    };
  },

  /**
   * Calculate reward distribution
   */
  async calculateRewardDistribution(sessionId: string): Promise<RewardDistribution> {
    const outcome = await this.calculateOutcome(sessionId);

    const session = await pool.query(
      'SELECT wager_amount FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      throw new Error('Session not found');
    }

    const wagerAmount = parseFloat(session.rows[0].wager_amount) || 0;
    const totalPool = wagerAmount * 2; // Both participants wagered

    // Platform fee (5%)
    const platformFee = totalPool * 0.05;

    // Evaluator reward pool (10% of remaining)
    const remainingAfterFee = totalPool - platformFee;
    const evaluatorPool = remainingAfterFee * 0.1;

    // Winner gets the rest
    const winnerAmount = remainingAfterFee - evaluatorPool;

    // Calculate winner reward
    let winner: { address: string; amount: number; type: 'full' | 'split' } | null = null;

    if (outcome.winner === 'tie') {
      // Split between both participants
      const splitAmount = winnerAmount / 2;
      // We'll return both as evaluator-like entries
    } else {
      winner = {
        address: outcome.winnerAddress!,
        amount: winnerAmount,
        type: 'full',
      };
    }

    // Calculate evaluator rewards
    const evaluators = await this.calculateEvaluatorRewards(
      sessionId,
      evaluatorPool,
      outcome.winner,
      outcome.winnerAddress
    );

    const totalDistributed = (winner?.amount || 0) + evaluators.reduce((sum, e) => sum + e.amount, 0) + platformFee;

    return {
      winner,
      evaluators,
      platformFee,
      totalDistributed,
    };
  },

  /**
   * Calculate individual evaluator rewards
   */
  async calculateEvaluatorRewards(
    sessionId: string,
    totalPool: number,
    winner: 'initiator' | 'challenger' | 'tie',
    winnerAddress: string | null
  ): Promise<Array<{
    address: string;
    amount: number;
    wasCorrect: boolean;
    weight: number;
  }>> {
    const evaluations = await pool.query(
      `SELECT evaluator_address, vote, weight
       FROM evaluations
       WHERE session_id = $1`,
      [sessionId]
    );

    if (evaluations.rows.length === 0) {
      return [];
    }

    // Determine correct vote
    const correctVote = winner === 'initiator' ? true : winner === 'challenger' ? false : null;

    // Calculate rewards based on weight and correctness
    const correctEvaluators = evaluations.rows.filter(e =>
      correctVote === null ? true : e.vote === correctVote
    );

    const totalCorrectWeight = correctEvaluators.reduce(
      (sum, e) => sum + parseFloat(e.weight),
      0
    );

    if (totalCorrectWeight === 0) {
      return [];
    }

    return correctEvaluators.map(e => {
      const weight = parseFloat(e.weight);
      const proportion = weight / totalCorrectWeight;
      const amount = Math.round(totalPool * proportion);
      const wasCorrect = correctVote === null || e.vote === correctVote;

      return {
        address: e.evaluator_address,
        amount,
        wasCorrect,
        weight,
      };
    });
  },

  /**
   * Finalize session and record outcome
   */
  async finalizeSession(sessionId: string): Promise<SessionOutcome> {
    const outcome = await this.calculateOutcome(sessionId);

    if (!outcome.isValid) {
      // Mark session as cancelled due to insufficient participation
      await pool.query(
        `UPDATE sessions SET
           status = 'cancelled',
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{cancellationReason}',
             $1::jsonb
           ),
           end_time = NOW()
         WHERE id = $2`,
        [JSON.stringify(outcome.invalidReason), sessionId]
      );

      return outcome;
    }

    // Update session with final results
    await pool.query(
      `UPDATE sessions SET
         status = 'completed',
         winner_address = $1,
         initiator_votes = $2,
         challenger_votes = $3,
         end_time = NOW()
       WHERE id = $4`,
      [outcome.winnerAddress, outcome.initiatorVotes, outcome.challengerVotes, sessionId]
    );

    // Calculate and record rewards
    const rewards = await this.calculateRewardDistribution(sessionId);

    // Store reward distribution
    await pool.query(
      `UPDATE sessions SET
         metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{rewards}',
           $1::jsonb
         )
       WHERE id = $2`,
      [JSON.stringify(rewards), sessionId]
    );

    return outcome;
  },

  /**
   * Get outcome summary for display
   */
  async getOutcomeSummary(sessionId: string): Promise<{
    outcome: SessionOutcome;
    rewards: RewardDistribution;
    winProbability: {
      initiator: number;
      challenger: number;
      tie: number;
    };
  }> {
    const outcome = await this.calculateOutcome(sessionId);
    const rewards = await this.calculateRewardDistribution(sessionId);

    // Calculate win probability based on current weights
    const totalWeight = outcome.initiatorWeight + outcome.challengerWeight;
    const winProbability = {
      initiator: totalWeight > 0 ? Math.round((outcome.initiatorWeight / totalWeight) * 100) : 50,
      challenger: totalWeight > 0 ? Math.round((outcome.challengerWeight / totalWeight) * 100) : 50,
      tie: Math.abs(outcome.initiatorWeight - outcome.challengerWeight) < 10 ? 5 : 0,
    };

    return {
      outcome,
      rewards,
      winProbability,
    };
  },
};
