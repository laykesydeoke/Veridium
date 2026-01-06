import { pool } from '../config/database';

export interface Argument {
  id: string;
  session_id: string;
  author_address: string;
  side: 'initiator' | 'challenger';
  content: string;
  parent_id?: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export const ArgumentModel = {
  async findById(id: string): Promise<Argument | null> {
    const result = await pool.query(
      'SELECT * FROM arguments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  },

  async findBySession(sessionId: string): Promise<Argument[]> {
    const result = await pool.query(
      'SELECT * FROM arguments WHERE session_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC',
      [sessionId]
    );
    return result.rows;
  },

  async create(data: Partial<Argument>): Promise<Argument> {
    const result = await pool.query(
      `INSERT INTO arguments
       (session_id, author_address, side, content, parent_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.session_id,
        data.author_address?.toLowerCase(),
        data.side,
        data.content,
        data.parent_id,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return result.rows[0];
  },

  async upvote(id: string): Promise<Argument> {
    const result = await pool.query(
      'UPDATE arguments SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async softDelete(id: string): Promise<void> {
    await pool.query(
      'UPDATE arguments SET deleted_at = NOW() WHERE id = $1',
      [id]
    );
  },
};
