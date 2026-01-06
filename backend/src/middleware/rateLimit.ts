import { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../config/redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (request: FastifyRequest) => string;
}

export const createRateLimiter = (config: RateLimitConfig) => {
  const { windowMs, max, keyGenerator } = config;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = keyGenerator
      ? keyGenerator(request)
      : `ratelimit:${request.ip}`;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    const ttl = await redis.pttl(key);

    reply.header('X-RateLimit-Limit', max);
    reply.header('X-RateLimit-Remaining', Math.max(0, max - current));
    reply.header('X-RateLimit-Reset', Date.now() + ttl);

    if (current > max) {
      reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(ttl / 1000),
      });
    }
  };
};

// Specific rate limiters
export const profileRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (request) => {
    const user = (request as any).user;
    return user ? `ratelimit:profile:${user.id}` : `ratelimit:profile:${request.ip}`;
  },
});

export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (request) => `ratelimit:search:${request.ip}`,
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (request) => `ratelimit:auth:${request.ip}`,
});
