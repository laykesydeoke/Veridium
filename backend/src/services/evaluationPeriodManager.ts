import { pool } from '../config/database';
import { OutcomeCalculator } from './outcomeCalculator';

/**
 * Evaluation Period Manager
 * Manages voting periods, extensions, and automatic finalization
 */

export interface EvaluationPeriod {
  sessionId: string;
  votingStartTime: Date;
  votingEndTime: Date;
  duration: number;
  timeRemaining: number;
  isActive: boolean;
  isExpired: boolean;
  canExtend: boolean;
  extensionCount: number;
}

export const EvaluationPeriodManager = {
  /**
   * Start evaluation period for a session
   */
  async startEvaluationPeriod(
    sessionId: string,
    durationHours: number = 24
  ): Promise<EvaluationPeriod> {
    const votingStartTime = new Date();
    const votingEndTime = new Date(votingStartTime.getTime() + durationHours * 60 * 60 * 1000);

    await pool.query(
      `UPDATE sessions SET
         status = 'voting',
         voting_end_time = $1,
         metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{votingStartTime}',
           $2::jsonb
         ),
         updated_at = NOW()
       WHERE id = $3`,
      [votingEndTime, JSON.stringify(votingStartTime.toISOString()), sessionId]
    );

    return {
      sessionId,
      votingStartTime,
      votingEndTime,
      duration: durationHours * 60 * 60 * 1000,
      timeRemaining: durationHours * 60 * 60 * 1000,
      isActive: true,
      isExpired: false,
      canExtend: true,
      extensionCount: 0,
    };
  },

  /**
   * Get evaluation period status
   */
  async getEvaluationPeriod(sessionId: string): Promise<EvaluationPeriod | null> {
    const result = await pool.query(
      `SELECT voting_end_time, metadata->>'votingStartTime' as voting_start_time, status
       FROM sessions
       WHERE id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const { voting_end_time, voting_start_time, status } = result.rows[0];

    if (!voting_end_time) {
      return null;
    }

    const votingStartTime = voting_start_time
      ? new Date(voting_start_time)
      : new Date(voting_end_time);
    const votingEndTime = new Date(voting_end_time);
    const now = new Date();

    const duration = votingEndTime.getTime() - votingStartTime.getTime();
    const timeRemaining = Math.max(0, votingEndTime.getTime() - now.getTime());
    const isActive = status === 'voting';
    const isExpired = now > votingEndTime;

    // Get extension count from metadata
    const extensionCount = await this.getExtensionCount(sessionId);
    const canExtend = extensionCount < 2 && !isExpired; // Max 2 extensions

    return {
      sessionId,
      votingStartTime,
      votingEndTime,
      duration,
      timeRemaining,
      isActive,
      isExpired,
      canExtend,
      extensionCount,
    };
  },

  /**
   * Extend evaluation period
   */
  async extendEvaluationPeriod(
    sessionId: string,
    additionalHours: number = 12
  ): Promise<EvaluationPeriod> {
    const period = await this.getEvaluationPeriod(sessionId);

    if (!period) {
      throw new Error('Evaluation period not found');
    }

    if (!period.canExtend) {
      throw new Error('Cannot extend evaluation period (max extensions reached or expired)');
    }

    const newEndTime = new Date(period.votingEndTime.getTime() + additionalHours * 60 * 60 * 1000);

    await pool.query(
      `UPDATE sessions SET
         voting_end_time = $1,
         metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{extensionCount}',
           $2::jsonb
         ),
         updated_at = NOW()
       WHERE id = $3`,
      [newEndTime, JSON.stringify(period.extensionCount + 1), sessionId]
    );

    return await this.getEvaluationPeriod(sessionId) as EvaluationPeriod;
  },

  /**
   * Get extension count from metadata
   */
  async getExtensionCount(sessionId: string): Promise<number> {
    const result = await pool.query(
      `SELECT metadata->>'extensionCount' as extension_count
       FROM sessions
       WHERE id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return 0;
    }

    const count = result.rows[0].extension_count;
    return count ? parseInt(count) : 0;
  },

  /**
   * Check and finalize expired sessions
   */
  async checkExpiredSessions(): Promise<number> {
    console.log('[EvaluationPeriodManager] Checking for expired voting sessions');

    const result = await pool.query(
      `SELECT id, voting_end_time
       FROM sessions
       WHERE status = 'voting'
         AND voting_end_time < NOW()
         AND deleted_at IS NULL`
    );

    let finalizedCount = 0;

    for (const row of result.rows) {
      try {
        console.log(`[EvaluationPeriodManager] Finalizing session ${row.id}`);
        await OutcomeCalculator.finalizeSession(row.id);
        finalizedCount++;
      } catch (error) {
        console.error(`[EvaluationPeriodManager] Error finalizing session ${row.id}:`, error);
      }
    }

    if (finalizedCount > 0) {
      console.log(`[EvaluationPeriodManager] Finalized ${finalizedCount} sessions`);
    }

    return finalizedCount;
  },

  /**
   * Get sessions nearing deadline
   */
  async getSessionsNearingDeadline(hoursUntilDeadline: number = 1): Promise<Array<{
    sessionId: string;
    topic: string;
    votingEndTime: Date;
    timeRemaining: number;
    evaluationCount: number;
  }>> {
    const deadline = new Date(Date.now() + hoursUntilDeadline * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT
        s.id as session_id,
        s.topic,
        s.voting_end_time,
        EXTRACT(EPOCH FROM (s.voting_end_time - NOW())) * 1000 as time_remaining,
        COUNT(e.id) as evaluation_count
      FROM sessions s
      LEFT JOIN evaluations e ON e.session_id = s.id
      WHERE s.status = 'voting'
        AND s.voting_end_time > NOW()
        AND s.voting_end_time < $1
        AND s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.voting_end_time ASC`,
      [deadline]
    );

    return result.rows.map(r => ({
      sessionId: r.session_id,
      topic: r.topic,
      votingEndTime: r.voting_end_time,
      timeRemaining: parseFloat(r.time_remaining),
      evaluationCount: parseInt(r.evaluation_count),
    }));
  },

  /**
   * Get active voting sessions
   */
  async getActiveVotingSessions(): Promise<Array<{
    sessionId: string;
    topic: string;
    votingEndTime: Date;
    evaluationCount: number;
    progressPercentage: number;
  }>> {
    const result = await pool.query(
      `SELECT
        s.id as session_id,
        s.topic,
        s.voting_end_time,
        COUNT(e.id) as evaluation_count,
        CASE
          WHEN s.voting_end_time IS NULL THEN 0
          ELSE GREATEST(0, LEAST(100,
            ((EXTRACT(EPOCH FROM (NOW() - s.start_time)) /
              EXTRACT(EPOCH FROM (s.voting_end_time - s.start_time))) * 100)
          ))
        END as progress_percentage
      FROM sessions s
      LEFT JOIN evaluations e ON e.session_id = s.id
      WHERE s.status = 'voting'
        AND s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.voting_end_time ASC`
    );

    return result.rows.map(r => ({
      sessionId: r.session_id,
      topic: r.topic,
      votingEndTime: r.voting_end_time,
      evaluationCount: parseInt(r.evaluation_count),
      progressPercentage: parseFloat(r.progress_percentage),
    }));
  },

  /**
   * Calculate optimal voting duration based on session complexity
   */
  calculateOptimalDuration(sessionData: {
    topicComplexity: 'simple' | 'moderate' | 'complex';
    wagerAmount: number;
    hasEvidence: boolean;
  }): number {
    let baseHours = 24; // Default 24 hours

    // Adjust for complexity
    if (sessionData.topicComplexity === 'complex') {
      baseHours = 48;
    } else if (sessionData.topicComplexity === 'simple') {
      baseHours = 12;
    }

    // Adjust for high-stakes sessions
    if (sessionData.wagerAmount > 1000) {
      baseHours += 12;
    }

    // Adjust if evidence needs review
    if (sessionData.hasEvidence) {
      baseHours += 6;
    }

    return Math.min(baseHours, 72); // Max 72 hours
  },

  /**
   * Start cron job for automatic finalization
   */
  startFinalizationCron(): NodeJS.Timeout {
    console.log('[EvaluationPeriodManager] Starting finalization cron');

    const runFinalization = async () => {
      try {
        await this.checkExpiredSessions();
      } catch (error) {
        console.error('[EvaluationPeriodManager] Finalization cron error:', error);
      }
    };

    // Run immediately then every 5 minutes
    runFinalization();
    return setInterval(runFinalization, 5 * 60 * 1000);
  },
};
