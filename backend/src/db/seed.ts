import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

export async function runSeeds() {
  console.log('Running database seeds...');

  try {
    const seeds = [
      '001_test_users.sql',
      '002_test_sessions.sql',
    ];

    for (const seed of seeds) {
      console.log(`Running seed: ${seed}`);
      const seedSQL = readFileSync(
        join(__dirname, 'seeds', seed),
        'utf-8'
      );
      await pool.query(seedSQL);
      console.log(`Completed seed: ${seed}`);
    }

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
