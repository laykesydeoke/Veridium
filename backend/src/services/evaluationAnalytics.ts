import { pool } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

/**
 * Evaluation Analytics Service
 * Provides analytics and insights on evaluations
 */

export const EvaluationAnalytics = {
  /**
   * Get evaluator performance stats
   */
  async getEvaluatorPerformance(evaluatorAddress: string): Promise<{
    totalEvaluations: number;
    correctEvaluations: number;
    accuracy: number;
    averageWeight: number;
    averageConfidence: number;
    totalRewardsEarned: number;
    recentStreak: number;
    topCategories: string[];
  }> {
    const cacheKey = `evaluator:performance:${evaluatorAddress}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_evaluations,
        COUNT(*) FILTER (WHERE
          CASE
            WHEN s.winner_address = s.initiator_address THEN e.vote = true
            WHEN s.winner_address = s.challenger_address THEN e.vote = false
            ELSE NULL
          END
        ) as correct_evaluations,
        AVG(e.weight) as average_weight,
        AVG(e.confidence) as average_confidence
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      WHERE e.evaluator_address = $1
        AND s.status = 'completed'`,
      [evaluatorAddress.toLowerCase()]
    );

    const row = result.rows[0];
    const totalEvaluations = parseInt(row.total_evaluations || 0);
    const correctEvaluations = parseInt(row.correct_evaluations || 0);

    const stats = {
      totalEvaluations,
      correctEvaluations,
      accuracy: totalEvaluations > 0 ? (correctEvaluations / totalEvaluations) * 100 : 0,
      averageWeight: parseFloat(row.average_weight || 0),
      averageConfidence: parseFloat(row.average_confidence || 0),
      totalRewardsEarned: 0, // TODO: Calculate from rewards
      recentStreak: await this.calculateStreak(evaluatorAddress),
      topCategories: [],
    };

    await cacheSet(cacheKey, stats, 600); // 10 minutes
    return stats;
  },

  /**
   * Calculate evaluation streak
   */
  async calculateStreak(evaluatorAddress: string): Promise<number> {
    const result = await pool.query(
      `SELECT
        CASE
          WHEN s.winner_address = s.initiator_address THEN e.vote = true
          WHEN s.winner_address = s.challenger_address THEN e.vote = false
          ELSE NULL
        END as was_correct
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      WHERE e.evaluator_address = $1
        AND s.status = 'completed'
      ORDER BY e.created_at DESC
      LIMIT 10`,
      [evaluatorAddress.toLowerCase()]
    );

    let streak = 0;
    for (const row of result.rows) {
      if (row.was_correct === true) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * Get evaluation trends over time
   */
  async getEvaluationTrends(
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<Array<{
    date: string;
    totalEvaluations: number;
    averageQuality: number;
    consensusLevel: number;
  }>> {
    const interval = period === 'day' ? '1 day' : period === 'week' ? '1 week' : '1 month';

    const result = await pool.query(
      `SELECT
        DATE_TRUNC($1, created_at) as date,
        COUNT(*) as total_evaluations,
        AVG(quality_score) as average_quality
      FROM evaluations
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC($1, created_at)
      ORDER BY date ASC`,
      [period]
    );

    return result.rows.map(r => ({
      date: r.date,
      totalEvaluations: parseInt(r.total_evaluations),
      averageQuality: parseFloat(r.average_quality),
      consensusLevel: 0, // TODO: Calculate
    }));
  },

  /**
   * Get top evaluators by accuracy
   */
  async getTopEvaluators(limit: number = 10): Promise<Array<{
    address: string;
    totalEvaluations: number;
    accuracy: number;
    averageWeight: number;
  }>> {
    const result = await pool.query(
      `SELECT
        e.evaluator_address,
        COUNT(*) as total_evaluations,
        (COUNT(*) FILTER (WHERE
          CASE
            WHEN s.winner_address = s.initiator_address THEN e.vote = true
            WHEN s.winner_address = s.challenger_address THEN e.vote = false
            ELSE NULL
          END
        )::float / COUNT(*)) * 100 as accuracy,
        AVG(e.weight) as average_weight
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      WHERE s.status = 'completed'
      GROUP BY e.evaluator_address
      HAVING COUNT(*) >= 5
      ORDER BY accuracy DESC, total_evaluations DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows.map(r => ({
      address: r.evaluator_address,
      totalEvaluations: parseInt(r.total_evaluations),
      accuracy: parseFloat(r.accuracy),
      averageWeight: parseFloat(r.average_weight),
    }));
  },

  /**
   * Get consensus strength distribution
   */
  async getConsensusDistribution(): Promise<{
    strong: number;
    moderate: number;
    weak: number;
    divided: number;
  }> {
    // Get all completed sessions
    const result = await pool.query(
      `SELECT
        s.id,
        s.initiator_votes,
        s.challenger_votes,
        CASE
          WHEN s.initiator_votes + s.challenger_votes = 0 THEN 0
          ELSE ABS(s.initiator_votes - s.challenger_votes)::float /
               (s.initiator_votes + s.challenger_votes) * 100
        END as margin
      FROM sessions s
      WHERE s.status = 'completed'`
    );

    const distribution = {
      strong: 0,
      moderate: 0,
      weak: 0,
      divided: 0,
    };

    result.rows.forEach(r => {
      const margin = parseFloat(r.margin);
      if (margin >= 70) distribution.strong++;
      else if (margin >= 50) distribution.moderate++;
      else if (margin >= 30) distribution.weak++;
      else distribution.divided++;
    });

    return distribution;
  },

  /**
   * Get evaluation quality distribution
   */
  async getQualityDistribution(): Promise<{
    excellent: number; // 80-100
    good: number; // 60-79
    fair: number; // 40-59
    poor: number; // 0-39
  }> {
    const result = await pool.query(
      `SELECT quality_score FROM evaluations WHERE quality_score IS NOT NULL`
    );

    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };

    result.rows.forEach(r => {
      const score = parseFloat(r.quality_score);
      if (score >= 80) distribution.excellent++;
      else if (score >= 60) distribution.good++;
      else if (score >= 40) distribution.fair++;
      else distribution.poor++;
    });

    return distribution;
  },

  /**
   * Get evaluation timing patterns
   */
  async getTimingPatterns(): Promise<{
    byHour: Array<{ hour: number; count: number }>;
    byDayOfWeek: Array<{ day: number; count: number }>;
    averageResponseTime: number;
  }> {
    const hourResult = await pool.query(
      `SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM evaluations
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour`
    );

    const dayResult = await pool.query(
      `SELECT
        EXTRACT(DOW FROM created_at) as day,
        COUNT(*) as count
      FROM evaluations
      GROUP BY EXTRACT(DOW FROM created_at)
      ORDER BY day`
    );

    const avgResponse = await pool.query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (e.created_at - s.start_time))) as avg_seconds
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      WHERE s.start_time IS NOT NULL`
    );

    return {
      byHour: hourResult.rows.map(r => ({
        hour: parseInt(r.hour),
        count: parseInt(r.count),
      })),
      byDayOfWeek: dayResult.rows.map(r => ({
        day: parseInt(r.day),
        count: parseInt(r.count),
      })),
      averageResponseTime: parseFloat(avgResponse.rows[0]?.avg_seconds || 0),
    };
  },

  /**
   * Get session outcome predictions
   */
  async getPredictionAccuracy(): Promise<{
    totalSessions: number;
    predictedCorrectly: number;
    accuracy: number;
    byConsensusLevel: Record<string, number>;
  }> {
    // This would compare early voting trends to final outcomes
    // Simplified version for now
    const result = await pool.query(
      `SELECT COUNT(*) as total FROM sessions WHERE status = 'completed'`
    );

    return {
      totalSessions: parseInt(result.rows[0].total),
      predictedCorrectly: 0, // TODO: Implement prediction logic
      accuracy: 0,
      byConsensusLevel: {},
    };
  },

  /**
   * Get evaluator impact analysis
   */
  async getEvaluatorImpact(sessionId: string): Promise<Array<{
    evaluatorAddress: string;
    weight: number;
    impactPercentage: number;
    changedOutcome: boolean;
  }>> {
    const result = await pool.query(
      `SELECT
        evaluator_address,
        weight,
        vote
      FROM evaluations
      WHERE session_id = $1
      ORDER BY created_at ASC`,
      [sessionId]
    );

    const totalWeight = result.rows.reduce((sum, r) => sum + parseFloat(r.weight), 0);

    return result.rows.map(r => {
      const weight = parseFloat(r.weight);
      return {
        evaluatorAddress: r.evaluator_address,
        weight,
        impactPercentage: totalWeight > 0 ? (weight / totalWeight) * 100 : 0,
        changedOutcome: false, // TODO: Calculate if removal would change outcome
      };
    });
  },
};
