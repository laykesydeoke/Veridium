import { FastifyInstance } from 'fastify';
import { AchievementModel } from '../models/achievement';

export async function achievementRoutes(fastify: FastifyInstance) {
  fastify.get('/achievements/:address', async (request) => {
    const { address } = request.params as { address: string };
    const achievements = await AchievementModel.findByUser(address);
    return { achievements };
  });

  fastify.get('/achievements', async () => {
    const achievements = await AchievementModel.getRecentAchievements(20);
    return { achievements };
  });
}
