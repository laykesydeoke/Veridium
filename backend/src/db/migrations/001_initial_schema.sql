-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  basename VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_address VARCHAR(42) UNIQUE NOT NULL,
  topic VARCHAR(500) NOT NULL,
  description TEXT,
  initiator_address VARCHAR(42) NOT NULL,
  challenger_address VARCHAR(42),
  wager_amount VARCHAR(78) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'voting', 'completed', 'cancelled')),
  winner_address VARCHAR(42),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_address ON sessions(session_address);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_initiator ON sessions(initiator_address);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  evaluator_address VARCHAR(42) NOT NULL,
  vote VARCHAR(20) NOT NULL CHECK (vote IN ('initiator', 'challenger', 'tie')),
  weight INTEGER NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evaluations_session ON evaluations(session_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_address);

-- Create credibility_snapshots table
CREATE TABLE IF NOT EXISTS credibility_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL,
  total_score INTEGER NOT NULL,
  sessions_participated INTEGER NOT NULL,
  sessions_won INTEGER NOT NULL,
  evaluations_submitted INTEGER NOT NULL,
  evaluations_correct INTEGER NOT NULL,
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credibility_user ON credibility_snapshots(user_address);
CREATE INDEX idx_credibility_snapshot_at ON credibility_snapshots(snapshot_at);
