import { pool } from '../config/database';
import { EventListener } from './eventListener';
import type { Log } from 'viem';

export interface QueuedEvent {
  id: number;
  contractAddress: string;
  eventName: string;
  eventData: any;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export const EventQueue = {
  /**
   * Add event to processing queue
   */
  async enqueue(
    contractAddress: string,
    eventName: string,
    eventData: any,
    priority: number = 0,
    scheduledFor?: Date
  ): Promise<QueuedEvent> {
    const result = await pool.query(
      `INSERT INTO event_queue (
        contract_address, event_name, event_data, priority, scheduled_for
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        contractAddress.toLowerCase(),
        eventName,
        JSON.stringify(eventData),
        priority,
        scheduledFor || new Date(),
      ]
    );

    return this.mapQueuedEvent(result.rows[0]);
  },

  /**
   * Get next pending event to process
   */
  async dequeue(): Promise<QueuedEvent | null> {
    const result = await pool.query(
      `UPDATE event_queue
       SET status = 'processing', started_at = NOW()
       WHERE id = (
         SELECT id FROM event_queue
         WHERE status = 'pending'
           AND scheduled_for <= NOW()
         ORDER BY priority DESC, created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );

    if (result.rows.length === 0) return null;
    return this.mapQueuedEvent(result.rows[0]);
  },

  /**
   * Mark event as completed
   */
  async markCompleted(id: number): Promise<void> {
    await pool.query(
      `UPDATE event_queue
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [id]
    );
  },

  /**
   * Mark event as failed and schedule retry if applicable
   */
  async markFailed(id: number, error: string): Promise<void> {
    const result = await pool.query(
      `UPDATE event_queue
       SET retry_count = retry_count + 1,
           error_message = $2,
           status = CASE
             WHEN retry_count + 1 >= max_retries THEN 'failed'
             ELSE 'pending'
           END,
           scheduled_for = CASE
             WHEN retry_count + 1 < max_retries THEN NOW() + (INTERVAL '1 minute' * POW(2, retry_count + 1))
             ELSE scheduled_for
           END
       WHERE id = $1
       RETURNING retry_count, max_retries`,
      [id, error]
    );

    if (result.rows.length > 0) {
      const { retry_count, max_retries } = result.rows[0];
      console.log(
        `[EventQueue] Event ${id} failed (retry ${retry_count}/${max_retries}): ${error}`
      );
    }
  },

  /**
   * Process a single queued event
   */
  async processEvent(event: QueuedEvent): Promise<void> {
    console.log(`[EventQueue] Processing event ${event.id}: ${event.eventName}`);

    try {
      // Reconstruct log object from stored data
      const log: Log = {
        ...event.eventData,
        args: event.eventData.args || {},
      };

      // Route to appropriate event handler
      switch (event.eventName) {
        case 'SessionCreated':
          await EventListener.processSessionCreated(log, event.contractAddress);
          break;
        case 'EvaluationSubmitted':
          await EventListener.processEvaluationSubmitted(log, event.contractAddress);
          break;
        case 'ResultFinalized':
          await EventListener.processResultFinalized(log, event.contractAddress);
          break;
        case 'AchievementMinted':
          await EventListener.processAchievementMinted(log, event.contractAddress);
          break;
        default:
          console.warn(`[EventQueue] Unknown event type: ${event.eventName}`);
      }

      await this.markCompleted(event.id);
      console.log(`[EventQueue] Event ${event.id} processed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[EventQueue] Error processing event ${event.id}:`, error);
      await this.markFailed(event.id, errorMessage);
    }
  },

  /**
   * Start queue worker
   */
  startWorker(intervalMs: number = 5000): NodeJS.Timeout {
    console.log('[EventQueue] Starting queue worker');

    const processNext = async () => {
      try {
        const event = await this.dequeue();
        if (event) {
          await this.processEvent(event);
        }
      } catch (error) {
        console.error('[EventQueue] Worker error:', error);
      }
    };

    // Process immediately then on interval
    processNext();
    return setInterval(processNext, intervalMs);
  },

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    oldestPending?: Date;
  }> {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        MIN(created_at) FILTER (WHERE status = 'pending') as oldest_pending
       FROM event_queue`
    );

    return {
      pending: parseInt(result.rows[0].pending || 0),
      processing: parseInt(result.rows[0].processing || 0),
      completed: parseInt(result.rows[0].completed || 0),
      failed: parseInt(result.rows[0].failed || 0),
      oldestPending: result.rows[0].oldest_pending,
    };
  },

  /**
   * Get failed events for manual retry
   */
  async getFailedEvents(limit: number = 50): Promise<QueuedEvent[]> {
    const result = await pool.query(
      `SELECT * FROM event_queue
       WHERE status = 'failed'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(this.mapQueuedEvent);
  },

  /**
   * Retry a failed event
   */
  async retryEvent(id: number): Promise<void> {
    await pool.query(
      `UPDATE event_queue
       SET status = 'pending',
           retry_count = 0,
           error_message = NULL,
           scheduled_for = NOW()
       WHERE id = $1 AND status = 'failed'`,
      [id]
    );
  },

  /**
   * Purge completed events older than specified days
   */
  async purgeCompleted(olderThanDays: number = 7): Promise<number> {
    const result = await pool.query(
      `DELETE FROM event_queue
       WHERE status = 'completed'
         AND completed_at < NOW() - INTERVAL '${olderThanDays} days'`
    );

    console.log(`[EventQueue] Purged ${result.rowCount} completed events`);
    return result.rowCount || 0;
  },

  /**
   * Map database row to QueuedEvent
   */
  mapQueuedEvent(row: any): QueuedEvent {
    return {
      id: row.id,
      contractAddress: row.contract_address,
      eventName: row.event_name,
      eventData: typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data,
      priority: row.priority,
      status: row.status,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      errorMessage: row.error_message,
      scheduledFor: row.scheduled_for,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    };
  },
};
