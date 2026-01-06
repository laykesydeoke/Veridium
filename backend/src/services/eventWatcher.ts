import { createPublicClient, http, parseAbiItem, type Log } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { env } from '../config/env';
import { EventListener } from './eventListener';
import { EventQueue } from './eventQueue';

const chain = env.CHAIN_ID === '8453' ? base : baseSepolia;

const publicClient = createPublicClient({
  chain,
  transport: http(env.BASE_RPC_URL),
});

export interface WatchedContract {
  address: string;
  events: string[];
  unwatch?: () => void;
}

export const EventWatcher = {
  watchedContracts: new Map<string, WatchedContract>(),

  /**
   * Start watching a contract for events
   */
  async watchContract(contractAddress: string, events: string[]): Promise<void> {
    if (this.watchedContracts.has(contractAddress.toLowerCase())) {
      console.log(`[EventWatcher] Already watching ${contractAddress}`);
      return;
    }

    console.log(`[EventWatcher] Starting to watch ${contractAddress} for events:`, events);

    // Get checkpoint to start from
    const checkpoint = await EventListener.getCheckpoint(contractAddress);
    const fromBlock = checkpoint.lastProcessedBlock + 1n;

    // Watch for new events
    const unwatch = publicClient.watchBlockNumber({
      onBlockNumber: async (blockNumber) => {
        await this.processNewBlocks(contractAddress, fromBlock, blockNumber, events);
      },
      pollingInterval: 12000, // 12 seconds (Base block time)
    });

    this.watchedContracts.set(contractAddress.toLowerCase(), {
      address: contractAddress.toLowerCase(),
      events,
      unwatch,
    });

    console.log(`[EventWatcher] Now watching ${contractAddress} from block ${fromBlock}`);
  },

  /**
   * Stop watching a contract
   */
  stopWatchingContract(contractAddress: string): void {
    const watched = this.watchedContracts.get(contractAddress.toLowerCase());
    if (watched && watched.unwatch) {
      watched.unwatch();
      this.watchedContracts.delete(contractAddress.toLowerCase());
      console.log(`[EventWatcher] Stopped watching ${contractAddress}`);
    }
  },

  /**
   * Stop watching all contracts
   */
  stopAll(): void {
    console.log('[EventWatcher] Stopping all watchers');
    for (const [address, watched] of this.watchedContracts) {
      if (watched.unwatch) {
        watched.unwatch();
      }
    }
    this.watchedContracts.clear();
  },

  /**
   * Process new blocks for a contract
   */
  async processNewBlocks(
    contractAddress: string,
    fromBlock: bigint,
    toBlock: bigint,
    events: string[]
  ): Promise<void> {
    if (toBlock <= fromBlock) return;

    try {
      console.log(
        `[EventWatcher] Processing blocks ${fromBlock} to ${toBlock} for ${contractAddress}`
      );

      // Get logs for all watched events
      const logs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        fromBlock,
        toBlock,
      });

      // Queue each event for processing
      for (const log of logs) {
        const eventName = this.getEventName(log);
        if (events.includes(eventName)) {
          await EventQueue.enqueue(contractAddress, eventName, log, 1);
        }
      }

      // Update checkpoint
      await EventListener.updateCheckpoint(contractAddress, toBlock);
    } catch (error) {
      console.error(`[EventWatcher] Error processing blocks:`, error);
    }
  },

  /**
   * Extract event name from log
   */
  getEventName(log: Log): string {
    // Event signatures for known events
    const eventSignatures: Record<string, string> = {
      // SessionCreated(address indexed sessionId, address indexed initiator, address indexed challenger, uint256 wagerAmount, string topic)
      '0x1234...': 'SessionCreated',
      // EvaluationSubmitted(address indexed sessionId, address indexed evaluator, bool vote, uint256 weight, string reasoning)
      '0x5678...': 'EvaluationSubmitted',
      // ResultFinalized(address indexed sessionId, address indexed winner, uint256 initiatorWeight, uint256 challengerWeight)
      '0x9abc...': 'ResultFinalized',
      // AchievementMinted(address indexed recipient, string achievementType, uint256 tokenId)
      '0xdef0...': 'AchievementMinted',
    };

    // For now, return a placeholder - in production, decode from topics[0]
    const signature = log.topics[0];
    return eventSignatures[signature] || 'Unknown';
  },

  /**
   * Watch multiple contracts
   */
  async watchContracts(
    contracts: Array<{ address: string; events: string[] }>
  ): Promise<void> {
    console.log(`[EventWatcher] Starting to watch ${contracts.length} contracts`);

    for (const contract of contracts) {
      await this.watchContract(contract.address, contract.events);
    }
  },

  /**
   * Replay missed events for a contract
   */
  async replayMissedEvents(contractAddress: string, fromBlock?: bigint): Promise<number> {
    console.log(`[EventWatcher] Replaying missed events for ${contractAddress}`);
    return await EventListener.replayEvents(contractAddress, fromBlock);
  },

  /**
   * Get watcher status
   */
  getStatus(): {
    watchedCount: number;
    contracts: Array<{ address: string; events: string[] }>;
  } {
    return {
      watchedCount: this.watchedContracts.size,
      contracts: Array.from(this.watchedContracts.values()).map((w) => ({
        address: w.address,
        events: w.events,
      })),
    };
  },

  /**
   * Initialize watchers for all known contracts
   */
  async initialize(): Promise<void> {
    console.log('[EventWatcher] Initializing event watchers');

    // In production, load contract addresses from configuration or database
    const contracts = [
      {
        address: env.SESSION_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
        events: ['SessionCreated', 'EvaluationSubmitted', 'ResultFinalized'],
      },
      {
        address: env.ACHIEVEMENT_NFT_ADDRESS || '0x0000000000000000000000000000000000000000',
        events: ['AchievementMinted'],
      },
    ];

    // Filter out zero addresses
    const validContracts = contracts.filter(
      (c) => c.address !== '0x0000000000000000000000000000000000000000'
    );

    if (validContracts.length === 0) {
      console.warn('[EventWatcher] No contract addresses configured');
      return;
    }

    await this.watchContracts(validContracts);
    console.log(`[EventWatcher] Initialized ${validContracts.length} watchers`);
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    watchedContracts: number;
    currentBlock: bigint;
    latency: number;
  }> {
    const start = Date.now();
    const currentBlock = await publicClient.getBlockNumber();
    const latency = Date.now() - start;

    return {
      healthy: this.watchedContracts.size > 0,
      watchedContracts: this.watchedContracts.size,
      currentBlock,
      latency,
    };
  },
};
