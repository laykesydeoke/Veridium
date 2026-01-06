import { SessionModel } from '../models/session';
import { pool } from '../config/database';

export const SessionValidator = {
  /**
   * Validate session creation data
   */
  async validateSessionCreation(data: {
    topic: string;
    description: string;
    initiatorAddress: string;
    wagerAmount: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Topic validation
    if (!data.topic || data.topic.length < 10) {
      errors.push('Topic must be at least 10 characters');
    }
    if (data.topic && data.topic.length > 500) {
      errors.push('Topic must be at most 500 characters');
    }

    // Description validation
    if (data.description && data.description.length > 2000) {
      errors.push('Description must be at most 2000 characters');
    }

    // Wager validation
    try {
      const wager = BigInt(data.wagerAmount);
      if (wager < 0) {
        errors.push('Wager amount must be non-negative');
      }
    } catch {
      errors.push('Invalid wager amount format');
    }

    // Check if user has too many pending sessions
    const pendingCount = await pool.query(
      `SELECT COUNT(*) as count FROM sessions
       WHERE initiator_address = $1 AND status = 'pending' AND deleted_at IS NULL`,
      [data.initiatorAddress.toLowerCase()]
    );

    if (parseInt(pendingCount.rows[0].count) >= 5) {
      errors.push('Too many pending sessions. Please complete or cancel existing sessions.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate session join
   */
  async validateSessionJoin(
    sessionId: string,
    challengerAddress: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const session = await SessionModel.findById(sessionId);

    if (!session) {
      errors.push('Session not found');
      return { valid: false, errors };
    }

    if (session.status !== 'pending') {
      errors.push('Session is not in pending status');
    }

    if (session.challenger_address) {
      errors.push('Session already has a challenger');
    }

    if (session.initiator_address.toLowerCase() === challengerAddress.toLowerCase()) {
      errors.push('Cannot join your own session');
    }

    // Check if user is already in an active session
    const activeSession = await pool.query(
      `SELECT COUNT(*) as count FROM session_participants sp
       JOIN sessions s ON s.id = sp.session_id
       WHERE sp.user_address = $1
         AND s.status IN ('active', 'voting')
         AND s.deleted_at IS NULL`,
      [challengerAddress.toLowerCase()]
    );

    if (parseInt(activeSession.rows[0].count) > 0) {
      errors.push('You are already in an active session');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate voting start
   */
  async validateVotingStart(sessionId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const session = await SessionModel.findById(sessionId);

    if (!session) {
      errors.push('Session not found');
      return { valid: false, errors };
    }

    if (session.status !== 'active') {
      errors.push('Session must be active to start voting');
    }

    if (!session.challenger_address) {
      errors.push('Session must have a challenger');
    }

    // Check if session has minimum duration (e.g., 30 minutes)
    if (session.start_time) {
      const duration = Date.now() - new Date(session.start_time).getTime();
      const minDuration = 30 * 60 * 1000; // 30 minutes

      if (duration < minDuration) {
        errors.push('Session must run for at least 30 minutes before voting can start');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate session metadata
   */
  validateMetadata(metadata: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      errors.push('Metadata must be an object');
      return { valid: false, errors };
    }

    // Check metadata size
    const metadataString = JSON.stringify(metadata);
    if (metadataString.length > 10000) {
      errors.push('Metadata is too large (max 10KB)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
