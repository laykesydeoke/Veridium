/**
 * Evaluation helper utilities
 */

export const EvaluationHelpers = {
  /**
   * Format weight for display
   */
  formatWeight(weight: number): string {
    return `${weight}pts`;
  },

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${confidence}%`;
  },

  /**
   * Get confidence level label
   */
  getConfidenceLabel(confidence: number): string {
    if (confidence >= 80) return 'Very High';
    if (confidence >= 60) return 'High';
    if (confidence >= 40) return 'Medium';
    if (confidence >= 20) return 'Low';
    return 'Very Low';
  },

  /**
   * Get quality score label
   */
  getQualityLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  },

  /**
   * Calculate time remaining display
   */
  formatTimeRemaining(milliseconds: number): string {
    if (milliseconds <= 0) return 'Expired';

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  },

  /**
   * Validate reasoning has minimum quality
   */
  hasMinimumQuality(reasoning: string): boolean {
    const trimmed = reasoning.trim();
    if (trimmed.length < 10) return false;

    const words = trimmed.split(/\s+/).length;
    if (words < 5) return false;

    const hasVowels = /[aeiou]/i.test(trimmed);
    if (!hasVowels) return false;

    return true;
  },

  /**
   * Calculate consensus strength category
   */
  getConsensusCategory(strength: number): 'strong' | 'moderate' | 'weak' | 'divided' {
    if (strength >= 70) return 'strong';
    if (strength >= 50) return 'moderate';
    if (strength >= 30) return 'weak';
    return 'divided';
  },

  /**
   * Get vote label
   */
  getVoteLabel(vote: boolean): string {
    return vote ? 'Initiator' : 'Challenger';
  },

  /**
   * Calculate percentage
   */
  calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  },

  /**
   * Format margin display
   */
  formatMargin(initiatorWeight: number, challengerWeight: number): string {
    const total = initiatorWeight + challengerWeight;
    if (total === 0) return '0%';

    const margin = Math.abs(initiatorWeight - challengerWeight);
    const percentage = (margin / total) * 100;

    return `${Math.round(percentage)}%`;
  },

  /**
   * Truncate reasoning for preview
   */
  truncateReasoning(reasoning: string, maxLength: number = 100): string {
    if (reasoning.length <= maxLength) return reasoning;
    return reasoning.slice(0, maxLength) + '...';
  },

  /**
   * Get evaluation status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'yellow';
      case 'active': return 'blue';
      case 'voting': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  },
};
