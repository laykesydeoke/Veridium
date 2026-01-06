import { buildServer } from './server';
import { env } from './config/env';
import { pool } from './config/database';
import { redis } from './config/redis';

const start = async () => {
  try {
    const server = await buildServer();

    await server.listen({
      port: parseInt(env.PORT, 10),
      host: env.HOST,
    });

    const shutdown = async () => {
      server.log.info('Shutting down gracefully...');
      await server.close();
      await pool.end();
      await redis.quit();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
