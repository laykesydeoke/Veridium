import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ProfileService } from '../services/profile';
import { BasenameService } from '../services/basename';
import { validate } from '../middleware/validator';

const updateProfileSchema = z.object({
  body: z.object({
    basename: z.string().optional(),
    displayName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
  }),
});

export async function profileRoutes(fastify: FastifyInstance) {
  // Get profile by address
  fastify.get('/profiles/address/:address', async (request) => {
    const { address } = request.params as { address: string };
    const profile = await ProfileService.getProfileByAddress(address);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return { profile };
  });

  // Get profile by basename
  fastify.get('/profiles/basename/:basename', async (request) => {
    const { basename } = request.params as { basename: string };
    const profile = await ProfileService.getProfileByBasename(basename);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return { profile };
  });

  // Search profiles
  fastify.get('/profiles/search', async (request) => {
    const { q, limit = 20 } = request.query as { q: string; limit?: number };

    if (!q || q.length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    const profiles = await ProfileService.searchProfiles(q, limit);
    return { profiles };
  });

  // Get current user profile
  fastify.get(
    '/profiles/me',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = (request as any).user;
      const profile = await ProfileService.getProfileById(user.id);

      if (!profile) {
        throw new Error('Profile not found');
      }

      return { profile };
    }
  );

  // Update profile
  fastify.patch(
    '/profiles/me',
    {
      preHandler: [fastify.authenticate, validate(updateProfileSchema)],
    },
    async (request) => {
      const user = (request as any).user;
      const data = request.body as any;

      const profile = await ProfileService.updateProfile(user.id, data);
      return { profile };
    }
  );

  // Get profile analytics
  fastify.get('/profiles/:address/analytics', async (request) => {
    const { address } = request.params as { address: string };
    const analytics = await ProfileService.getProfileAnalytics(address);
    return { analytics };
  });

  // Get profile history
  fastify.get('/profiles/:address/history', async (request) => {
    const { address } = request.params as { address: string };
    const { limit = 50 } = request.query as { limit?: number };

    const history = await ProfileService.getProfileHistory(address, limit);
    return { history };
  });

  // Batch get profiles
  fastify.post('/profiles/batch', async (request) => {
    const { addresses } = request.body as { addresses: string[] };

    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Addresses array required');
    }

    if (addresses.length > 50) {
      throw new Error('Maximum 50 addresses allowed');
    }

    const profiles = await ProfileService.batchGetProfiles(addresses);
    return { profiles: Object.fromEntries(profiles) };
  });
}
