export const SessionHelpers = {
  /**
   * Calculate session duration in milliseconds
   */
  calculateDuration(startTime: Date, endTime?: Date): number {
    const end = endTime || new Date();
    return end.getTime() - new Date(startTime).getTime();
  },

  /**
   * Format duration to human readable string
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  /**
   * Check if session is expired
   */
  isExpired(votingEndTime?: Date): boolean {
    if (!votingEndTime) return false;
    return new Date() > new Date(votingEndTime);
  },

  /**
   * Get time remaining until voting ends
   */
  getTimeRemaining(votingEndTime: Date): number {
    return Math.max(0, new Date(votingEndTime).getTime() - Date.now());
  },

  /**
   * Calculate win probability based on votes
   */
  calculateWinProbability(
    initiatorWeight: number,
    challengerWeight: number
  ): { initiator: number; challenger: number; tie: number } {
    const total = initiatorWeight + challengerWeight;

    if (total === 0) {
      return { initiator: 50, challenger: 50, tie: 0 };
    }

    const initiatorPercent = (initiatorWeight / total) * 100;
    const challengerPercent = (challengerWeight / total) * 100;

    // Consider tie if difference is less than 5%
    const diff = Math.abs(initiatorPercent - challengerPercent);
    const tiePercent = diff < 5 ? 100 - diff * 20 : 0;

    return {
      initiator: Math.round(initiatorPercent * (1 - tiePercent / 100)),
      challenger: Math.round(challengerPercent * (1 - tiePercent / 100)),
      tie: Math.round(tiePercent),
    };
  },
};
