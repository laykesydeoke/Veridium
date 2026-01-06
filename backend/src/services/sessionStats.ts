import { pool } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

export const SessionStats = {
  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string) {
    const cacheKey = `session:stats:${sessionId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      'SELECT * FROM v_session_evaluation_stats WHERE session_id = $1',
      [sessionId]
    );

    if (result.rows.length > 0) {
      await cacheSet(cacheKey, result.rows[0], 300); // 5 minutes
      return result.rows[0];
    }

    return null;
  },

  /**
   * Get global session statistics
   */
  async getGlobalStats() {
    const cacheKey = 'session:stats:global';
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
         COUNT(*) FILTER (WHERE status = 'active') as active_sessions,
         COUNT(*) FILTER (WHERE status = 'voting') as voting_sessions,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_sessions,
         AVG(EXTRACT(EPOCH FROM (end_time - start_time))) FILTER (WHERE end_time IS NOT NULL AND start_time IS NOT NULL) as avg_duration_seconds,
         SUM(CAST(wager_amount AS NUMERIC)) as total_wagered
       FROM sessions
       WHERE deleted_at IS NULL`
    );

    const stats = {
      completedSessions: parseInt(result.rows[0].completed_sessions || 0),
      activeSessions: parseInt(result.rows[0].active_sessions || 0),
      votingSessions: parseInt(result.rows[0].voting_sessions || 0),
      pendingSessions: parseInt(result.rows[0].pending_sessions || 0),
      avgDurationSeconds: parseFloat(result.rows[0].avg_duration_seconds || 0),
      totalWagered: result.rows[0].total_wagered || '0',
    };

    await cacheSet(cacheKey, stats, 600); // 10 minutes
    return stats;
  },

  /**
   * Get user session statistics
   */
  async getUserSessionStats(address: string) {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role IN ('initiator', 'challenger')) as total_participated,
         COUNT(DISTINCT s.id) FILTER (WHERE s.winner_address = $1) as total_won,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('active', 'voting')) as ongoing
       FROM session_participants sp
       LEFT JOIN sessions s ON s.id = sp.session_id
       WHERE sp.user_address = $1 AND s.deleted_at IS NULL`,
      [address.toLowerCase()]
    );

    return {
      totalParticipated: parseInt(result.rows[0].total_participated || 0),
      totalWon: parseInt(result.rows[0].total_won || 0),
      completed: parseInt(result.rows[0].completed || 0),
      ongoing: parseInt(result.rows[0].ongoing || 0),
      winRate:
        result.rows[0].completed > 0
          ? (result.rows[0].total_won / result.rows[0].completed) * 100
          : 0,
    };
  },
};
