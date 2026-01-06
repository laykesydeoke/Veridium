import { pool } from '../config/database';

export interface User {
  id: string;
  wallet_address: string;
  basename?: string;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  async findByAddress(address: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [address.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(address: string, basename?: string): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (wallet_address, basename) VALUES ($1, $2) RETURNING *',
      [address.toLowerCase(), basename]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },
};
