import { pool } from '../config/database';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

/**
 * Assessment Aggregator Service
 * Aggregates and analyzes evaluations for sessions
 */

export interface EvaluationData {
  id: string;
  sessionId: string;
  evaluatorAddress: string;
  vote: boolean;
  weight: number;
  reasoning: string;
  confidence: number;
  createdAt: Date;
}

export interface AggregatedAssessment {
  sessionId: string;
  totalEvaluations: number;
  initiatorVotes: number;
  challengerVotes: number;
  initiatorWeight: number;
  challengerWeight: number;
  totalWeight: number;
  initiatorPercentage: number;
  challengerPercentage: number;
  averageConfidence: number;
  consensusStrength: number;
  evaluators: string[];
}

export interface EvaluationMetrics {
  participationRate: number;
  averageResponseTime: number;
  qualityScore: number;
  consensusLevel: 'strong' | 'moderate' | 'weak' | 'divided';
  topReasons: Array<{ reason: string; count: number }>;
}

export const AssessmentAggregator = {
  /**
   * Get aggregated assessment for a session
   */
  async getAggregatedAssessment(sessionId: string): Promise<AggregatedAssessment | null> {
    const cacheKey = `assessment:aggregated:${sessionId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT
        s.id as session_id,
        COUNT(e.id) as total_evaluations,
        COUNT(e.id) FILTER (WHERE e.vote = true) as initiator_votes,
        COUNT(e.id) FILTER (WHERE e.vote = false) as challenger_votes,
        COALESCE(SUM(e.weight) FILTER (WHERE e.vote = true), 0) as initiator_weight,
        COALESCE(SUM(e.weight) FILTER (WHERE e.vote = false), 0) as challenger_weight,
        COALESCE(SUM(e.weight), 0) as total_weight,
        COALESCE(AVG(e.confidence), 0) as average_confidence,
        array_agg(DISTINCT e.evaluator_address) as evaluators
      FROM sessions s
      LEFT JOIN evaluations e ON e.session_id = s.id
      WHERE s.id = $1
      GROUP BY s.id`,
      [sessionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const totalWeight = parseFloat(row.total_weight);
    const initiatorWeight = parseFloat(row.initiator_weight);
    const challengerWeight = parseFloat(row.challenger_weight);

    const assessment: AggregatedAssessment = {
      sessionId: row.session_id,
      totalEvaluations: parseInt(row.total_evaluations),
      initiatorVotes: parseInt(row.initiator_votes),
      challengerVotes: parseInt(row.challenger_votes),
      initiatorWeight,
      challengerWeight,
      totalWeight,
      initiatorPercentage: totalWeight > 0 ? (initiatorWeight / totalWeight) * 100 : 0,
      challengerPercentage: totalWeight > 0 ? (challengerWeight / totalWeight) * 100 : 0,
      averageConfidence: parseFloat(row.average_confidence),
      consensusStrength: this.calculateConsensusStrength(initiatorWeight, challengerWeight),
      evaluators: row.evaluators || [],
    };

    await cacheSet(cacheKey, assessment, 300); // Cache for 5 minutes
    return assessment;
  },

  /**
   * Calculate consensus strength (0-100)
   */
  calculateConsensusStrength(initiatorWeight: number, challengerWeight: number): number {
    const total = initiatorWeight + challengerWeight;
    if (total === 0) return 0;

    const maxWeight = Math.max(initiatorWeight, challengerWeight);
    const minWeight = Math.min(initiatorWeight, challengerWeight);

    // Consensus strength based on how much one side dominates
    return Math.round(((maxWeight - minWeight) / total) * 100);
  },

  /**
   * Get evaluation metrics for analysis
   */
  async getEvaluationMetrics(sessionId: string): Promise<EvaluationMetrics> {
    const session = await pool.query(
      'SELECT start_time, voting_end_time FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      throw new Error('Session not found');
    }

    const evaluations = await pool.query(
      `SELECT
        e.*,
        EXTRACT(EPOCH FROM (e.created_at - s.start_time)) as response_time_seconds
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      WHERE e.session_id = $1`,
      [sessionId]
    );

    const totalEvaluations = evaluations.rows.length;
    const avgResponseTime = totalEvaluations > 0
      ? evaluations.rows.reduce((sum, e) => sum + parseFloat(e.response_time_seconds), 0) / totalEvaluations
      : 0;

    // Quality score based on reasoning length and confidence
    const qualityScore = totalEvaluations > 0
      ? evaluations.rows.reduce((sum, e) => {
          const reasoningQuality = Math.min(e.reasoning?.length || 0, 500) / 500; // Max 500 chars
          const confidenceWeight = e.confidence / 100;
          return sum + (reasoningQuality * 0.6 + confidenceWeight * 0.4);
        }, 0) / totalEvaluations * 100
      : 0;

    const assessment = await this.getAggregatedAssessment(sessionId);
    const consensusLevel = this.getConsensusLevel(assessment?.consensusStrength || 0);

    // Count reasoning patterns
    const reasoningCounts = new Map<string, number>();
    evaluations.rows.forEach(e => {
      if (e.reasoning) {
        const key = e.reasoning.slice(0, 50).toLowerCase();
        reasoningCounts.set(key, (reasoningCounts.get(key) || 0) + 1);
      }
    });

    const topReasons = Array.from(reasoningCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      participationRate: 0, // Will be calculated with total eligible evaluators
      averageResponseTime: avgResponseTime,
      qualityScore,
      consensusLevel,
      topReasons,
    };
  },

  /**
   * Determine consensus level
   */
  getConsensusLevel(consensusStrength: number): 'strong' | 'moderate' | 'weak' | 'divided' {
    if (consensusStrength >= 70) return 'strong';
    if (consensusStrength >= 50) return 'moderate';
    if (consensusStrength >= 30) return 'weak';
    return 'divided';
  },

  /**
   * Get real-time evaluation progress
   */
  async getEvaluationProgress(sessionId: string): Promise<{
    current: number;
    target: number;
    percentage: number;
    timeRemaining: number;
  }> {
    const session = await pool.query(
      'SELECT voting_end_time FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      throw new Error('Session not found');
    }

    const assessment = await this.getAggregatedAssessment(sessionId);
    const current = assessment?.totalEvaluations || 0;
    const target = 10; // Minimum evaluations for valid result
    const percentage = Math.min((current / target) * 100, 100);

    const votingEndTime = session.rows[0].voting_end_time;
    const timeRemaining = votingEndTime
      ? Math.max(0, new Date(votingEndTime).getTime() - Date.now())
      : 0;

    return {
      current,
      target,
      percentage,
      timeRemaining,
    };
  },

  /**
   * Get evaluation distribution
   */
  async getEvaluationDistribution(sessionId: string): Promise<{
    byWeight: Array<{ range: string; count: number }>;
    byConfidence: Array<{ range: string; count: number }>;
    byTime: Array<{ hour: number; count: number }>;
  }> {
    const evaluations = await pool.query(
      `SELECT
        e.weight,
        e.confidence,
        EXTRACT(HOUR FROM e.created_at) as hour
      FROM evaluations e
      WHERE e.session_id = $1`,
      [sessionId]
    );

    // Weight distribution
    const weightRanges = [
      { range: '0-25', min: 0, max: 25, count: 0 },
      { range: '26-50', min: 26, max: 50, count: 0 },
      { range: '51-75', min: 51, max: 75, count: 0 },
      { range: '76-100', min: 76, max: 100, count: 0 },
    ];

    // Confidence distribution
    const confidenceRanges = [
      { range: 'Low (0-40)', min: 0, max: 40, count: 0 },
      { range: 'Medium (41-70)', min: 41, max: 70, count: 0 },
      { range: 'High (71-100)', min: 71, max: 100, count: 0 },
    ];

    // Time distribution (by hour)
    const timeDistribution = new Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));

    evaluations.rows.forEach(e => {
      const weight = parseFloat(e.weight);
      const confidence = parseFloat(e.confidence);
      const hour = parseInt(e.hour);

      // Count in weight ranges
      weightRanges.forEach(range => {
        if (weight >= range.min && weight <= range.max) {
          range.count++;
        }
      });

      // Count in confidence ranges
      confidenceRanges.forEach(range => {
        if (confidence >= range.min && confidence <= range.max) {
          range.count++;
        }
      });

      // Count by hour
      if (hour >= 0 && hour < 24) {
        timeDistribution[hour].count++;
      }
    });

    return {
      byWeight: weightRanges.map(r => ({ range: r.range, count: r.count })),
      byConfidence: confidenceRanges.map(r => ({ range: r.range, count: r.count })),
      byTime: timeDistribution,
    };
  },

  /**
   * Invalidate cache for a session
   */
  async invalidateCache(sessionId: string): Promise<void> {
    await cacheDel(`assessment:aggregated:${sessionId}`);
  },

  /**
   * Get evaluator participation summary
   */
  async getEvaluatorParticipation(sessionId: string): Promise<Array<{
    evaluatorAddress: string;
    vote: boolean;
    weight: number;
    confidence: number;
    responseTime: number;
    reasoningLength: number;
  }>> {
    const result = await pool.query(
      `SELECT
        e.evaluator_address,
        e.vote,
        e.weight,
        e.confidence,
        EXTRACT(EPOCH FROM (e.created_at - s.start_time)) as response_time,
        LENGTH(e.reasoning) as reasoning_length
      FROM evaluations e
      JOIN sessions s ON s.id = e.session_id
      WHERE e.session_id = $1
      ORDER BY e.created_at ASC`,
      [sessionId]
    );

    return result.rows.map(r => ({
      evaluatorAddress: r.evaluator_address,
      vote: r.vote,
      weight: parseFloat(r.weight),
      confidence: parseFloat(r.confidence),
      responseTime: parseFloat(r.response_time),
      reasoningLength: parseInt(r.reasoning_length),
    }));
  },
};
