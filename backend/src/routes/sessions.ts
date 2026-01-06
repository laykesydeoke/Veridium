import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SessionModel } from '../models/session';
import { validate } from '../middleware/validator';
import { cacheGet, cacheSet } from '../config/redis';

const createSessionSchema = z.object({
  body: z.object({
    sessionAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    topic: z.string().min(10).max(500),
    description: z.string().max(2000),
    initiatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    wagerAmount: z.string(),
  }),
});

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.get('/sessions', async () => {
    const cacheKey = 'sessions:active';
    const cached = await cacheGet<any[]>(cacheKey);

    if (cached) {
      return { sessions: cached, cached: true };
    }

    const sessions = await SessionModel.getActiveSessions();
    await cacheSet(cacheKey, sessions, 60);

    return { sessions, cached: false };
  });

  fastify.get('/sessions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const session = await SessionModel.findById(id);

    if (!session) {
      throw new Error('Session not found');
    }

    return { session };
  });

  fastify.post(
    '/sessions',
    {
      preHandler: [fastify.authenticate, validate(createSessionSchema)],
    },
    async (request) => {
      const data = request.body as any;

      const session = await SessionModel.create({
        session_address: data.sessionAddress,
        topic: data.topic,
        description: data.description,
        initiator_address: data.initiatorAddress,
        wager_amount: data.wagerAmount,
        status: 'pending',
      });

      return { session };
    }
  );
}
