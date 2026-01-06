-- Rollback complete schema migration

-- Drop triggers
DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON notification_preferences;
DROP TRIGGER IF EXISTS update_arguments_updated_at ON arguments;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS session_participants;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS credibility_events;
DROP TABLE IF EXISTS arguments;

-- Revert sessions table changes
ALTER TABLE sessions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE sessions DROP COLUMN IF EXISTS metadata;
ALTER TABLE sessions DROP COLUMN IF EXISTS challenger_votes;
ALTER TABLE sessions DROP COLUMN IF EXISTS initiator_votes;
ALTER TABLE sessions DROP COLUMN IF EXISTS total_votes;
ALTER TABLE sessions DROP COLUMN IF EXISTS voting_end_time;

-- Revert evaluations table changes
ALTER TABLE evaluations DROP COLUMN IF EXISTS metadata;
ALTER TABLE evaluations DROP COLUMN IF EXISTS is_correct;
ALTER TABLE evaluations DROP COLUMN IF EXISTS confidence_score;

-- Revert users table changes
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS display_name;
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Drop enum types
DROP TYPE IF EXISTS credibility_event_type;
DROP TYPE IF EXISTS achievement_type;
DROP TYPE IF EXISTS vote_type;
DROP TYPE IF EXISTS session_status;
