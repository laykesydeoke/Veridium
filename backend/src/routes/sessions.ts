import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SessionModel } from '../models/session';
import { validate } from '../middleware/validator';
import { cacheGet, cacheSet } from '../config/redis';
import { SessionOrchestrator } from '../services/sessionOrchestrator';
import { pool } from '../config/database';

const createSessionSchema = z.object({
  body: z.object({
    sessionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    topic: z.string().min(10).max(500),
    description: z.string().max(2000),
    initiatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    wagerAmount: z.string(),
    metadata: z.record(z.any()).optional(),
  }),
});

const joinSessionSchema = z.object({
  body: z.object({
    challengerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    transactionHash: z.string().optional(),
  }),
});

export async function sessionRoutes(fastify: FastifyInstance) {
  // Get all sessions with filtering
  fastify.get('/sessions', async (request) => {
    const { status, limit = 50, offset = 0, initiator, challenger } = request.query as {
      status?: string;
      limit?: number;
      offset?: number;
      initiator?: string;
      challenger?: string;
    };

    let query = 'SELECT * FROM v_active_sessions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (initiator) {
      query += ` AND initiator_address = $${paramIndex++}`;
      params.push(initiator.toLowerCase());
    }

    if (challenger) {
      query += ` AND challenger_address = $${paramIndex++}`;
      params.push(challenger.toLowerCase());
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      sessions: result.rows,
      pagination: {
        limit,
        offset,
        total: result.rows.length,
      },
    };
  });

  // Search sessions by topic
  fastify.get('/sessions/search', async (request) => {
    const { q, limit = 20 } = request.query as { q: string; limit?: number };

    if (!q || q.length < 3) {
      throw new Error('Search query must be at least 3 characters');
    }

    const result = await pool.query(
      `SELECT * FROM v_active_sessions
       WHERE LOWER(topic) LIKE $1 OR LOWER(description) LIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${q.toLowerCase()}%`, limit]
    );

    return { sessions: result.rows };
  });

  // Get session by ID
  fastify.get('/sessions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const session = await SessionModel.findById(id);

    if (!session) {
      throw new Error('Session not found');
    }

    return { session };
  });

  // Create session
  fastify.post(
    '/sessions',
    {
      preHandler: [fastify.authenticate, validate(createSessionSchema)],
    },
    async (request) => {
      const user = (request as any).user;
      const data = request.body as any;

      // Ensure initiator matches authenticated user
      if (data.initiatorAddress.toLowerCase() !== user.address.toLowerCase()) {
        throw new Error('Initiator address must match authenticated user');
      }

      const session = await SessionOrchestrator.createSession(data);
      return { session };
    }
  );

  // Join session
  fastify.post(
    '/sessions/:id/join',
    {
      preHandler: [fastify.authenticate, validate(joinSessionSchema)],
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const data = request.body as any;

      // Ensure challenger matches authenticated user
      if (data.challengerAddress.toLowerCase() !== user.address.toLowerCase()) {
        throw new Error('Challenger address must match authenticated user');
      }

      const session = await SessionOrchestrator.joinSession(id, data);
      return { session };
    }
  );

  // Start voting phase
  fastify.post(
    '/sessions/:id/start-voting',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      const { votingDurationHours = 24 } = request.body as { votingDurationHours?: number };

      const session = await SessionOrchestrator.startVoting(id, votingDurationHours);
      return { session };
    }
  );

  // Cancel session
  fastify.post(
    '/sessions/:id/cancel',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;
      const { reason } = request.body as { reason?: string };

      const sessionData = await SessionModel.findById(id);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      // Only initiator can cancel
      if (sessionData.initiator_address.toLowerCase() !== user.address.toLowerCase()) {
        throw new Error('Only initiator can cancel session');
      }

      const session = await SessionOrchestrator.cancelSession(id, reason);
      return { session };
    }
  );

  // Forfeit session
  fastify.post(
    '/sessions/:id/forfeit',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = (request as any).user;

      const session = await SessionOrchestrator.forfeitSession(id, user.address);
      return { session };
    }
  );

  // Get user's sessions
  fastify.get('/sessions/user/:address', async (request) => {
    const { address } = request.params as { address: string };
    const { limit = 50 } = request.query as { limit?: number };

    const result = await pool.query(
      `SELECT DISTINCT s.* FROM sessions s
       JOIN session_participants sp ON sp.session_id = s.id
       WHERE sp.user_address = $1 AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [address.toLowerCase(), limit]
    );

    return { sessions: result.rows };
  });
}
