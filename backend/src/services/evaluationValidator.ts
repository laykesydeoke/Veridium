import { pool } from '../config/database';

/**
 * Evaluation Validator Service
 * Validates evaluation eligibility and submission requirements
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const EvaluationValidator = {
  /**
   * Validate evaluation submission
   */
  async validateEvaluationSubmission(
    sessionId: string,
    evaluatorAddress: string,
    vote: boolean,
    confidence: number,
    reasoning: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check session exists and is in voting phase
    const session = await pool.query(
      'SELECT status, voting_end_time, initiator_address, challenger_address FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (session.rows.length === 0) {
      errors.push('Session not found');
      return { isValid: false, errors, warnings };
    }

    const { status, voting_end_time, initiator_address, challenger_address } = session.rows[0];

    if (status !== 'voting') {
      errors.push(`Session is not in voting phase (current status: ${status})`);
    }

    // Check voting period hasn't ended
    if (voting_end_time && new Date(voting_end_time) < new Date()) {
      errors.push('Voting period has ended');
    }

    // Check evaluator is not a participant
    if (evaluatorAddress.toLowerCase() === initiator_address.toLowerCase()) {
      errors.push('Initiator cannot evaluate their own session');
    }

    if (evaluatorAddress.toLowerCase() === challenger_address.toLowerCase()) {
      errors.push('Challenger cannot evaluate their own session');
    }

    // Check for duplicate evaluation
    const existing = await pool.query(
      'SELECT id FROM evaluations WHERE session_id = $1 AND evaluator_address = $2',
      [sessionId, evaluatorAddress.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      errors.push('You have already submitted an evaluation for this session');
    }

    // Validate confidence range
    if (confidence < 0 || confidence > 100) {
      errors.push('Confidence must be between 0 and 100');
    }

    if (confidence < 20) {
      warnings.push('Very low confidence may reduce your evaluation weight');
    }

    // Validate reasoning
    if (!reasoning || reasoning.trim().length === 0) {
      errors.push('Reasoning is required');
    } else if (reasoning.trim().length < 10) {
      errors.push('Reasoning must be at least 10 characters');
    } else if (reasoning.trim().length > 2000) {
      errors.push('Reasoning must not exceed 2000 characters');
    }

    if (reasoning && reasoning.trim().length < 50) {
      warnings.push('Short reasoning may reduce your evaluation weight');
    }

    // Check evaluator eligibility
    const eligibility = await this.checkEvaluatorEligibility(evaluatorAddress);
    if (!eligibility.isEligible) {
      errors.push(...eligibility.reasons);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Check evaluator eligibility
   */
  async checkEvaluatorEligibility(evaluatorAddress: string): Promise<{
    isEligible: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check if user exists
    const user = await pool.query(
      'SELECT wallet_address, created_at FROM users WHERE wallet_address = $1',
      [evaluatorAddress.toLowerCase()]
    );

    if (user.rows.length === 0) {
      reasons.push('User not found - please register first');
      return { isEligible: false, reasons };
    }

    // Check account age (must be at least 1 hour old to prevent spam)
    const accountAge = Date.now() - new Date(user.rows[0].created_at).getTime();
    const minAge = 60 * 60 * 1000; // 1 hour

    if (accountAge < minAge) {
      reasons.push('Account too new - please wait before evaluating');
      return { isEligible: false, reasons };
    }

    // Check for suspicious activity (too many recent evaluations)
    const recentEvaluations = await pool.query(
      `SELECT COUNT(*) as count
       FROM evaluations
       WHERE evaluator_address = $1
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [evaluatorAddress.toLowerCase()]
    );

    const recentCount = parseInt(recentEvaluations.rows[0].count);
    if (recentCount >= 10) {
      reasons.push('Too many recent evaluations - please wait before submitting more');
      return { isEligible: false, reasons };
    }

    return { isEligible: true, reasons: [] };
  },

  /**
   * Validate session can accept evaluations
   */
  async validateSessionAcceptsEvaluations(sessionId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const session = await pool.query(
      `SELECT
        status,
        voting_end_time,
        start_time,
        (SELECT COUNT(*) FROM evaluations WHERE session_id = $1) as evaluation_count
      FROM sessions
      WHERE id = $1`,
      [sessionId]
    );

    if (session.rows.length === 0) {
      errors.push('Session not found');
      return { isValid: false, errors, warnings };
    }

    const { status, voting_end_time, start_time, evaluation_count } = session.rows[0];

    // Must be in voting phase
    if (status !== 'voting') {
      errors.push('Session must be in voting phase');
    }

    // Must have voting end time set
    if (!voting_end_time) {
      errors.push('Voting end time not set');
    }

    // Must not be expired
    if (voting_end_time && new Date(voting_end_time) < new Date()) {
      errors.push('Voting period has expired');
    }

    // Warn if close to deadline
    if (voting_end_time) {
      const timeRemaining = new Date(voting_end_time).getTime() - Date.now();
      const oneHour = 60 * 60 * 1000;
      if (timeRemaining < oneHour && timeRemaining > 0) {
        warnings.push(`Only ${Math.round(timeRemaining / 60000)} minutes remaining to evaluate`);
      }
    }

    // Warn if nearing max evaluations
    const maxEvaluations = 100;
    if (evaluation_count >= maxEvaluations) {
      errors.push('Maximum evaluations reached for this session');
    } else if (evaluation_count >= maxEvaluations * 0.9) {
      warnings.push(`Session nearing maximum evaluations (${evaluation_count}/${maxEvaluations})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate confidence value
   */
  validateConfidence(confidence: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof confidence !== 'number' || isNaN(confidence)) {
      errors.push('Confidence must be a number');
    } else if (confidence < 0) {
      errors.push('Confidence cannot be negative');
    } else if (confidence > 100) {
      errors.push('Confidence cannot exceed 100');
    } else if (confidence === 0) {
      warnings.push('Zero confidence is unusual - are you sure?');
    } else if (confidence < 20) {
      warnings.push('Very low confidence will significantly reduce your evaluation weight');
    } else if (confidence === 100) {
      warnings.push('100% confidence is rare - ensure you have strong evidence');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate reasoning quality
   */
  validateReasoning(reasoning: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!reasoning) {
      errors.push('Reasoning is required');
      return { isValid: false, errors, warnings };
    }

    const trimmed = reasoning.trim();

    if (trimmed.length === 0) {
      errors.push('Reasoning cannot be empty');
    } else if (trimmed.length < 10) {
      errors.push('Reasoning must be at least 10 characters');
    } else if (trimmed.length < 50) {
      warnings.push('Short reasoning may reduce your evaluation weight');
    } else if (trimmed.length > 2000) {
      errors.push('Reasoning must not exceed 2000 characters');
    } else if (trimmed.length > 1000) {
      warnings.push('Very long reasoning may be truncated in some views');
    }

    // Check for spam patterns
    const hasRepeatedChars = /(.)\1{10,}/.test(trimmed);
    if (hasRepeatedChars) {
      errors.push('Reasoning appears to contain spam (repeated characters)');
    }

    const words = trimmed.split(/\s+/);
    if (words.length < 5) {
      warnings.push('Reasoning should contain at least a few words');
    }

    // Check for all caps (except for short text)
    if (trimmed.length > 20 && trimmed === trimmed.toUpperCase()) {
      warnings.push('Please avoid writing in all caps');
    }

    // Check for gibberish (no vowels)
    const hasVowels = /[aeiou]/i.test(trimmed);
    if (!hasVowels && trimmed.length > 10) {
      warnings.push('Reasoning appears unusual - please ensure it is meaningful');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Get evaluation rate limit status
   */
  async getEvaluationRateLimit(evaluatorAddress: string): Promise<{
    current: number;
    limit: number;
    resetTime: Date;
    canEvaluate: boolean;
  }> {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM evaluations
       WHERE evaluator_address = $1
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [evaluatorAddress.toLowerCase()]
    );

    const current = parseInt(result.rows[0].count);
    const limit = 10; // 10 evaluations per hour
    const resetTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    return {
      current,
      limit,
      resetTime,
      canEvaluate: current < limit,
    };
  },
};
