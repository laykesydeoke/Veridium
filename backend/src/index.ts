import { buildServer } from './server';
import { env } from './config/env';
import { pool } from './config/database';
import { redis } from './config/redis';
import { SessionCron } from './services/sessionCron';
import { EventWatcher } from './services/eventWatcher';
import { EventQueue } from './services/eventQueue';
import { EventCron } from './services/eventCron';

const start = async () => {
  try {
    const server = await buildServer();

    await server.listen({
      port: parseInt(env.PORT, 10),
      host: env.HOST,
    });

    // Start session expiration cron job
    const sessionCronInterval = SessionCron.startExpirationCron();
    server.log.info('Session expiration cron job started');

    // Initialize event listener system
    await EventWatcher.initialize();
    server.log.info('Event watchers initialized');

    // Start event queue worker
    const queueWorkerInterval = EventQueue.startWorker();
    server.log.info('Event queue worker started');

    // Start event maintenance cron
    const eventCronInterval = EventCron.startMaintenanceCron();
    server.log.info('Event maintenance cron job started');

    const shutdown = async () => {
      server.log.info('Shutting down gracefully...');

      // Stop cron jobs
      SessionCron.stopCron(sessionCronInterval);
      clearInterval(queueWorkerInterval);
      clearInterval(eventCronInterval);

      // Stop event watchers
      EventWatcher.stopAll();

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
