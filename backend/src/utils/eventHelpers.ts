import type { Log } from 'viem';
import { EventSignatures, getEventNameFromSignature } from '../contracts/abis';

/**
 * Event helper utilities
 */
export const EventHelpers = {
  /**
   * Decode event name from log
   */
  decodeEventName(log: Log): string | undefined {
    const signature = log.topics[0];
    return getEventNameFromSignature(signature);
  },

  /**
   * Check if event should be processed
   */
  shouldProcessEvent(eventName: string, allowedEvents: string[]): boolean {
    return allowedEvents.includes(eventName);
  },

  /**
   * Format event for logging
   */
  formatEventForLog(log: Log): string {
    return `${this.decodeEventName(log) || 'Unknown'} at block ${log.blockNumber} (tx: ${log.transactionHash?.slice(0, 10)}...)`;
  },

  /**
   * Extract contract address from log
   */
  getContractAddress(log: Log): string {
    return log.address.toLowerCase();
  },

  /**
   * Check if log is valid
   */
  isValidLog(log: Log): boolean {
    return !!(
      log.transactionHash &&
      log.blockNumber &&
      log.logIndex !== null &&
      log.logIndex !== undefined &&
      log.address
    );
  },

  /**
   * Calculate event processing delay
   */
  calculateProcessingDelay(blockNumber: bigint, currentBlock: bigint): number {
    return Number(currentBlock - blockNumber);
  },

  /**
   * Generate unique event ID
   */
  generateEventId(log: Log): string {
    return `${log.transactionHash}-${log.logIndex}`;
  },

  /**
   * Parse bigint values safely
   */
  parseBigInt(value: any): string {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return BigInt(value).toString();
    }
    return '0';
  },

  /**
   * Sanitize event data for storage
   */
  sanitizeEventData(data: any): any {
    if (typeof data === 'bigint') {
      return data.toString();
    }
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeEventData(item));
    }
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeEventData(value);
      }
      return sanitized;
    }
    return data;
  },

  /**
   * Determine event priority
   */
  getEventPriority(eventName: string): number {
    const priorities: Record<string, number> = {
      // High priority
      SessionCreated: 10,
      ResultFinalized: 10,

      // Medium priority
      ChallengerJoined: 5,
      VotingStarted: 5,
      EvaluationSubmitted: 5,

      // Normal priority
      WagerDeposited: 0,
      AchievementMinted: 0,
      CredibilityUpdated: 0,

      // Low priority
      SessionCancelled: -5,
    };

    return priorities[eventName] || 0;
  },

  /**
   * Check if event requires immediate processing
   */
  requiresImmediateProcessing(eventName: string): boolean {
    const immediateEvents = [
      'SessionCreated',
      'ResultFinalized',
      'VotingStarted',
    ];
    return immediateEvents.includes(eventName);
  },

  /**
   * Extract participant addresses from event
   */
  extractParticipants(eventName: string, args: any): string[] {
    const participants: string[] = [];

    switch (eventName) {
      case 'SessionCreated':
        if (args.initiator) participants.push(args.initiator);
        if (args.challenger) participants.push(args.challenger);
        break;
      case 'ChallengerJoined':
        if (args.challenger) participants.push(args.challenger);
        break;
      case 'EvaluationSubmitted':
        if (args.evaluator) participants.push(args.evaluator);
        break;
      case 'ResultFinalized':
        if (args.winner) participants.push(args.winner);
        break;
      case 'AchievementMinted':
        if (args.recipient) participants.push(args.recipient);
        break;
    }

    return participants.filter(Boolean);
  },

  /**
   * Get retry delay based on retry count (exponential backoff)
   */
  getRetryDelay(retryCount: number): number {
    // 1min, 2min, 4min, 8min, 16min...
    return Math.min(Math.pow(2, retryCount) * 60 * 1000, 30 * 60 * 1000); // Max 30 minutes
  },

  /**
   * Format block range for display
   */
  formatBlockRange(fromBlock: bigint, toBlock: bigint): string {
    const diff = toBlock - fromBlock;
    return `${fromBlock} → ${toBlock} (${diff} blocks)`;
  },

  /**
   * Calculate estimated processing time
   */
  estimateProcessingTime(eventCount: number, avgProcessingTime: number = 100): number {
    return eventCount * avgProcessingTime; // milliseconds
  },
};
