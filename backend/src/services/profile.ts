import { pool } from '../config/database';
import { UserModel } from '../models/user';
import { BasenameService } from './basename';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

export interface UserProfile {
  id: string;
  walletAddress: string;
  basename?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: Date;
  stats?: {
    totalSessions: number;
    sessionsWon: number;
    totalEvaluations: number;
    credibilityScore: number;
    rank?: number;
  };
}

export interface ProfileUpdateData {
  basename?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
}

export const ProfileService = {
  /**
   * Get user profile by wallet address
   */
  async getProfileByAddress(address: string): Promise<UserProfile | null> {
    const cacheKey = `profile:${address.toLowerCase()}`;
    const cached = await cacheGet<UserProfile>(cacheKey);
    if (cached) return cached;

    const user = await UserModel.findByAddress(address);
    if (!user) return null;

    const profile = await this.enrichProfile(user);
    await cacheSet(cacheKey, profile, 300); // Cache for 5 minutes
    return profile;
  },

  /**
   * Get user profile by basename
   */
  async getProfileByBasename(basename: string): Promise<UserProfile | null> {
    // First resolve basename to address
    const address = await BasenameService.resolveBasename(basename);
    if (!address) return null;

    return this.getProfileByAddress(address);
  },

  /**
   * Get user profile by ID
   */
  async getProfileById(id: string): Promise<UserProfile | null> {
    const user = await UserModel.findById(id);
    if (!user) return null;

    return this.enrichProfile(user);
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: ProfileUpdateData
  ): Promise<UserProfile> {
    // Validate basename if provided
    if (data.basename && !BasenameService.validateBasename(data.basename)) {
      throw new Error('Invalid basename format');
    }

    // Check if basename is available if changing
    if (data.basename) {
      const existing = await UserModel.findByAddress(data.basename);
      if (existing && existing.id !== userId) {
        const resolved = await BasenameService.resolveBasename(data.basename);
        if (resolved) {
          throw new Error('Basename already in use');
        }
      }
    }

    const updated = await UserModel.update(userId, data);

    // Clear cache
    await cacheDel(`profile:${updated.wallet_address.toLowerCase()}`);

    return this.enrichProfile(updated);
  },

  /**
   * Search profiles by name or basename
   */
  async searchProfiles(query: string, limit: number = 20): Promise<UserProfile[]> {
    const searchPattern = `%${query.toLowerCase()}%`;

    const result = await pool.query(
      `SELECT * FROM users
       WHERE deleted_at IS NULL
         AND (LOWER(basename) LIKE $1
           OR LOWER(display_name) LIKE $1
           OR LOWER(wallet_address) LIKE $1)
       ORDER BY is_verified DESC, created_at DESC
       LIMIT $2`,
      [searchPattern, limit]
    );

    return Promise.all(
      result.rows.map((user) => this.enrichProfile(user))
    );
  },

  /**
   * Get profile analytics
   */
  async getProfileAnalytics(address: string) {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role IN ('initiator', 'challenger')) as total_sessions,
         COUNT(DISTINCT s.id) FILTER (WHERE s.winner_address = $1) as sessions_won,
         COUNT(DISTINCT e.id) as total_evaluations,
         COUNT(DISTINCT a.id) as total_achievements
       FROM users u
       LEFT JOIN session_participants sp ON sp.user_address = u.wallet_address
       LEFT JOIN sessions s ON s.id = sp.session_id
       LEFT JOIN evaluations e ON e.evaluator_address = u.wallet_address
       LEFT JOIN achievements a ON a.user_address = u.wallet_address
       WHERE u.wallet_address = $1
       GROUP BY u.wallet_address`,
      [address.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return {
        totalSessions: 0,
        sessionsWon: 0,
        totalEvaluations: 0,
        totalAchievements: 0,
        winRate: 0,
      };
    }

    const stats = result.rows[0];
    return {
      totalSessions: parseInt(stats.total_sessions),
      sessionsWon: parseInt(stats.sessions_won),
      totalEvaluations: parseInt(stats.total_evaluations),
      totalAchievements: parseInt(stats.total_achievements),
      winRate:
        stats.total_sessions > 0
          ? (stats.sessions_won / stats.total_sessions) * 100
          : 0,
    };
  },

  /**
   * Get profile history
   */
  async getProfileHistory(address: string, limit: number = 50) {
    const result = await pool.query(
      `SELECT * FROM v_user_session_history
       WHERE user_address = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [address.toLowerCase(), limit]
    );

    return result.rows;
  },

  /**
   * Enrich profile with stats
   */
  async enrichProfile(user: any): Promise<UserProfile> {
    const credResult = await pool.query(
      `SELECT total_score, rank
       FROM v_credibility_leaderboard
       WHERE user_address = $1`,
      [user.wallet_address.toLowerCase()]
    );

    const sessionResult = await pool.query(
      `SELECT
         COUNT(DISTINCT sp.session_id) FILTER (WHERE sp.role IN ('initiator', 'challenger')) as total_sessions,
         COUNT(DISTINCT s.id) FILTER (WHERE s.winner_address = $1) as sessions_won,
         COUNT(DISTINCT e.id) as total_evaluations
       FROM session_participants sp
       LEFT JOIN sessions s ON s.id = sp.session_id
       LEFT JOIN evaluations e ON e.session_id = sp.session_id AND e.evaluator_address = $1
       WHERE sp.user_address = $1`,
      [user.wallet_address.toLowerCase()]
    );

    const stats = sessionResult.rows[0];
    const credibility = credResult.rows[0];

    return {
      id: user.id,
      walletAddress: user.wallet_address,
      basename: user.basename,
      displayName: user.display_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      stats: {
        totalSessions: parseInt(stats?.total_sessions || 0),
        sessionsWon: parseInt(stats?.sessions_won || 0),
        totalEvaluations: parseInt(stats?.total_evaluations || 0),
        credibilityScore: parseInt(credibility?.total_score || 0),
        rank: credibility ? parseInt(credibility.rank) : undefined,
      },
    };
  },

  /**
   * Batch get profiles by addresses
   */
  async batchGetProfiles(addresses: string[]): Promise<Map<string, UserProfile>> {
    const profiles = new Map<string, UserProfile>();

    await Promise.all(
      addresses.map(async (address) => {
        const profile = await this.getProfileByAddress(address);
        if (profile) {
          profiles.set(address.toLowerCase(), profile);
        }
      })
    );

    return profiles;
  },
};
