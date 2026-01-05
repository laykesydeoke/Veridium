export interface Session {
  id: string;
  title: string;
  creator: string;
  challenger?: string;
  wagerAmount: number;
  status: 'pending' | 'active' | 'evaluating' | 'completed' | 'cancelled';
  createdAt: Date;
  evaluationPeriodEnd?: Date;
}

export interface User {
  address: string;
  basename?: string;
  credibilityScore: number;
  sessionsParticipated: number;
  sessionsWon: number;
  evaluationsSubmitted: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  mintedAt: Date;
}

export interface Evaluation {
  evaluator: string;
  verdict: 'creator' | 'challenger' | 'draw';
  timestamp: Date;
}
