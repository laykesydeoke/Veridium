import { FastifyInstance } from 'fastify';
import { UserModel } from '../models/user';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/users/:address',
    async (request) => {
      const { address } = request.params as { address: string };
      const cacheKey = `user:${address}`;

      const cached = await cacheGet(cacheKey);
      if (cached) {
        return { user: cached, cached: true };
      }

      const user = await UserModel.findByAddress(address);

      if (!user) {
        throw new Error('User not found');
      }

      await cacheSet(cacheKey, user, 300);
      return { user, cached: false };
    }
  );

  fastify.patch(
    '/users/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { id } = request.params as { id: string };
      const authUser = (request as any).user;

      if (authUser.id !== id) {
        throw new Error('Unauthorized');
      }

      const { basename } = request.body as { basename?: string };
      const updated = await UserModel.update(id, { basename });

      await cacheDel(`user:${updated.wallet_address}`);

      return { user: updated };
    }
  );
}
