export interface ProfileMetadata {
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  website?: string;
  interests?: string[];
  expertise?: string[];
}

export interface ProfileActivity {
  lastSessionAt?: Date;
  lastEvaluationAt?: Date;
  lastLoginAt?: Date;
  streakDays?: number;
}

export interface ProfileBadge {
  id: string;
  type: 'achievement' | 'verification' | 'custom';
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface ExtendedProfile {
  id: string;
  walletAddress: string;
  basename?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  metadata?: ProfileMetadata;
  activity?: ProfileActivity;
  badges?: ProfileBadge[];
  createdAt: Date;
}
