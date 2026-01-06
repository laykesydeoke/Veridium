import { cacheGet, cacheSet, cacheDel, redis } from '../config/redis';

/**
 * Profile-specific cache manager with advanced features
 */
export const ProfileCache = {
  /**
   * Get cached profile with automatic refresh
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = await cacheGet<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await cacheSet(key, fresh, ttl);
    return fresh;
  },

  /**
   * Invalidate all caches for a user
   */
  async invalidateUser(address: string): Promise<void> {
    const keys = [
      `profile:${address.toLowerCase()}`,
      `basename:reverse:${address.toLowerCase()}`,
      `analytics:${address.toLowerCase()}`,
      `history:${address.toLowerCase()}`,
    ];

    await Promise.all(keys.map((key) => cacheDel(key)));
  },

  /**
   * Warm cache for frequently accessed profiles
   */
  async warmCache(addresses: string[], fetcher: (addr: string) => Promise<any>): Promise<void> {
    await Promise.all(
      addresses.map(async (address) => {
        const key = `profile:${address.toLowerCase()}`;
        const data = await fetcher(address);
        await cacheSet(key, data, 600); // 10 minutes for warm cache
      })
    );
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    keys: number;
    memoryUsage: number;
  }> {
    const info = await redis.info('memory');
    const dbsize = await redis.dbsize();

    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    return {
      keys: dbsize,
      memoryUsage,
    };
  },

  /**
   * Clear all profile-related caches
   */
  async clearAllProfileCaches(): Promise<void> {
    const pattern = 'profile:*';
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
