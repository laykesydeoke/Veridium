import { pool } from '../config/database';
import { SessionModel } from '../models/session';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

export type SessionStatus = 'pending' | 'active' | 'voting' | 'completed' | 'cancelled';

export interface SessionTransition {
  from: SessionStatus;
  to: SessionStatus;
  allowed: boolean;
  requiredConditions?: string[];
}

export interface SessionCreateData {
  sessionAddress: string;
  topic: string;
  description: string;
  initiatorAddress: string;
  wagerAmount: string;
  metadata?: Record<string, any>;
}

export interface SessionJoinData {
  challengerAddress: string;
  transactionHash?: string;
}

export const SessionOrchestrator = {
  /**
   * State machine for session status transitions
   */
  transitions: new Map<string, SessionStatus[]>([
    ['pending', ['active', 'cancelled']],
    ['active', ['voting', 'cancelled']],
    ['voting', ['completed', 'cancelled']],
    ['completed', []],
    ['cancelled', []],
  ]),

  /**
   * Check if a status transition is valid
   */
  canTransition(from: SessionStatus, to: SessionStatus): boolean {
    const allowedTransitions = this.transitions.get(from);
    return allowedTransitions?.includes(to) || false;
  },

  /**
   * Create a new session
   */
  async createSession(data: SessionCreateData) {
    // Validate topic
    if (data.topic.length < 10 || data.topic.length > 500) {
      throw new Error('Topic must be between 10 and 500 characters');
    }

    // Validate wager amount
    const wagerBigInt = BigInt(data.wagerAmount);
    if (wagerBigInt < 0) {
      throw new Error('Wager amount must be non-negative');
    }

    // Check if session address already exists
    const existing = await SessionModel.findByAddress(data.sessionAddress);
    if (existing) {
      throw new Error('Session with this address already exists');
    }

    // Create session participants entry for initiator
    const session = await SessionModel.create({
      session_address: data.sessionAddress,
      topic: data.topic,
      description: data.description,
      initiator_address: data.initiatorAddress,
      wager_amount: data.wagerAmount,
      status: 'pending',
      metadata: data.metadata,
    });

    // Add initiator as participant
    await pool.query(
      'INSERT INTO session_participants (session_id, user_address, role) VALUES ($1, $2, $3)',
      [session.id, data.initiatorAddress.toLowerCase(), 'initiator']
    );

    // Clear active sessions cache
    await cacheDel('sessions:active');

    return session;
  },

  /**
   * Join a session as challenger
   */
  async joinSession(sessionId: string, data: SessionJoinData) {
    const session = await SessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'pending') {
      throw new Error('Can only join pending sessions');
    }

    if (session.challenger_address) {
      throw new Error('Session already has a challenger');
    }

    if (session.initiator_address.toLowerCase() === data.challengerAddress.toLowerCase()) {
      throw new Error('Cannot challenge your own session');
    }

    // Update session with challenger
    await pool.query(
      'UPDATE sessions SET challenger_address = $1, status = $2, start_time = NOW(), updated_at = NOW() WHERE id = $3',
      [data.challengerAddress.toLowerCase(), 'active', sessionId]
    );

    // Add challenger as participant
    await pool.query(
      'INSERT INTO session_participants (session_id, user_address, role) VALUES ($1, $2, $3)',
      [sessionId, data.challengerAddress.toLowerCase(), 'challenger']
    );

    // Clear cache
    await cacheDel('sessions:active');

    const updated = await SessionModel.findById(sessionId);
    return updated;
  },

  /**
   * Transition session to voting phase
   */
  async startVoting(sessionId: string, votingDurationHours: number = 24) {
    const session = await SessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!this.canTransition(session.status as SessionStatus, 'voting')) {
      throw new Error(`Cannot transition from ${session.status} to voting`);
    }

    const votingEndTime = new Date();
    votingEndTime.setHours(votingEndTime.getHours() + votingDurationHours);

    await pool.query(
      'UPDATE sessions SET status = $1, voting_end_time = $2, updated_at = NOW() WHERE id = $3',
      ['voting', votingEndTime, sessionId]
    );

    await cacheDel('sessions:active');

    return SessionModel.findById(sessionId);
  },

  /**
   * Complete a session with a winner
   */
  async completeSession(sessionId: string, winnerAddress?: string) {
    const session = await SessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!this.canTransition(session.status as SessionStatus, 'completed')) {
      throw new Error(`Cannot transition from ${session.status} to completed`);
    }

    await pool.query(
      'UPDATE sessions SET status = $1, winner_address = $2, end_time = NOW(), updated_at = NOW() WHERE id = $3',
      ['completed', winnerAddress?.toLowerCase(), sessionId]
    );

    await cacheDel('sessions:active');

    return SessionModel.findById(sessionId);
  },

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, reason?: string) {
    const session = await SessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new Error('Cannot cancel a completed or already cancelled session');
    }

    const metadata = session.metadata || {};
    if (reason) {
      metadata.cancellationReason = reason;
    }

    await pool.query(
      'UPDATE sessions SET status = $1, metadata = $2, updated_at = NOW() WHERE id = $3',
      ['cancelled', JSON.stringify(metadata), sessionId]
    );

    await cacheDel('sessions:active');

    return SessionModel.findById(sessionId);
  },

  /**
   * Forfeit a session
   */
  async forfeitSession(sessionId: string, forfeitingAddress: string) {
    const session = await SessionModel.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active' && session.status !== 'voting') {
      throw new Error('Can only forfeit active or voting sessions');
    }

    const isInitiator = session.initiator_address.toLowerCase() === forfeitingAddress.toLowerCase();
    const isChallenger = session.challenger_address?.toLowerCase() === forfeitingAddress.toLowerCase();

    if (!isInitiator && !isChallenger) {
      throw new Error('Only participants can forfeit');
    }

    // Winner is the other participant
    const winnerAddress = isInitiator ? session.challenger_address : session.initiator_address;

    const metadata = session.metadata || {};
    metadata.forfeitedBy = forfeitingAddress.toLowerCase();
    metadata.forfeitReason = 'forfeit';

    await pool.query(
      'UPDATE sessions SET status = $1, winner_address = $2, end_time = NOW(), metadata = $3, updated_at = NOW() WHERE id = $4',
      ['completed', winnerAddress?.toLowerCase(), JSON.stringify(metadata), sessionId]
    );

    await cacheDel('sessions:active');

    return SessionModel.findById(sessionId);
  },

  /**
   * Check and expire sessions past voting deadline
   */
  async checkExpiredSessions(): Promise<number> {
    const result = await pool.query(
      `SELECT id FROM sessions
       WHERE status = 'voting'
         AND voting_end_time IS NOT NULL
         AND voting_end_time < NOW()
         AND deleted_at IS NULL`
    );

    let expiredCount = 0;

    for (const row of result.rows) {
      try {
        // Determine winner based on votes
        const voteResult = await pool.query(
          `SELECT
             SUM(CASE WHEN vote = 'initiator' THEN weight ELSE 0 END) as initiator_weight,
             SUM(CASE WHEN vote = 'challenger' THEN weight ELSE 0 END) as challenger_weight
           FROM evaluations
           WHERE session_id = $1`,
          [row.id]
        );

        const votes = voteResult.rows[0];
        const initiatorWeight = parseInt(votes.initiator_weight || 0);
        const challengerWeight = parseInt(votes.challenger_weight || 0);

        const session = await SessionModel.findById(row.id);
        let winnerAddress = null;

        if (initiatorWeight > challengerWeight) {
          winnerAddress = session?.initiator_address;
        } else if (challengerWeight > initiatorWeight) {
          winnerAddress = session?.challenger_address;
        }
        // If tie, winnerAddress remains null

        await this.completeSession(row.id, winnerAddress || undefined);
        expiredCount++;
      } catch (error) {
        console.error(`Failed to expire session ${row.id}:`, error);
      }
    }

    return expiredCount;
  },
};
