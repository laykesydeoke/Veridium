import { pool } from '../config/database';

export type CredibilityEventType =
  | 'session_participated'
  | 'session_won'
  | 'evaluation_submitted'
  | 'evaluation_correct'
  | 'evaluation_incorrect'
  | 'achievement_unlocked';

export interface CredibilityEvent {
  id: string;
  user_address: string;
  event_type: CredibilityEventType;
  session_id?: string;
  points_change: number;
  old_score: number;
  new_score: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export const CredibilityEventModel = {
  async findByUser(
    userAddress: string,
    limit: number = 50
  ): Promise<CredibilityEvent[]> {
    const result = await pool.query(
      'SELECT * FROM credibility_events WHERE user_address = $1 ORDER BY created_at DESC LIMIT $2',
      [userAddress.toLowerCase(), limit]
    );
    return result.rows;
  },

  async findBySession(sessionId: string): Promise<CredibilityEvent[]> {
    const result = await pool.query(
      'SELECT * FROM credibility_events WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    return result.rows;
  },

  async create(data: Partial<CredibilityEvent>): Promise<CredibilityEvent> {
    const result = await pool.query(
      `INSERT INTO credibility_events
       (user_address, event_type, session_id, points_change, old_score, new_score, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.user_address?.toLowerCase(),
        data.event_type,
        data.session_id,
        data.points_change,
        data.old_score,
        data.new_score,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return result.rows[0];
  },

  async getUserStats(
    userAddress: string
  ): Promise<{ totalPoints: number; eventCount: number }> {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(points_change), 0) as total_points,
         COUNT(*) as event_count
       FROM credibility_events
       WHERE user_address = $1`,
      [userAddress.toLowerCase()]
    );
    return {
      totalPoints: parseInt(result.rows[0].total_points),
      eventCount: parseInt(result.rows[0].event_count),
    };
  },
};
