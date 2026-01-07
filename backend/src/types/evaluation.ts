/**
 * Evaluation system type definitions
 */

export interface Evaluation {
  id: string;
  sessionId: string;
  evaluatorAddress: string;
  vote: boolean;
  weight: number;
  confidence: number;
  reasoning: string;
  qualityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationSubmission {
  sessionId: string;
  vote: boolean;
  confidence: number;
  reasoning: string;
}

export interface WeightedEvaluation extends Evaluation {
  weightBreakdown: {
    credibility: number;
    confidence: number;
    timing: number;
    reasoningQuality: number;
  };
}

export interface EvaluationAnalytics {
  totalEvaluations: number;
  averageWeight: number;
  averageConfidence: number;
  averageQualityScore: number;
  consensusLevel: 'strong' | 'moderate' | 'weak' | 'divided';
  distributionByVote: {
    initiator: number;
    challenger: number;
  };
}

export interface EvaluatorStats {
  totalEvaluations: number;
  correctEvaluations: number;
  accuracy: number;
  averageWeight: number;
  averageConfidence: number;
  totalRewardsEarned: number;
  bestStreak: number;
  currentStreak: number;
}

export interface ConsensusData {
  strength: number; // 0-100
  level: 'strong' | 'moderate' | 'weak' | 'divided';
  majority: 'initiator' | 'challenger' | 'tie';
  marginPercentage: number;
  agreement: {
    initiator: number;
    challenger: number;
  };
}

export interface QualityMetrics {
  reasoningLength: number;
  reasoningWordCount: number;
  hasEvidence: boolean;
  sentimentScore: number; // -1 to 1
  clarity: number; // 0-100
  relevance: number; // 0-100
}
