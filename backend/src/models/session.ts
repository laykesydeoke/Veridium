import { pool } from '../config/database';

export interface Session {
  id: string;
  session_address: string;
  topic: string;
  description: string;
  initiator_address: string;
  challenger_address?: string;
  wager_amount: string;
  status: 'pending' | 'active' | 'voting' | 'completed' | 'cancelled';
  winner_address?: string;
  start_time?: Date;
  end_time?: Date;
  created_at: Date;
  updated_at: Date;
}

export const SessionModel = {
  async findById(id: string): Promise<Session | null> {
    const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [
      id,
    ]);
    return result.rows[0] || null;
  },

  async findByAddress(address: string): Promise<Session | null> {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE session_address = $1',
      [address.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async create(data: Partial<Session>): Promise<Session> {
    const result = await pool.query(
      `INSERT INTO sessions
       (session_address, topic, description, initiator_address, challenger_address, wager_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.session_address?.toLowerCase(),
        data.topic,
        data.description,
        data.initiator_address?.toLowerCase(),
        data.challenger_address?.toLowerCase(),
        data.wager_amount,
        data.status || 'pending',
      ]
    );
    return result.rows[0];
  },

  async updateStatus(
    id: string,
    status: Session['status']
  ): Promise<Session> {
    const result = await pool.query(
      'UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  },

  async getActiveSessions(): Promise<Session[]> {
    const result = await pool.query(
      "SELECT * FROM sessions WHERE status IN ('active', 'voting') ORDER BY created_at DESC"
    );
    return result.rows;
  },
};
