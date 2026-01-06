import { FastifyInstance } from 'fastify';
import { EventQueue } from '../services/eventQueue';
import { EventWatcher } from '../services/eventWatcher';
import { EventListener } from '../services/eventListener';
import { pool } from '../config/database';
import { authenticateUser } from '../middleware/auth';

export async function eventRoutes(fastify: FastifyInstance) {
  /**
   * Get event processing queue statistics
   */
  fastify.get('/events/queue/stats', async (request, reply) => {
    const stats = await EventQueue.getStats();
    return { success: true, data: stats };
  });

  /**
   * Get failed events
   */
  fastify.get('/events/queue/failed', async (request, reply) => {
    const { limit = 50 } = request.query as { limit?: number };
    const failedEvents = await EventQueue.getFailedEvents(limit);
    return { success: true, data: failedEvents };
  });

  /**
   * Retry a failed event (admin only)
   */
  fastify.post(
    '/events/queue/retry/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await EventQueue.retryEvent(parseInt(id));
      return { success: true, message: 'Event queued for retry' };
    }
  );

  /**
   * Purge completed events (admin only)
   */
  fastify.post(
    '/events/queue/purge',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { olderThanDays = 7 } = request.body as { olderThanDays?: number };
      const purged = await EventQueue.purgeCompleted(olderThanDays);
      return { success: true, message: `Purged ${purged} events` };
    }
  );

  /**
   * Get event watcher status
   */
  fastify.get('/events/watcher/status', async (request, reply) => {
    const status = EventWatcher.getStatus();
    return { success: true, data: status };
  });

  /**
   * Get event watcher health check
   */
  fastify.get('/events/watcher/health', async (request, reply) => {
    const health = await EventWatcher.healthCheck();
    return { success: true, data: health };
  });

  /**
   * Start watching a contract (admin only)
   */
  fastify.post(
    '/events/watcher/watch',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { contractAddress, events } = request.body as {
        contractAddress: string;
        events: string[];
      };

      await EventWatcher.watchContract(contractAddress, events);
      return { success: true, message: `Started watching ${contractAddress}` };
    }
  );

  /**
   * Stop watching a contract (admin only)
   */
  fastify.post(
    '/events/watcher/unwatch',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { contractAddress } = request.body as { contractAddress: string };
      EventWatcher.stopWatchingContract(contractAddress);
      return { success: true, message: `Stopped watching ${contractAddress}` };
    }
  );

  /**
   * Replay missed events for a contract (admin only)
   */
  fastify.post(
    '/events/replay',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { contractAddress, fromBlock } = request.body as {
        contractAddress: string;
        fromBlock?: string;
      };

      const count = await EventWatcher.replayMissedEvents(
        contractAddress,
        fromBlock ? BigInt(fromBlock) : undefined
      );

      return { success: true, message: `Replayed ${count} events` };
    }
  );

  /**
   * Get event processing health view
   */
  fastify.get('/events/health', async (request, reply) => {
    const result = await pool.query('SELECT * FROM v_event_processing_health');
    return { success: true, data: result.rows };
  });

  /**
   * Get event error summary
   */
  fastify.get('/events/errors/summary', async (request, reply) => {
    const result = await pool.query('SELECT * FROM v_event_error_summary');
    return { success: true, data: result.rows };
  });

  /**
   * Get recent event logs
   */
  fastify.get('/events/logs', async (request, reply) => {
    const { limit = 100, contractAddress, eventName } = request.query as {
      limit?: number;
      contractAddress?: string;
      eventName?: string;
    };

    let query = 'SELECT * FROM event_logs WHERE 1=1';
    const params: any[] = [];

    if (contractAddress) {
      params.push(contractAddress.toLowerCase());
      query += ` AND contract_address = $${params.length}`;
    }

    if (eventName) {
      params.push(eventName);
      query += ` AND event_name = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY processed_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    return { success: true, data: result.rows };
  });

  /**
   * Get checkpoint for a contract
   */
  fastify.get('/events/checkpoint/:contractAddress', async (request, reply) => {
    const { contractAddress } = request.params as { contractAddress: string };
    const checkpoint = await EventListener.getCheckpoint(contractAddress);
    return { success: true, data: checkpoint };
  });

  /**
   * Get all checkpoints
   */
  fastify.get('/events/checkpoints', async (request, reply) => {
    const result = await pool.query(
      'SELECT * FROM event_checkpoints ORDER BY last_updated DESC'
    );
    return { success: true, data: result.rows };
  });

  /**
   * Get event errors for a contract
   */
  fastify.get('/events/errors/:contractAddress', async (request, reply) => {
    const { contractAddress } = request.params as { contractAddress: string };
    const { limit = 50, unresolved } = request.query as {
      limit?: number;
      unresolved?: boolean;
    };

    let query = 'SELECT * FROM event_errors WHERE contract_address = $1';
    if (unresolved) {
      query += ' AND resolved_at IS NULL';
    }
    query += ' ORDER BY created_at DESC LIMIT $2';

    const result = await pool.query(query, [contractAddress.toLowerCase(), limit]);
    return { success: true, data: result.rows };
  });

  /**
   * Mark an event error as resolved (admin only)
   */
  fastify.post(
    '/events/errors/resolve/:id',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await pool.query(
        'UPDATE event_errors SET resolved_at = NOW() WHERE id = $1',
        [id]
      );
      return { success: true, message: 'Error marked as resolved' };
    }
  );

  /**
   * Get event processing statistics
   */
  fastify.get('/events/stats', async (request, reply) => {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT contract_address) as unique_contracts,
        COUNT(DISTINCT event_name) as unique_event_types,
        MIN(processed_at) as first_event,
        MAX(processed_at) as last_event
      FROM event_logs
    `);

    const errorResult = await pool.query(`
      SELECT
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved_errors
      FROM event_errors
    `);

    return {
      success: true,
      data: {
        ...result.rows[0],
        ...errorResult.rows[0],
      },
    };
  });
}
