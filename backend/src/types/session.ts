export type SessionStatus = 'pending' | 'active' | 'voting' | 'completed' | 'cancelled';

export interface SessionMetadata {
  tags?: string[];
  externalUrl?: string;
  videoUrl?: string;
  cancellationReason?: string;
  forfeitedBy?: string;
  forfeitReason?: string;
  rules?: string[];
  judgeNotes?: string;
}

export interface SessionStatistics {
  totalVotes: number;
  initiatorVotes: number;
  challengerVotes: number;
  totalWeight: number;
  initiatorWeight: number;
  challengerWeight: number;
  evaluatorCount: number;
  avgConfidence: number;
}

export interface SessionParticipant {
  address: string;
  role: 'initiator' | 'challenger' | 'evaluator';
  joinedAt: Date;
}

export interface SessionTimeline {
  created: Date;
  started?: Date;
  votingStarted?: Date;
  votingEnds?: Date;
  completed?: Date;
}
