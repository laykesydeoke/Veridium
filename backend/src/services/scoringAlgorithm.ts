/**
 * Weighted Scoring Algorithm
 * Calculates evaluation weights based on credibility, confidence, and timing
 */

export interface EvaluatorProfile {
  address: string;
  credibilityScore: number;
  evaluationAccuracy: number;
  totalEvaluations: number;
  recentActivity: number;
}

export interface EvaluationInput {
  evaluatorAddress: string;
  vote: boolean;
  confidence: number;
  reasoning: string;
  submittedAt: Date;
}

export interface WeightCalculation {
  baseWeight: number;
  credibilityMultiplier: number;
  confidenceMultiplier: number;
  timingMultiplier: number;
  reasoningQualityMultiplier: number;
  finalWeight: number;
  breakdown: {
    credibility: number;
    confidence: number;
    timing: number;
    reasoningQuality: number;
  };
}

export const ScoringAlgorithm = {
  /**
   * Calculate evaluation weight
   */
  async calculateWeight(
    evaluation: EvaluationInput,
    evaluatorProfile: EvaluatorProfile,
    votingStartTime: Date,
    votingEndTime: Date
  ): Promise<WeightCalculation> {
    const baseWeight = 100;

    // Credibility multiplier (0.5x - 2.0x)
    const credibilityMultiplier = this.calculateCredibilityMultiplier(evaluatorProfile);

    // Confidence multiplier (0.5x - 1.5x)
    const confidenceMultiplier = this.calculateConfidenceMultiplier(evaluation.confidence);

    // Timing multiplier (0.8x - 1.2x) - rewards early but thoughtful evaluations
    const timingMultiplier = this.calculateTimingMultiplier(
      evaluation.submittedAt,
      votingStartTime,
      votingEndTime
    );

    // Reasoning quality multiplier (0.8x - 1.3x)
    const reasoningQualityMultiplier = this.calculateReasoningQualityMultiplier(
      evaluation.reasoning
    );

    // Calculate final weight
    const finalWeight = Math.round(
      baseWeight *
      credibilityMultiplier *
      confidenceMultiplier *
      timingMultiplier *
      reasoningQualityMultiplier
    );

    return {
      baseWeight,
      credibilityMultiplier,
      confidenceMultiplier,
      timingMultiplier,
      reasoningQualityMultiplier,
      finalWeight: Math.max(10, Math.min(300, finalWeight)), // Clamp between 10-300
      breakdown: {
        credibility: Math.round(baseWeight * credibilityMultiplier),
        confidence: Math.round(baseWeight * confidenceMultiplier),
        timing: Math.round(baseWeight * timingMultiplier),
        reasoningQuality: Math.round(baseWeight * reasoningQualityMultiplier),
      },
    };
  },

  /**
   * Calculate credibility multiplier
   */
  calculateCredibilityMultiplier(profile: EvaluatorProfile): number {
    const { credibilityScore, evaluationAccuracy, totalEvaluations } = profile;

    // New evaluators start at 1.0x
    if (totalEvaluations < 5) {
      return 1.0;
    }

    // Base on credibility score (0-100 range)
    let multiplier = 0.5 + (credibilityScore / 100) * 1.5; // Maps 0-100 to 0.5-2.0

    // Adjust based on accuracy
    if (evaluationAccuracy > 75) {
      multiplier *= 1.1;
    } else if (evaluationAccuracy < 40) {
      multiplier *= 0.9;
    }

    // Experience bonus (capped)
    const experienceBonus = Math.min(totalEvaluations / 100, 0.2);
    multiplier += experienceBonus;

    return Math.max(0.5, Math.min(2.0, multiplier));
  },

  /**
   * Calculate confidence multiplier
   */
  calculateConfidenceMultiplier(confidence: number): number {
    // Confidence is 0-100
    // We want to reward high confidence but not punish low confidence too much
    if (confidence >= 80) return 1.5;
    if (confidence >= 60) return 1.2;
    if (confidence >= 40) return 1.0;
    if (confidence >= 20) return 0.8;
    return 0.5;
  },

  /**
   * Calculate timing multiplier
   */
  calculateTimingMultiplier(
    submittedAt: Date,
    votingStartTime: Date,
    votingEndTime: Date
  ): number {
    const totalDuration = votingEndTime.getTime() - votingStartTime.getTime();
    const elapsedTime = submittedAt.getTime() - votingStartTime.getTime();

    if (totalDuration === 0) return 1.0;

    const percentageElapsed = elapsedTime / totalDuration;

    // Early submissions (first 20%) get slight bonus
    if (percentageElapsed < 0.2) return 1.2;

    // Middle period (20-80%) is neutral
    if (percentageElapsed < 0.8) return 1.0;

    // Late submissions (last 20%) get slight penalty
    return 0.8;
  },

  /**
   * Calculate reasoning quality multiplier
   */
  calculateReasoningQualityMultiplier(reasoning: string): number {
    if (!reasoning || reasoning.trim().length === 0) {
      return 0.8; // Penalty for no reasoning
    }

    const length = reasoning.trim().length;
    const words = reasoning.trim().split(/\s+/).length;

    // Too short (< 20 chars or < 5 words)
    if (length < 20 || words < 5) {
      return 0.9;
    }

    // Good length (50-500 chars, 10-100 words)
    if (length >= 50 && length <= 500 && words >= 10 && words <= 100) {
      return 1.3;
    }

    // Acceptable length (20-50 or 500-1000 chars)
    if ((length >= 20 && length < 50) || (length > 500 && length <= 1000)) {
      return 1.1;
    }

    // Too long (> 1000 chars or > 200 words) - might be spam or low quality
    if (length > 1000 || words > 200) {
      return 0.95;
    }

    return 1.0;
  },

  /**
   * Calculate evaluator reward based on evaluation quality and outcome
   */
  calculateEvaluatorReward(
    weight: number,
    wasCorrect: boolean,
    sessionWagerAmount: number
  ): number {
    // Base reward is proportional to weight
    let reward = weight / 100; // Normalize to base 1.0

    // Bonus for correct evaluation
    if (wasCorrect) {
      reward *= 1.5;
    } else {
      reward *= 0.3; // Small consolation reward for participation
    }

    // Scale by wager amount (evaluators get from reward pool)
    const rewardPool = sessionWagerAmount * 0.1; // 10% of wager goes to evaluators
    reward = (reward / 100) * rewardPool;

    return Math.round(reward);
  },

  /**
   * Detect potential spam/low-quality evaluations
   */
  detectSpam(evaluation: EvaluationInput, previousEvaluations: EvaluationInput[]): {
    isSpam: boolean;
    reason?: string;
    confidence: number;
  } {
    // Check for duplicate reasoning
    const duplicateReasoning = previousEvaluations.some(
      prev => prev.reasoning.toLowerCase().trim() === evaluation.reasoning.toLowerCase().trim()
    );

    if (duplicateReasoning) {
      return {
        isSpam: true,
        reason: 'Duplicate reasoning detected',
        confidence: 0.9,
      };
    }

    // Check for very short reasoning
    if (evaluation.reasoning.trim().length < 10) {
      return {
        isSpam: true,
        reason: 'Reasoning too short',
        confidence: 0.7,
      };
    }

    // Check for repeated characters/patterns
    const repeatedPattern = /(.)\1{10,}/.test(evaluation.reasoning);
    if (repeatedPattern) {
      return {
        isSpam: true,
        reason: 'Repeated character pattern detected',
        confidence: 0.95,
      };
    }

    // Check for gibberish (no vowels, all caps, etc.)
    const hasVowels = /[aeiou]/i.test(evaluation.reasoning);
    const allCaps = evaluation.reasoning === evaluation.reasoning.toUpperCase();
    const noSpaces = !evaluation.reasoning.includes(' ') && evaluation.reasoning.length > 30;

    if (!hasVowels || (allCaps && evaluation.reasoning.length > 20) || noSpaces) {
      return {
        isSpam: true,
        reason: 'Appears to be gibberish',
        confidence: 0.75,
      };
    }

    return {
      isSpam: false,
      confidence: 0,
    };
  },

  /**
   * Calculate quality score for an evaluation (0-100)
   */
  calculateQualityScore(
    evaluation: EvaluationInput,
    weightCalculation: WeightCalculation
  ): number {
    const reasoningScore = Math.min(
      (evaluation.reasoning.trim().length / 200) * 50,
      50
    );
    const confidenceScore = (evaluation.confidence / 100) * 30;
    const weightScore = Math.min((weightCalculation.finalWeight / 300) * 20, 20);

    return Math.round(reasoningScore + confidenceScore + weightScore);
  },

  /**
   * Normalize weights across all evaluations
   * Ensures total weight doesn't exceed a maximum threshold
   */
  normalizeWeights(
    weights: number[],
    maxTotalWeight: number = 10000
  ): number[] {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight <= maxTotalWeight) {
      return weights;
    }

    const scaleFactor = maxTotalWeight / totalWeight;
    return weights.map(w => Math.round(w * scaleFactor));
  },
};
