import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { sessionRoutes } from './routes/sessions';
import { userRoutes } from './routes/users';
import { argumentRoutes } from './routes/arguments';
import { achievementRoutes } from './routes/achievements';
import { leaderboardRoutes } from './routes/leaderboard';
import { profileRoutes } from './routes/profiles';
import { basenameRoutes } from './routes/basename';
import { sessionStatsRoutes } from './routes/sessionStats';
import { eventRoutes } from './routes/events';
import { evaluationRoutes } from './routes/evaluations';

export const buildServer = async () => {
  const server = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
  });

  await server.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Veridium API',
        description: 'Backend API for Veridium discourse platform',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
    },
  });

  await server.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  server.decorate('authenticate', authMiddleware);

  server.setErrorHandler(errorHandler);

  await server.register(healthRoutes);
  await server.register(authRoutes, { prefix: '/api' });
  await server.register(sessionRoutes, { prefix: '/api' });
  await server.register(userRoutes, { prefix: '/api' });
  await server.register(argumentRoutes, { prefix: '/api' });
  await server.register(achievementRoutes, { prefix: '/api' });
  await server.register(leaderboardRoutes, { prefix: '/api' });
  await server.register(profileRoutes, { prefix: '/api' });
  await server.register(basenameRoutes, { prefix: '/api' });
  await server.register(sessionStatsRoutes, { prefix: '/api' });
  await server.register(eventRoutes, { prefix: '/api' });
  await server.register(evaluationRoutes, { prefix: '/api' });

  return server;
};
