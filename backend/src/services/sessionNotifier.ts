import { pool } from '../config/database';
import { redis } from '../config/redis';

export interface Notification {
  type: 'session_created' | 'session_joined' | 'voting_started' | 'session_completed' | 'session_cancelled' | 'session_forfeited';
  sessionId: string;
  recipientAddress: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export const SessionNotifier = {
  /**
   * Queue a notification
   */
  async queueNotification(notification: Omit<Notification, 'createdAt'>): Promise<void> {
    const notificationKey = `notification:${notification.recipientAddress}:${Date.now()}`;

    await redis.rpush('notifications:queue', JSON.stringify({
      ...notification,
      createdAt: new Date().toISOString(),
    }));

    // Also store in Redis with TTL for quick access
    await redis.setex(notificationKey, 86400, JSON.stringify(notification)); // 24 hours
  },

  /**
   * Notify session created
   */
  async notifySessionCreated(sessionId: string, initiatorAddress: string): Promise<void> {
    await this.queueNotification({
      type: 'session_created',
      sessionId,
      recipientAddress: initiatorAddress,
      metadata: {
        message: 'Your session has been created and is waiting for a challenger',
      },
    });
  },

  /**
   * Notify session joined
   */
  async notifySessionJoined(
    sessionId: string,
    initiatorAddress: string,
    challengerAddress: string
  ): Promise<void> {
    // Notify initiator
    await this.queueNotification({
      type: 'session_joined',
      sessionId,
      recipientAddress: initiatorAddress,
      metadata: {
        message: 'A challenger has joined your session',
        challengerAddress,
      },
    });

    // Notify challenger
    await this.queueNotification({
      type: 'session_joined',
      sessionId,
      recipientAddress: challengerAddress,
      metadata: {
        message: 'You have successfully joined the session',
      },
    });
  },

  /**
   * Notify voting started
   */
  async notifyVotingStarted(sessionId: string): Promise<void> {
    // Get all participants
    const participants = await pool.query(
      'SELECT DISTINCT user_address FROM session_participants WHERE session_id = $1',
      [sessionId]
    );

    for (const participant of participants.rows) {
      await this.queueNotification({
        type: 'voting_started',
        sessionId,
        recipientAddress: participant.user_address,
        metadata: {
          message: 'Voting has started for your session',
        },
      });
    }
  },

  /**
   * Notify session completed
   */
  async notifySessionCompleted(
    sessionId: string,
    winnerAddress?: string
  ): Promise<void> {
    // Get all participants
    const participants = await pool.query(
      'SELECT DISTINCT user_address FROM session_participants WHERE session_id = $1',
      [sessionId]
    );

    for (const participant of participants.rows) {
      const isWinner = winnerAddress?.toLowerCase() === participant.user_address.toLowerCase();

      await this.queueNotification({
        type: 'session_completed',
        sessionId,
        recipientAddress: participant.user_address,
        metadata: {
          message: isWinner ? 'Congratulations! You won the session' : 'The session has been completed',
          winnerAddress,
        },
      });
    }
  },

  /**
   * Notify session cancelled
   */
  async notifySessionCancelled(sessionId: string, reason?: string): Promise<void> {
    // Get all participants
    const participants = await pool.query(
      'SELECT DISTINCT user_address FROM session_participants WHERE session_id = $1',
      [sessionId]
    );

    for (const participant of participants.rows) {
      await this.queueNotification({
        type: 'session_cancelled',
        sessionId,
        recipientAddress: participant.user_address,
        metadata: {
          message: 'The session has been cancelled',
          reason,
        },
      });
    }
  },

  /**
   * Get user notifications
   */
  async getUserNotifications(userAddress: string, limit: number = 50): Promise<Notification[]> {
    const pattern = `notification:${userAddress}:*`;
    const keys = await redis.keys(pattern);

    const notifications: Notification[] = [];

    for (const key of keys.slice(0, limit)) {
      const data = await redis.get(key);
      if (data) {
        notifications.push(JSON.parse(data));
      }
    }

    return notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Clear user notifications
   */
  async clearUserNotifications(userAddress: string): Promise<void> {
    const pattern = `notification:${userAddress}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
