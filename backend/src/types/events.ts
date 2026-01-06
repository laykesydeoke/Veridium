/**
 * Event listener type definitions
 */

export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface EventLog {
  id: number;
  contractAddress: string;
  eventName: string;
  transactionHash: string;
  blockNumber: string;
  logIndex: number;
  processedAt: Date;
  createdAt: Date;
}

export interface EventError {
  id: number;
  contractAddress: string;
  eventName: string;
  transactionHash: string;
  blockNumber: string;
  logIndex: number;
  errorMessage: string;
  retryCount: number;
  lastRetryAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface EventCheckpoint {
  id: number;
  contractAddress: string;
  lastProcessedBlock: string;
  lastUpdated: Date;
  createdAt: Date;
}

export interface QueuedEvent {
  id: number;
  contractAddress: string;
  eventName: string;
  eventData: any;
  priority: number;
  status: EventStatus;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface EventProcessingStats {
  totalEvents: number;
  uniqueContracts: number;
  uniqueEventTypes: number;
  firstEvent?: Date;
  lastEvent?: Date;
  totalErrors: number;
  unresolvedErrors: number;
}

export interface EventQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  oldestPending?: Date;
}

export interface EventHealthStatus {
  contractAddress: string;
  uniqueEvents: number;
  totalProcessed: number;
  lastProcessedAt?: Date;
  unresolvedErrors: number;
  currentCheckpoint?: string;
}

export interface WatcherStatus {
  watchedCount: number;
  contracts: Array<{
    address: string;
    events: string[];
  }>;
}

export interface WatcherHealth {
  healthy: boolean;
  watchedContracts: number;
  currentBlock: bigint;
  latency: number;
}

export interface ContractConfig {
  address: string;
  events: string[];
  startBlock?: bigint;
  abi?: any[];
}

export interface EventProcessorConfig {
  batchSize: number;
  pollingInterval: number;
  maxRetries: number;
  retryDelay: number;
  queueWorkerInterval: number;
  maintenanceInterval: number;
  purgeDays: number;
}

export interface SessionCreatedArgs {
  sessionAddress: string;
  initiator: string;
  topic: string;
  wagerAmount: bigint;
}

export interface ChallengerJoinedArgs {
  challenger: string;
  timestamp: bigint;
}

export interface VotingStartedArgs {
  votingEndTime: bigint;
}

export interface EvaluationSubmittedArgs {
  evaluator: string;
  vote: boolean;
  weight: bigint;
  reasoning: string;
}

export interface ResultFinalizedArgs {
  winner: string;
  initiatorVotes: bigint;
  challengerVotes: bigint;
  initiatorWeight: bigint;
  challengerWeight: bigint;
}

export interface WagerDepositedArgs {
  participant: string;
  amount: bigint;
}

export interface SessionCancelledArgs {
  reason: string;
  timestamp: bigint;
}

export interface AchievementMintedArgs {
  recipient: string;
  achievementType: string;
  tokenId: bigint;
}

export interface CredibilityUpdatedArgs {
  user: string;
  newScore: bigint;
  eventType: string;
}

export type EventArgs =
  | SessionCreatedArgs
  | ChallengerJoinedArgs
  | VotingStartedArgs
  | EvaluationSubmittedArgs
  | ResultFinalizedArgs
  | WagerDepositedArgs
  | SessionCancelledArgs
  | AchievementMintedArgs
  | CredibilityUpdatedArgs;
