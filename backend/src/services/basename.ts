import { createPublicClient, http, isAddress, namehash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { normalize } from 'viem/ens';
import { env } from '../config/env';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

const L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';

const publicClient = createPublicClient({
  chain: env.CHAIN_ID === '8453' ? base : baseSepolia,
  transport: http(env.BASE_RPC_URL),
});

export interface BasenameInfo {
  name: string;
  address: string;
  avatar?: string;
  description?: string;
  twitter?: string;
  github?: string;
  url?: string;
}

export const BasenameService = {
  /**
   * Validates a basename format
   */
  validateBasename(basename: string): boolean {
    if (!basename) return false;

    // Must end with .base.eth
    if (!basename.endsWith('.base.eth')) return false;

    // Extract name part
    const namePart = basename.replace('.base.eth', '');

    // Must be 3-30 characters
    if (namePart.length < 3 || namePart.length > 30) return false;

    // Must contain only lowercase alphanumeric and hyphens
    if (!/^[a-z0-9-]+$/.test(namePart)) return false;

    // Cannot start or end with hyphen
    if (namePart.startsWith('-') || namePart.endsWith('-')) return false;

    return true;
  },

  /**
   * Resolves a basename to an address
   */
  async resolveBasename(basename: string): Promise<string | null> {
    try {
      if (!this.validateBasename(basename)) {
        return null;
      }

      const cacheKey = `basename:resolve:${basename}`;
      const cached = await cacheGet<string>(cacheKey);
      if (cached) return cached;

      const normalizedName = normalize(basename);
      const address = await publicClient.getEnsAddress({
        name: normalizedName,
      });

      if (address) {
        await cacheSet(cacheKey, address, 3600); // Cache for 1 hour
      }

      return address;
    } catch (error) {
      console.error('Basename resolution error:', error);
      return null;
    }
  },

  /**
   * Reverse resolves an address to basename
   */
  async reverseResolve(address: string): Promise<string | null> {
    try {
      if (!isAddress(address)) {
        return null;
      }

      const cacheKey = `basename:reverse:${address.toLowerCase()}`;
      const cached = await cacheGet<string>(cacheKey);
      if (cached) return cached;

      const basename = await publicClient.getEnsName({
        address: address as `0x${string}`,
      });

      if (basename) {
        await cacheSet(cacheKey, basename, 3600);
      }

      return basename;
    } catch (error) {
      console.error('Reverse resolution error:', error);
      return null;
    }
  },

  /**
   * Batch resolve multiple basenames
   */
  async batchResolve(basenames: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    await Promise.all(
      basenames.map(async (basename) => {
        const address = await this.resolveBasename(basename);
        results.set(basename, address);
      })
    );

    return results;
  },

  /**
   * Batch reverse resolve multiple addresses
   */
  async batchReverseResolve(addresses: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    await Promise.all(
      addresses.map(async (address) => {
        const basename = await this.reverseResolve(address);
        results.set(address.toLowerCase(), basename);
      })
    );

    return results;
  },

  /**
   * Check if a basename is available (not registered)
   */
  async isAvailable(basename: string): Promise<boolean> {
    if (!this.validateBasename(basename)) {
      return false;
    }

    const address = await this.resolveBasename(basename);
    return address === null;
  },

  /**
   * Get basename info including text records
   */
  async getBasenameInfo(basename: string): Promise<BasenameInfo | null> {
    try {
      const address = await this.resolveBasename(basename);
      if (!address) return null;

      const cacheKey = `basename:info:${basename}`;
      const cached = await cacheGet<BasenameInfo>(cacheKey);
      if (cached) return cached;

      // Get text records
      const [avatar, description, twitter, github, url] = await Promise.allSettled([
        publicClient.getEnsAvatar({ name: normalize(basename) }),
        publicClient.getEnsText({ name: normalize(basename), key: 'description' }),
        publicClient.getEnsText({ name: normalize(basename), key: 'com.twitter' }),
        publicClient.getEnsText({ name: normalize(basename), key: 'com.github' }),
        publicClient.getEnsText({ name: normalize(basename), key: 'url' }),
      ]);

      const info: BasenameInfo = {
        name: basename,
        address,
        avatar: avatar.status === 'fulfilled' ? avatar.value || undefined : undefined,
        description: description.status === 'fulfilled' ? description.value || undefined : undefined,
        twitter: twitter.status === 'fulfilled' ? twitter.value || undefined : undefined,
        github: github.status === 'fulfilled' ? github.value || undefined : undefined,
        url: url.status === 'fulfilled' ? url.value || undefined : undefined,
      };

      await cacheSet(cacheKey, info, 1800); // Cache for 30 minutes
      return info;
    } catch (error) {
      console.error('Get basename info error:', error);
      return null;
    }
  },

  /**
   * Clear cache for a basename or address
   */
  async clearCache(basenameOrAddress: string): Promise<void> {
    if (isAddress(basenameOrAddress)) {
      await cacheDel(`basename:reverse:${basenameOrAddress.toLowerCase()}`);
    } else {
      await cacheDel(`basename:resolve:${basenameOrAddress}`);
      await cacheDel(`basename:info:${basenameOrAddress}`);
    }
  },
};
