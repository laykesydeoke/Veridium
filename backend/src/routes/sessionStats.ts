import { FastifyInstance } from 'fastify';
import { SessionStats } from '../services/sessionStats';

export async function sessionStatsRoutes(fastify: FastifyInstance) {
  // Get session statistics
  fastify.get('/stats/sessions/:id', async (request) => {
    const { id } = request.params as { id: string };
    const stats = await SessionStats.getSessionStats(id);

    if (!stats) {
      throw new Error('Session statistics not found');
    }

    return { stats };
  });

  // Get global statistics
  fastify.get('/stats/global', async () => {
    const stats = await SessionStats.getGlobalStats();
    return { stats };
  });

  // Get user session statistics
  fastify.get('/stats/user/:address', async (request) => {
    const { address } = request.params as { address: string };
    const stats = await SessionStats.getUserSessionStats(address);
    return { stats };
  });
}
