import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

export async function runMigrations() {
  console.log('Running database migrations...');

  try {
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
