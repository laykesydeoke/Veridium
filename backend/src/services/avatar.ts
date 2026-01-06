import crypto from 'crypto';

export const AvatarService = {
  /**
   * Generate a deterministic avatar URL from address
   * Uses dicebear API for consistent avatars
   */
  generateAvatar(address: string, style: string = 'identicon'): string {
    const seed = address.toLowerCase();
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  },

  /**
   * Get Gravatar URL from email
   */
  getGravatar(email: string, size: number = 200): string {
    const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  },

  /**
   * Validate avatar URL
   */
  validateAvatarUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      const allowedDomains = [
        'api.dicebear.com',
        'gravatar.com',
        'www.gravatar.com',
        'cdn.stamp.fyi', // Basename NFT images
        'ipfs.io',
        'cloudflare-ipfs.com',
      ];

      if (!allowedProtocols.includes(parsed.protocol)) {
        return false;
      }

      // Check if domain is allowed or is a subdomain of allowed domains
      const hostname = parsed.hostname;
      const isAllowed = allowedDomains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );

      return isAllowed;
    } catch {
      return false;
    }
  },

  /**
   * Get preferred avatar for a user
   */
  async getPreferredAvatar(user: {
    avatar_url?: string;
    email?: string;
    wallet_address: string;
  }): Promise<string> {
    // Priority: custom avatar > gravatar > generated
    if (user.avatar_url && this.validateAvatarUrl(user.avatar_url)) {
      return user.avatar_url;
    }

    if (user.email) {
      return this.getGravatar(user.email);
    }

    return this.generateAvatar(user.wallet_address);
  },
};
