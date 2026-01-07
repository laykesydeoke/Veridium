/**
 * Evaluation system constants
 */

export const EVALUATION_CONSTANTS = {
  // Weight calculation
  BASE_WEIGHT: 100,
  MIN_WEIGHT: 10,
  MAX_WEIGHT: 300,

  // Credibility multipliers
  CREDIBILITY_MULTIPLIER_MIN: 0.5,
  CREDIBILITY_MULTIPLIER_MAX: 2.0,
  NEW_EVALUATOR_THRESHOLD: 5,
  HIGH_ACCURACY_THRESHOLD: 75,
  LOW_ACCURACY_THRESHOLD: 40,
  MAX_EXPERIENCE_BONUS: 0.2,
  EXPERIENCE_BONUS_CAP: 100,

  // Confidence multipliers
  CONFIDENCE_VERY_HIGH: 80,
  CONFIDENCE_HIGH: 60,
  CONFIDENCE_MEDIUM: 40,
  CONFIDENCE_LOW: 20,

  // Timing multipliers
  EARLY_SUBMISSION_THRESHOLD: 0.2,
  LATE_SUBMISSION_THRESHOLD: 0.8,
  EARLY_BONUS: 1.2,
  LATE_PENALTY: 0.8,

  // Reasoning quality
  MIN_REASONING_LENGTH: 10,
  SHORT_REASONING_THRESHOLD: 20,
  OPTIMAL_REASONING_MIN: 50,
  OPTIMAL_REASONING_MAX: 500,
  OPTIMAL_WORDS_MIN: 10,
  OPTIMAL_WORDS_MAX: 100,
  MAX_REASONING_LENGTH: 2000,
  LONG_REASONING_THRESHOLD: 1000,

  // Validation
  MIN_EVALUATIONS_REQUIRED: 3,
  MAX_EVALUATIONS_PER_SESSION: 100,
  MIN_ACCOUNT_AGE_MS: 60 * 60 * 1000, // 1 hour
  EVALUATIONS_PER_HOUR_LIMIT: 10,

  // Voting periods
  DEFAULT_VOTING_DURATION_HOURS: 24,
  MIN_VOTING_DURATION_HOURS: 12,
  MAX_VOTING_DURATION_HOURS: 72,
  MAX_PERIOD_EXTENSIONS: 2,
  DEFAULT_EXTENSION_HOURS: 12,

  // Consensus levels
  CONSENSUS_STRONG_THRESHOLD: 70,
  CONSENSUS_MODERATE_THRESHOLD: 50,
  CONSENSUS_WEAK_THRESHOLD: 30,

  // Rewards
  PLATFORM_FEE_PERCENTAGE: 5,
  EVALUATOR_POOL_PERCENTAGE: 10,
  CORRECT_EVALUATION_MULTIPLIER: 1.5,
  INCORRECT_EVALUATION_MULTIPLIER: 0.3,

  // Quality scoring
  REASONING_SCORE_WEIGHT: 50,
  CONFIDENCE_SCORE_WEIGHT: 30,
  WEIGHT_SCORE_WEIGHT: 20,

  // Spam detection
  REPEATED_CHAR_THRESHOLD: 10,
  SPAM_CONFIDENCE_THRESHOLD: 0.7,

  // Caching
  ASSESSMENT_CACHE_TTL: 300, // 5 minutes
  PERFORMANCE_CACHE_TTL: 600, // 10 minutes

  // Finalization
  FINALIZATION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  NEARING_DEADLINE_HOURS: 1,
} as const;

export const EVALUATION_MESSAGES = {
  // Errors
  SESSION_NOT_FOUND: 'Session not found',
  SESSION_NOT_VOTING: 'Session is not in voting phase',
  VOTING_EXPIRED: 'Voting period has ended',
  PARTICIPANT_CANNOT_EVALUATE: 'Participants cannot evaluate their own session',
  DUPLICATE_EVALUATION: 'You have already submitted an evaluation for this session',
  ACCOUNT_TOO_NEW: 'Account too new - please wait before evaluating',
  RATE_LIMIT_EXCEEDED: 'Too many recent evaluations - please wait',
  SPAM_DETECTED: 'Evaluation rejected - spam detected',
  INSUFFICIENT_EVALUATIONS: 'Insufficient evaluations to determine outcome',

  // Warnings
  LOW_CONFIDENCE_WARNING: 'Very low confidence may reduce your evaluation weight',
  SHORT_REASONING_WARNING: 'Short reasoning may reduce your evaluation weight',
  HIGH_CONFIDENCE_WARNING: '100% confidence is rare - ensure you have strong evidence',
  NEARING_DEADLINE: 'Voting period ending soon',
  NEARING_MAX_EVALUATIONS: 'Session nearing maximum evaluations',

  // Success
  EVALUATION_SUBMITTED: 'Evaluation submitted successfully',
  SESSION_FINALIZED: 'Session results finalized',
  PERIOD_EXTENDED: 'Voting period extended',
} as const;

export const QUALITY_LABELS = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
} as const;

export const CONFIDENCE_LABELS = {
  VERY_HIGH: 'Very High',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  VERY_LOW: 'Very Low',
} as const;

export const CONSENSUS_LABELS = {
  STRONG: 'Strong Consensus',
  MODERATE: 'Moderate Consensus',
  WEAK: 'Weak Consensus',
  DIVIDED: 'Divided Opinion',
} as const;
