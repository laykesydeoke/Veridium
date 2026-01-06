export const ProfileHelpers = {
  /**
   * Calculate profile completion percentage
   */
  calculateCompleteness(profile: {
    basename?: string;
    display_name?: string;
    email?: string;
    avatar_url?: string;
    bio?: string;
  }): number {
    const fields = [
      profile.basename,
      profile.display_name,
      profile.email,
      profile.avatar_url,
      profile.bio,
    ];

    const filledFields = fields.filter((field) => field && field.length > 0);
    return Math.round((filledFields.length / fields.length) * 100);
  },

  /**
   * Get profile display name priority
   */
  getDisplayName(profile: {
    display_name?: string;
    basename?: string;
    wallet_address: string;
  }): string {
    if (profile.display_name) return profile.display_name;
    if (profile.basename) return profile.basename;
    return `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`;
  },

  /**
   * Sanitize bio text
   */
  sanitizeBio(bio: string): string {
    // Remove potential XSS attempts
    return bio
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 500);
  },

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Extract username from basename
   */
  extractUsername(basename: string): string {
    return basename.replace('.base.eth', '');
  },

  /**
   * Format large numbers for display
   */
  formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  },
};
