import { FastifyInstance } from 'fastify';
import { pool } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/leaderboard', async (request) => {
    const { limit = 50 } = request.query as { limit?: number };
    const cacheKey = `leaderboard:${limit}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return { leaderboard: cached, cached: true };
    }

    const result = await pool.query(
      'SELECT * FROM v_credibility_leaderboard LIMIT $1',
      [limit]
    );

    await cacheSet(cacheKey, result.rows, 300);
    return { leaderboard: result.rows, cached: false };
  });

  fastify.get('/leaderboard/:address/rank', async (request) => {
    const { address } = request.params as { address: string };

    const result = await pool.query(
      'SELECT rank FROM v_credibility_leaderboard WHERE user_address = $1',
      [address.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return { rank: null };
    }

    return { rank: result.rows[0].rank };
  });
}
