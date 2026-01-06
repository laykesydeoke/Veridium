import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
  BASE_RPC_URL: z.string().url(),
  CHAIN_ID: z.string().default('84532'),
  SESSION_FACTORY_ADDRESS: z.string().optional(),
  CREDIBILITY_REGISTRY_ADDRESS: z.string().optional(),
  ASSESSMENT_MANAGER_ADDRESS: z.string().optional(),
  WAGER_POOL_ADDRESS: z.string().optional(),
  PINATA_API_KEY: z.string().optional(),
  PINATA_SECRET_KEY: z.string().optional(),
  PINATA_JWT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
