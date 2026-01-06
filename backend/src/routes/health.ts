import { FastifyInstance } from 'fastify';
import { pool } from '../config/database';
import { redis } from '../config/redis';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'veridium-backend',
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/health/ready', async (request, reply) => {
    try {
      await pool.query('SELECT 1');
      await redis.ping();

      return {
        status: 'ready',
        database: 'connected',
        cache: 'connected',
      };
    } catch (error) {
      reply.code(503).send({
        status: 'not ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.get('/health/live', async () => {
    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  });
}
