/**
 * Contract ABI definitions for event listening
 * These ABIs should match the actual smart contracts deployed on Base
 */

export const SessionFactoryABI = [
  {
    type: 'event',
    name: 'SessionCreated',
    inputs: [
      {
        indexed: true,
        name: 'sessionAddress',
        type: 'address',
      },
      {
        indexed: true,
        name: 'initiator',
        type: 'address',
      },
      {
        indexed: false,
        name: 'topic',
        type: 'string',
      },
      {
        indexed: false,
        name: 'wagerAmount',
        type: 'uint256',
      },
    ],
  },
] as const;

export const SessionContractABI = [
  {
    type: 'event',
    name: 'ChallengerJoined',
    inputs: [
      {
        indexed: true,
        name: 'challenger',
        type: 'address',
      },
      {
        indexed: false,
        name: 'timestamp',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'VotingStarted',
    inputs: [
      {
        indexed: false,
        name: 'votingEndTime',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'EvaluationSubmitted',
    inputs: [
      {
        indexed: true,
        name: 'evaluator',
        type: 'address',
      },
      {
        indexed: false,
        name: 'vote',
        type: 'bool',
      },
      {
        indexed: false,
        name: 'weight',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'reasoning',
        type: 'string',
      },
    ],
  },
  {
    type: 'event',
    name: 'ResultFinalized',
    inputs: [
      {
        indexed: true,
        name: 'winner',
        type: 'address',
      },
      {
        indexed: false,
        name: 'initiatorVotes',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'challengerVotes',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'initiatorWeight',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'challengerWeight',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'WagerDeposited',
    inputs: [
      {
        indexed: true,
        name: 'participant',
        type: 'address',
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'WagerDistributed',
    inputs: [
      {
        indexed: true,
        name: 'winner',
        type: 'address',
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'SessionCancelled',
    inputs: [
      {
        indexed: false,
        name: 'reason',
        type: 'string',
      },
      {
        indexed: false,
        name: 'timestamp',
        type: 'uint256',
      },
    ],
  },
] as const;

export const AchievementNFTABI = [
  {
    type: 'event',
    name: 'AchievementMinted',
    inputs: [
      {
        indexed: true,
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        name: 'achievementType',
        type: 'string',
      },
      {
        indexed: false,
        name: 'tokenId',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        name: 'tokenId',
        type: 'uint256',
      },
    ],
  },
] as const;

export const CredibilityTrackerABI = [
  {
    type: 'event',
    name: 'CredibilityUpdated',
    inputs: [
      {
        indexed: true,
        name: 'user',
        type: 'address',
      },
      {
        indexed: false,
        name: 'newScore',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'eventType',
        type: 'string',
      },
    ],
  },
  {
    type: 'event',
    name: 'AccuracyRecorded',
    inputs: [
      {
        indexed: true,
        name: 'evaluator',
        type: 'address',
      },
      {
        indexed: false,
        name: 'wasCorrect',
        type: 'bool',
      },
      {
        indexed: false,
        name: 'sessionAddress',
        type: 'address',
      },
    ],
  },
] as const;

/**
 * Event signatures for quick lookup
 */
export const EventSignatures = {
  // Session Factory
  SessionCreated:
    '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',

  // Session Contract
  ChallengerJoined:
    '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
  VotingStarted:
    '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
  EvaluationSubmitted:
    '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
  ResultFinalized:
    '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
  WagerDeposited:
    '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
  WagerDistributed:
    '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
  SessionCancelled:
    '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',

  // Achievement NFT
  AchievementMinted:
    '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
  Transfer:
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',

  // Credibility Tracker
  CredibilityUpdated:
    '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
  AccuracyRecorded:
    '0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
} as const;

/**
 * Map event signature to event name
 */
export function getEventNameFromSignature(signature: string): string | undefined {
  const entries = Object.entries(EventSignatures);
  for (const [name, sig] of entries) {
    if (sig === signature) {
      return name;
    }
  }
  return undefined;
}
