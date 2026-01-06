import { SessionOrchestrator } from './sessionOrchestrator';
import { SessionNotifier } from './sessionNotifier';

export const SessionCron = {
  /**
   * Check and expire sessions (should run periodically)
   */
  async runExpirationCheck(): Promise<void> {
    try {
      console.log('[SessionCron] Running expiration check...');
      const expiredCount = await SessionOrchestrator.checkExpiredSessions();
      console.log(`[SessionCron] Expired ${expiredCount} sessions`);
    } catch (error) {
      console.error('[SessionCron] Expiration check failed:', error);
    }
  },

  /**
   * Start periodic expiration checks (every 5 minutes)
   */
  startExpirationCron(): NodeJS.Timeout {
    console.log('[SessionCron] Starting expiration cron job');

    // Run immediately
    this.runExpirationCheck();

    // Then run every 5 minutes
    return setInterval(() => {
      this.runExpirationCheck();
    }, 5 * 60 * 1000);
  },

  /**
   * Stop cron job
   */
  stopCron(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    console.log('[SessionCron] Stopped expiration cron job');
  },
};
