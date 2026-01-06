import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { env } from '../config/env';
import { pool } from '../config/database';
import { redis } from '../config/redis';

const chain = env.CHAIN_ID === '8453' ? base : baseSepolia;

const publicClient = createPublicClient({
  chain,
  transport: http(env.BASE_RPC_URL),
});

export interface EventCheckpoint {
  contractAddress: string;
  lastProcessedBlock: bigint;
  lastUpdated: Date;
}

export const EventListener = {
  /**
   * Get or create checkpoint for a contract
   */
  async getCheckpoint(contractAddress: string): Promise<EventCheckpoint> {
    const result = await pool.query(
      'SELECT * FROM event_checkpoints WHERE contract_address = $1',
      [contractAddress.toLowerCase()]
    );

    if (result.rows.length > 0) {
      return {
        contractAddress: result.rows[0].contract_address,
        lastProcessedBlock: BigInt(result.rows[0].last_processed_block),
        lastUpdated: result.rows[0].last_updated,
      };
    }

    // Create new checkpoint
    const currentBlock = await publicClient.getBlockNumber();
    await pool.query(
      'INSERT INTO event_checkpoints (contract_address, last_processed_block) VALUES ($1, $2)',
      [contractAddress.toLowerCase(), currentBlock.toString()]
    );

    return {
      contractAddress: contractAddress.toLowerCase(),
      lastProcessedBlock: currentBlock,
      lastUpdated: new Date(),
    };
  },

  /**
   * Update checkpoint
   */
  async updateCheckpoint(contractAddress: string, blockNumber: bigint): Promise<void> {
    await pool.query(
      'UPDATE event_checkpoints SET last_processed_block = $1, last_updated = NOW() WHERE contract_address = $2',
      [blockNumber.toString(), contractAddress.toLowerCase()]
    );
  },

  /**
   * Process session created events
   */
  async processSessionCreated(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing SessionCreated event:', log);

    const { sessionId, initiator, challenger, wagerAmount, topic } = log.args as any;

    try {
      // Check if already processed
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) {
        console.log('[EventListener] Event already processed, skipping');
        return;
      }

      // Sync to database
      await pool.query(
        `INSERT INTO sessions (session_address, topic, initiator_address, challenger_address, wager_amount, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (session_address) DO UPDATE SET
           challenger_address = EXCLUDED.challenger_address,
           updated_at = NOW()`,
        [contractAddress, topic, initiator, challenger, wagerAmount?.toString(), 'pending']
      );

      // Log event
      await this.logEvent(log, 'SessionCreated', contractAddress);
      console.log('[EventListener] SessionCreated processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing SessionCreated:', error);
      await this.logEventError(log, 'SessionCreated', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process evaluation submitted events
   */
  async processEvaluationSubmitted(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing EvaluationSubmitted event:', log);

    const { sessionId, evaluator, vote, weight, reasoning } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      // Find session by address
      const session = await pool.query(
        'SELECT id FROM sessions WHERE session_address = $1',
        [contractAddress]
      );

      if (session.rows.length > 0) {
        await pool.query(
          `INSERT INTO evaluations (session_id, evaluator_address, vote, weight, reasoning)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [session.rows[0].id, evaluator, vote, weight, reasoning]
        );

        // Add evaluator as participant
        await pool.query(
          `INSERT INTO session_participants (session_id, user_address, role)
           VALUES ($1, $2, 'evaluator')
           ON CONFLICT DO NOTHING`,
          [session.rows[0].id, evaluator]
        );
      }

      await this.logEvent(log, 'EvaluationSubmitted', contractAddress);
      console.log('[EventListener] EvaluationSubmitted processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing EvaluationSubmitted:', error);
      await this.logEventError(log, 'EvaluationSubmitted', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process result finalized events
   */
  async processResultFinalized(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing ResultFinalized event:', log);

    const { sessionId, winner, initiatorWeight, challengerWeight } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      await pool.query(
        `UPDATE sessions SET
           status = 'completed',
           winner_address = $1,
           initiator_votes = $2,
           challenger_votes = $3,
           end_time = NOW()
         WHERE session_address = $4`,
        [winner, initiatorWeight, challengerWeight, contractAddress]
      );

      await this.logEvent(log, 'ResultFinalized', contractAddress);
      console.log('[EventListener] ResultFinalized processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing ResultFinalized:', error);
      await this.logEventError(log, 'ResultFinalized', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process achievement minted events
   */
  async processAchievementMinted(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing AchievementMinted event:', log);

    const { recipient, achievementType, tokenId } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      await pool.query(
        `INSERT INTO achievements (user_address, achievement_type, token_id, transaction_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_address, achievement_type) DO UPDATE SET
           token_id = EXCLUDED.token_id,
           transaction_hash = EXCLUDED.transaction_hash`,
        [recipient, achievementType, tokenId?.toString(), log.transactionHash]
      );

      await this.logEvent(log, 'AchievementMinted', contractAddress);
      console.log('[EventListener] AchievementMinted processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing AchievementMinted:', error);
      await this.logEventError(log, 'AchievementMinted', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process wager deposit events
   */
  async processWagerDeposited(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing WagerDeposited event:', log);

    const { participant, amount } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      // Find session by address
      const session = await pool.query(
        'SELECT id FROM sessions WHERE session_address = $1',
        [contractAddress]
      );

      if (session.rows.length > 0) {
        // Record as credibility event
        await pool.query(
          `INSERT INTO credibility_events (user_address, event_type, session_id, points, metadata)
           VALUES ($1, 'wager_placed', $2, 0, $3::jsonb)`,
          [participant, session.rows[0].id, JSON.stringify({ amount: amount?.toString() })]
        );
      }

      await this.logEvent(log, 'WagerDeposited', contractAddress);
      console.log('[EventListener] WagerDeposited processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing WagerDeposited:', error);
      await this.logEventError(log, 'WagerDeposited', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process challenger joined events
   */
  async processChallengerJoined(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing ChallengerJoined event:', log);

    const { challenger, timestamp } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      // Update session status
      await pool.query(
        `UPDATE sessions SET
           status = 'active',
           challenger_address = $1,
           start_time = to_timestamp($2),
           updated_at = NOW()
         WHERE session_address = $3`,
        [challenger, Number(timestamp), contractAddress]
      );

      // Find session
      const session = await pool.query(
        'SELECT id FROM sessions WHERE session_address = $1',
        [contractAddress]
      );

      if (session.rows.length > 0) {
        // Add challenger as participant
        await pool.query(
          `INSERT INTO session_participants (session_id, user_address, role)
           VALUES ($1, $2, 'challenger')
           ON CONFLICT DO NOTHING`,
          [session.rows[0].id, challenger]
        );
      }

      await this.logEvent(log, 'ChallengerJoined', contractAddress);
      console.log('[EventListener] ChallengerJoined processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing ChallengerJoined:', error);
      await this.logEventError(log, 'ChallengerJoined', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process voting started events
   */
  async processVotingStarted(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing VotingStarted event:', log);

    const { votingEndTime } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      await pool.query(
        `UPDATE sessions SET
           status = 'voting',
           voting_end_time = to_timestamp($1),
           updated_at = NOW()
         WHERE session_address = $2`,
        [Number(votingEndTime), contractAddress]
      );

      await this.logEvent(log, 'VotingStarted', contractAddress);
      console.log('[EventListener] VotingStarted processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing VotingStarted:', error);
      await this.logEventError(log, 'VotingStarted', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process session cancelled events
   */
  async processSessionCancelled(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing SessionCancelled event:', log);

    const { reason, timestamp } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      // Get current metadata
      const session = await pool.query(
        'SELECT metadata FROM sessions WHERE session_address = $1',
        [contractAddress]
      );

      const metadata = session.rows[0]?.metadata || {};
      metadata.cancellationReason = reason;

      await pool.query(
        `UPDATE sessions SET
           status = 'cancelled',
           metadata = $1::jsonb,
           end_time = to_timestamp($2),
           updated_at = NOW()
         WHERE session_address = $3`,
        [JSON.stringify(metadata), Number(timestamp), contractAddress]
      );

      await this.logEvent(log, 'SessionCancelled', contractAddress);
      console.log('[EventListener] SessionCancelled processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing SessionCancelled:', error);
      await this.logEventError(log, 'SessionCancelled', contractAddress, error);
      throw error;
    }
  },

  /**
   * Process credibility updated events
   */
  async processCredibilityUpdated(log: Log, contractAddress: string): Promise<void> {
    console.log('[EventListener] Processing CredibilityUpdated event:', log);

    const { user, newScore, eventType } = log.args as any;

    try {
      const existing = await pool.query(
        'SELECT id FROM event_logs WHERE transaction_hash = $1 AND log_index = $2',
        [log.transactionHash, log.logIndex]
      );

      if (existing.rows.length > 0) return;

      await pool.query(
        `INSERT INTO credibility_events (user_address, event_type, points, metadata)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [user, eventType, newScore, JSON.stringify({ transactionHash: log.transactionHash })]
      );

      await this.logEvent(log, 'CredibilityUpdated', contractAddress);
      console.log('[EventListener] CredibilityUpdated processed successfully');
    } catch (error) {
      console.error('[EventListener] Error processing CredibilityUpdated:', error);
      await this.logEventError(log, 'CredibilityUpdated', contractAddress, error);
      throw error;
    }
  },

  /**
   * Log processed event
   */
  async logEvent(log: Log, eventName: string, contractAddress: string): Promise<void> {
    await pool.query(
      `INSERT INTO event_logs (
        contract_address, event_name, transaction_hash, block_number,
        log_index, processed_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        contractAddress.toLowerCase(),
        eventName,
        log.transactionHash,
        log.blockNumber?.toString(),
        log.logIndex,
      ]
    );
  },

  /**
   * Log event processing error
   */
  async logEventError(log: Log, eventName: string, contractAddress: string, error: any): Promise<void> {
    await pool.query(
      `INSERT INTO event_errors (
        contract_address, event_name, transaction_hash, block_number,
        log_index, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        contractAddress.toLowerCase(),
        eventName,
        log.transactionHash,
        log.blockNumber?.toString(),
        log.logIndex,
        error instanceof Error ? error.message : String(error),
      ]
    );
  },

  /**
   * Replay missed events
   */
  async replayEvents(contractAddress: string, fromBlock?: bigint): Promise<number> {
    const checkpoint = await this.getCheckpoint(contractAddress);
    const startBlock = fromBlock || checkpoint.lastProcessedBlock;
    const currentBlock = await publicClient.getBlockNumber();

    console.log(`[EventListener] Replaying events from block ${startBlock} to ${currentBlock}`);

    let processedCount = 0;

    // Get all logs in batches
    const batchSize = 1000n;
    for (let block = startBlock; block <= currentBlock; block += batchSize) {
      const toBlock = block + batchSize > currentBlock ? currentBlock : block + batchSize;

      const logs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        fromBlock: block,
        toBlock,
      });

      for (const log of logs) {
        // Process based on event signature
        // This is a simplified version - in production, you'd decode event topics
        processedCount++;
      }
    }

    await this.updateCheckpoint(contractAddress, currentBlock);
    return processedCount;
  },
};
