-- Create enum types
CREATE TYPE session_status AS ENUM ('pending', 'active', 'voting', 'completed', 'cancelled');
CREATE TYPE vote_type AS ENUM ('initiator', 'challenger', 'tie');
CREATE TYPE achievement_type AS ENUM ('first_session', 'first_win', 'first_evaluation', 'ten_sessions', 'fifty_sessions', 'high_accuracy', 'legendary', 'champion');
CREATE TYPE credibility_event_type AS ENUM ('session_participated', 'session_won', 'evaluation_submitted', 'evaluation_correct', 'evaluation_incorrect', 'achievement_unlocked');

-- Enhance users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_basename ON users(basename) WHERE basename IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- Enhance sessions table with new status type
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ALTER COLUMN status TYPE session_status USING status::session_status;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS voting_end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS initiator_votes INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS challenger_votes INTEGER DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_sessions_voting_end ON sessions(voting_end_time) WHERE voting_end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_deleted ON sessions(deleted_at) WHERE deleted_at IS NULL;

-- Create arguments table for async sessions
CREATE TABLE IF NOT EXISTS arguments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_address VARCHAR(42) NOT NULL,
  side VARCHAR(20) NOT NULL CHECK (side IN ('initiator', 'challenger')),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES arguments(id) ON DELETE SET NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_arguments_session ON arguments(session_id);
CREATE INDEX idx_arguments_author ON arguments(author_address);
CREATE INDEX idx_arguments_parent ON arguments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_arguments_pinned ON arguments(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_arguments_deleted ON arguments(deleted_at) WHERE deleted_at IS NULL;

-- Enhance evaluations table
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_vote_check;
ALTER TABLE evaluations ALTER COLUMN vote TYPE vote_type USING vote::vote_type;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_evaluations_correct ON evaluations(is_correct) WHERE is_correct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evaluations_confidence ON evaluations(confidence_score) WHERE confidence_score IS NOT NULL;

-- Create credibility_events table
CREATE TABLE IF NOT EXISTS credibility_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL,
  event_type credibility_event_type NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credibility_events_user ON credibility_events(user_address);
CREATE INDEX idx_credibility_events_type ON credibility_events(event_type);
CREATE INDEX idx_credibility_events_session ON credibility_events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_credibility_events_created ON credibility_events(created_at DESC);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL,
  achievement_type achievement_type NOT NULL,
  token_id BIGINT,
  transaction_hash VARCHAR(66),
  metadata JSONB,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_achievements_user_type ON achievements(user_address, achievement_type);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_unlocked ON achievements(unlocked_at DESC);

-- Create session_participants table for tracking
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('initiator', 'challenger', 'evaluator')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_session_participants_unique ON session_participants(session_id, user_address, role);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_address);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL UNIQUE REFERENCES users(wallet_address) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  session_invites BOOLEAN DEFAULT TRUE,
  evaluation_reminders BOOLEAN DEFAULT TRUE,
  achievement_alerts BOOLEAN DEFAULT TRUE,
  credibility_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_address);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_arguments_updated_at ON arguments;
CREATE TRIGGER update_arguments_updated_at BEFORE UPDATE ON arguments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
