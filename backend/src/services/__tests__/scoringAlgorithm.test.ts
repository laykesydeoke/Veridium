import { ScoringAlgorithm } from '../scoringAlgorithm';

describe('ScoringAlgorithm', () => {
  describe('calculateCredibilityMultiplier', () => {
    it('returns 1.0x for new evaluators', () => {
      const profile = {
        address: '0x123',
        credibilityScore: 50,
        evaluationAccuracy: 50,
        totalEvaluations: 3,
        recentActivity: 1,
      };

      const multiplier = ScoringAlgorithm.calculateCredibilityMultiplier(profile);
      expect(multiplier).toBe(1.0);
    });

    it('rewards high credibility scores', () => {
      const profile = {
        address: '0x123',
        credibilityScore: 90,
        evaluationAccuracy: 80,
        totalEvaluations: 20,
        recentActivity: 1,
      };

      const multiplier = ScoringAlgorithm.calculateCredibilityMultiplier(profile);
      expect(multiplier).toBeGreaterThan(1.5);
    });

    it('penalizes low credibility', () => {
      const profile = {
        address: '0x123',
        credibilityScore: 20,
        evaluationAccuracy: 30,
        totalEvaluations: 15,
        recentActivity: 1,
      };

      const multiplier = ScoringAlgorithm.calculateCredibilityMultiplier(profile);
      expect(multiplier).toBeLessThan(1.0);
    });
  });

  describe('calculateConfidenceMultiplier', () => {
    it('rewards high confidence', () => {
      const multiplier = ScoringAlgorithm.calculateConfidenceMultiplier(85);
      expect(multiplier).toBe(1.5);
    });

    it('penalizes very low confidence', () => {
      const multiplier = ScoringAlgorithm.calculateConfidenceMultiplier(15);
      expect(multiplier).toBe(0.5);
    });

    it('is neutral for medium confidence', () => {
      const multiplier = ScoringAlgorithm.calculateConfidenceMultiplier(50);
      expect(multiplier).toBe(1.0);
    });
  });

  describe('calculateReasoningQualityMultiplier', () => {
    it('penalizes no reasoning', () => {
      const multiplier = ScoringAlgorithm.calculateReasoningQualityMultiplier('');
      expect(multiplier).toBe(0.8);
    });

    it('rewards optimal length reasoning', () => {
      const reasoning = 'This is a detailed and well-thought-out reasoning that provides good evidence and argumentation for the evaluation.';
      const multiplier = ScoringAlgorithm.calculateReasoningQualityMultiplier(reasoning);
      expect(multiplier).toBe(1.3);
    });

    it('penalizes very short reasoning', () => {
      const multiplier = ScoringAlgorithm.calculateReasoningQualityMultiplier('Too short');
      expect(multiplier).toBe(0.9);
    });
  });

  describe('detectSpam', () => {
    it('detects duplicate reasoning', () => {
      const evaluation = {
        evaluatorAddress: '0x123',
        vote: true,
        confidence: 80,
        reasoning: 'This is spam',
        submittedAt: new Date(),
      };

      const previous = [{
        ...evaluation,
        reasoning: 'This is spam',
      }];

      const result = ScoringAlgorithm.detectSpam(evaluation, previous);
      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('Duplicate');
    });

    it('detects repeated characters', () => {
      const evaluation = {
        evaluatorAddress: '0x123',
        vote: true,
        confidence: 80,
        reasoning: 'aaaaaaaaaaaaaaaaaaa',
        submittedAt: new Date(),
      };

      const result = ScoringAlgorithm.detectSpam(evaluation, []);
      expect(result.isSpam).toBe(true);
    });

    it('allows valid reasoning', () => {
      const evaluation = {
        evaluatorAddress: '0x123',
        vote: true,
        confidence: 80,
        reasoning: 'This is a valid and well-reasoned evaluation with proper argumentation.',
        submittedAt: new Date(),
      };

      const result = ScoringAlgorithm.detectSpam(evaluation, []);
      expect(result.isSpam).toBe(false);
    });
  });
});
