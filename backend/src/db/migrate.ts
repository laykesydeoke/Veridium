import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

export async function runMigrations() {
  console.log('Running database migrations...');

  try {
    const migrations = [
      '001_initial_schema.sql',
      '002_complete_schema.sql',
      '003_views.sql',
    ];

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const migrationSQL = readFileSync(
        join(__dirname, 'migrations', migration),
        'utf-8'
      );
      await pool.query(migrationSQL);
      console.log(`Completed migration: ${migration}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function rollbackMigration(migrationName: string) {
  console.log(`Rolling back migration: ${migrationName}`);

  try {
    const rollbackSQL = readFileSync(
      join(__dirname, 'migrations', 'rollback', `${migrationName}_rollback.sql`),
      'utf-8'
    );
    await pool.query(rollbackSQL);
    console.log(`Rollback completed: ${migrationName}`);
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

if (require.main === module) {
  const command = process.argv[2];

  if (command === 'rollback') {
    const migrationName = process.argv[3];
    if (!migrationName) {
      console.error('Please specify migration name to rollback');
      process.exit(1);
    }
    rollbackMigration(migrationName)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}
