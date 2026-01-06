import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserModel } from '../models/user';
import { validate } from '../middleware/validator';

const loginSchema = z.object({
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    signature: z.string(),
    message: z.string(),
  }),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/auth/login',
    { preHandler: validate(loginSchema) },
    async (request, reply) => {
      const { address, basename } = request.body as {
        address: string;
        basename?: string;
      };

      let user = await UserModel.findByAddress(address);

      if (!user) {
        user = await UserModel.create(address, basename);
      }

      const token = fastify.jwt.sign({
        id: user.id,
        address: user.wallet_address,
        role: 'user',
      });

      return {
        token,
        user: {
          id: user.id,
          address: user.wallet_address,
          basename: user.basename,
        },
      };
    }
  );

  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const user = (request as any).user;
    const userData = await UserModel.findById(user.id);

    return {
      user: userData,
    };
  });
}
