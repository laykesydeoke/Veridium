export const APP_NAME = 'Veridium';
export const APP_DESCRIPTION =
  'A decentralized discourse platform built on Base';

export const CHAIN_ID = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
} as const;

export const SESSION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EVALUATING: 'evaluating',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const VERDICT = {
  CREATOR: 'creator',
  CHALLENGER: 'challenger',
  DRAW: 'draw',
} as const;

export const MIN_WAGER = 5;
export const MAX_WAGER = 1000;

export const PLATFORM_FEE_PERCENT = 3;
export const EVALUATOR_REWARD_PERCENT = 10;

export const MIN_EVALUATIONS = 3;
export const BASE_EVALUATOR_WEIGHT = 100;
export const MAX_EVALUATOR_WEIGHT = 1000;

export const ROUTES = {
  HOME: '/',
  SESSIONS: '/sessions',
  CREATE_SESSION: '/create-session',
  LEADERBOARD: '/leaderboard',
  ACHIEVEMENTS: '/achievements',
  PROFILE: '/profile',
} as const;
