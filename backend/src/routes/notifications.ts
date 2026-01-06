import { FastifyInstance } from 'fastify';
import { SessionNotifier } from '../services/sessionNotifier';

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications
  fastify.get(
    '/notifications/me',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = (request as any).user;
      const { limit = 50 } = request.query as { limit?: number };

      const notifications = await SessionNotifier.getUserNotifications(
        user.address,
        limit
      );

      return { notifications };
    }
  );

  // Clear user notifications
  fastify.delete(
    '/notifications/me',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = (request as any).user;

      await SessionNotifier.clearUserNotifications(user.address);

      return { success: true };
    }
  );

  // Get notification count
  fastify.get(
    '/notifications/me/count',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const user = (request as any).user;

      const notifications = await SessionNotifier.getUserNotifications(user.address, 100);

      return { count: notifications.length };
    }
  );
}
