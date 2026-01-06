import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ArgumentModel } from '../models/argument';
import { validate } from '../middleware/validator';

const createArgumentSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    side: z.enum(['initiator', 'challenger']),
    content: z.string().min(10).max(5000),
    parentId: z.string().uuid().optional(),
  }),
});

export async function argumentRoutes(fastify: FastifyInstance) {
  fastify.get('/arguments/session/:sessionId', async (request) => {
    const { sessionId } = request.params as { sessionId: string };
    const arguments = await ArgumentModel.findBySession(sessionId);
    return { arguments };
  });

  fastify.post(
    '/arguments',
    {
      preHandler: [fastify.authenticate, validate(createArgumentSchema)],
    },
    async (request) => {
      const authUser = (request as any).user;
      const data = request.body as any;

      const argument = await ArgumentModel.create({
        session_id: data.sessionId,
        author_address: authUser.address,
        side: data.side,
        content: data.content,
        parent_id: data.parentId,
      });

      return { argument };
    }
  );

  fastify.post(
    '/arguments/:id/upvote',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      const argument = await ArgumentModel.upvote(id);
      return { argument };
    }
  );
}
