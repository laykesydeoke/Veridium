import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserModel } from '../models/user';
import { validate } from '../middleware/validator';
import { VerificationService } from '../services/verification';
import { BasenameService } from '../services/basename';

const loginSchema = z.object({
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    signature: z.string(),
    message: z.string(),
  }),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Get verification challenge
  fastify.post('/auth/challenge', async (request) => {
    const { address } = request.body as { address: string };

    if (!VerificationService.isValidAddress(address)) {
      throw new Error('Invalid address format');
    }

    const challenge = VerificationService.generateChallenge(address);
    return { challenge };
  });

  // Login with signature verification
  fastify.post(
    '/auth/login',
    { preHandler: validate(loginSchema) },
    async (request, reply) => {
      const { address, signature, message } = request.body as {
        address: string;
        signature: string;
        message: string;
      };

      // Verify signature
      const valid = await VerificationService.verifySignature(
        address,
        message,
        signature
      );

      if (!valid) {
        throw new Error('Invalid signature');
      }

      let user = await UserModel.findByAddress(address);

      if (!user) {
        // Try to resolve basename
        const basename = await BasenameService.reverseResolve(address);
        user = await UserModel.create(address, basename || undefined);
      }

      // Update verification status if needed
      if (!user.is_verified) {
        await VerificationService.verifyChallengeAndUpdateUser(
          address,
          message,
          signature
        );
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
