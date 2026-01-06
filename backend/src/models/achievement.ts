import { pool } from '../config/database';

export type AchievementType =
  | 'first_session'
  | 'first_win'
  | 'first_evaluation'
  | 'ten_sessions'
  | 'fifty_sessions'
  | 'high_accuracy'
  | 'legendary'
  | 'champion';

export interface Achievement {
  id: string;
  user_address: string;
  achievement_type: AchievementType;
  token_id?: bigint;
  transaction_hash?: string;
  metadata?: Record<string, any>;
  unlocked_at: Date;
}

export const AchievementModel = {
  async findByUser(userAddress: string): Promise<Achievement[]> {
    const result = await pool.query(
      'SELECT * FROM achievements WHERE user_address = $1 ORDER BY unlocked_at DESC',
      [userAddress.toLowerCase()]
    );
    return result.rows;
  },

  async hasAchievement(
    userAddress: string,
    type: AchievementType
  ): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM achievements WHERE user_address = $1 AND achievement_type = $2',
      [userAddress.toLowerCase(), type]
    );
    return result.rows.length > 0;
  },

  async create(data: Partial<Achievement>): Promise<Achievement> {
    const result = await pool.query(
      `INSERT INTO achievements
       (user_address, achievement_type, token_id, transaction_hash, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.user_address?.toLowerCase(),
        data.achievement_type,
        data.token_id,
        data.transaction_hash,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return result.rows[0];
  },

  async getRecentAchievements(limit: number = 10): Promise<Achievement[]> {
    const result = await pool.query(
      'SELECT * FROM achievements ORDER BY unlocked_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },
};
