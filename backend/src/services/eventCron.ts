import { EventQueue } from './eventQueue';
import { pool } from '../config/database';

export const EventCron = {
  /**
   * Retry stuck processing events
   */
  async retryStuckEvents(): Promise<number> {
    console.log('[EventCron] Checking for stuck events');

    // Find events stuck in processing for more than 5 minutes
    const result = await pool.query(
      `UPDATE event_queue
       SET status = 'pending',
           scheduled_for = NOW()
       WHERE status = 'processing'
         AND started_at < NOW() - INTERVAL '5 minutes'
       RETURNING id`
    );

    const count = result.rowCount || 0;
    if (count > 0) {
      console.log(`[EventCron] Reset ${count} stuck events`);
    }

    return count;
  },

  /**
   * Auto-purge old completed events
   */
  async autoPurge(): Promise<number> {
    console.log('[EventCron] Auto-purging old completed events');
    return await EventQueue.purgeCompleted(7); // 7 days
  },

  /**
   * Check for unresolved errors that need attention
   */
  async checkUnresolvedErrors(): Promise<void> {
    const result = await pool.query(
      `SELECT event_name, COUNT(*) as count
       FROM event_errors
       WHERE resolved_at IS NULL
         AND created_at > NOW() - INTERVAL '1 hour'
       GROUP BY event_name
       HAVING COUNT(*) > 5`
    );

    if (result.rows.length > 0) {
      console.warn('[EventCron] High error rate detected:', result.rows);
      // In production, send alerts here
    }
  },

  /**
   * Start cron job for event maintenance
   */
  startMaintenanceCron(): NodeJS.Timeout {
    console.log('[EventCron] Starting event maintenance cron');

    const runMaintenance = async () => {
      try {
        await this.retryStuckEvents();
        await this.checkUnresolvedErrors();

        // Auto-purge every 6 hours
        const hour = new Date().getHours();
        if (hour % 6 === 0) {
          await this.autoPurge();
        }
      } catch (error) {
        console.error('[EventCron] Maintenance error:', error);
      }
    };

    // Run immediately then every 10 minutes
    runMaintenance();
    return setInterval(runMaintenance, 10 * 60 * 1000);
  },
};
