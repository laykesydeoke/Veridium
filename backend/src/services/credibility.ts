import { pool } from '../config/database';

export interface CredibilitySnapshot {
  userAddress: string;
  totalScore: number;
  sessionsParticipated: number;
  sessionsWon: number;
  evaluationsSubmitted: number;
  evaluationsCorrect: number;
}

export const CredibilityService = {
  async createSnapshot(data: CredibilitySnapshot): Promise<void> {
    await pool.query(
      `INSERT INTO credibility_snapshots
       (user_address, total_score, sessions_participated, sessions_won,
        evaluations_submitted, evaluations_correct)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.userAddress.toLowerCase(),
        data.totalScore,
        data.sessionsParticipated,
        data.sessionsWon,
        data.evaluationsSubmitted,
        data.evaluationsCorrect,
      ]
    );
  },

  async getLatestSnapshot(address: string): Promise<CredibilitySnapshot | null> {
    const result = await pool.query(
      `SELECT * FROM credibility_snapshots
       WHERE user_address = $1
       ORDER BY snapshot_at DESC
       LIMIT 1`,
      [address.toLowerCase()]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userAddress: row.user_address,
      totalScore: row.total_score,
      sessionsParticipated: row.sessions_participated,
      sessionsWon: row.sessions_won,
      evaluationsSubmitted: row.evaluations_submitted,
      evaluationsCorrect: row.evaluations_correct,
    };
  },

  async getLeaderboard(limit: number = 10): Promise<CredibilitySnapshot[]> {
    const result = await pool.query(
      `WITH latest_snapshots AS (
        SELECT DISTINCT ON (user_address) *
        FROM credibility_snapshots
        ORDER BY user_address, snapshot_at DESC
      )
      SELECT * FROM latest_snapshots
      ORDER BY total_score DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      userAddress: row.user_address,
      totalScore: row.total_score,
      sessionsParticipated: row.sessions_participated,
      sessionsWon: row.sessions_won,
      evaluationsSubmitted: row.evaluations_submitted,
      evaluationsCorrect: row.evaluations_correct,
    }));
  },
};
