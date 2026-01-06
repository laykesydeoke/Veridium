# Database Schema Documentation

## Overview
Veridium uses PostgreSQL for persistent data storage with a comprehensive schema supporting users, sessions, evaluations, credibility tracking, and achievements.

## Tables

### users
Stores user account information and profile data.

**Columns:**
- `id` (UUID, PK): Unique user identifier
- `wallet_address` (VARCHAR, UNIQUE): Ethereum wallet address
- `basename` (VARCHAR): Base namespace username
- `email` (VARCHAR, UNIQUE): User email address
- `display_name` (VARCHAR): User display name
- `avatar_url` (TEXT): Profile avatar URL
- `bio` (TEXT): User biography
- `is_verified` (BOOLEAN): Verification status
- `created_at` (TIMESTAMP): Account creation time
- `updated_at` (TIMESTAMP): Last update time
- `deleted_at` (TIMESTAMP): Soft delete timestamp

**Indexes:**
- `idx_users_wallet`: wallet_address
- `idx_users_basename`: basename (partial, WHERE basename IS NOT NULL)
- `idx_users_verified`: is_verified (partial, WHERE is_verified = TRUE)
- `idx_users_deleted`: deleted_at (partial, WHERE deleted_at IS NULL)

### sessions
Stores debate session information and state.

**Columns:**
- `id` (UUID, PK): Session identifier
- `session_address` (VARCHAR, UNIQUE): Onchain contract address
- `topic` (VARCHAR): Debate topic
- `description` (TEXT): Session description
- `initiator_address` (VARCHAR): Initiator wallet address
- `challenger_address` (VARCHAR): Challenger wallet address
- `wager_amount` (VARCHAR): Wager in wei
- `status` (session_status ENUM): Current session state
- `winner_address` (VARCHAR): Winner wallet address
- `start_time` (TIMESTAMP): Session start time
- `end_time` (TIMESTAMP): Session end time
- `voting_end_time` (TIMESTAMP): Voting deadline
- `total_votes` (INTEGER): Total vote count
- `initiator_votes` (INTEGER): Votes for initiator
- `challenger_votes` (INTEGER): Votes for challenger
- `metadata` (JSONB): Additional session data
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time
- `deleted_at` (TIMESTAMP): Soft delete timestamp

**Indexes:**
- `idx_sessions_address`: session_address
- `idx_sessions_status`: status
- `idx_sessions_initiator`: initiator_address
- `idx_sessions_voting_end`: voting_end_time (partial)
- `idx_sessions_deleted`: deleted_at (partial)

### arguments
Stores async debate arguments and responses.

**Columns:**
- `id` (UUID, PK): Argument identifier
- `session_id` (UUID, FK → sessions): Parent session
- `author_address` (VARCHAR): Author wallet address
- `side` (VARCHAR): 'initiator' or 'challenger'
- `content` (TEXT): Argument content
- `parent_id` (UUID, FK → arguments): Parent argument for threading
- `upvotes` (INTEGER): Upvote count
- `downvotes` (INTEGER): Downvote count
- `is_pinned` (BOOLEAN): Pin status
- `metadata` (JSONB): Additional data
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update
- `deleted_at` (TIMESTAMP): Soft delete

**Indexes:**
- `idx_arguments_session`: session_id
- `idx_arguments_author`: author_address
- `idx_arguments_parent`: parent_id (partial)
- `idx_arguments_pinned`: is_pinned (partial)
- `idx_arguments_deleted`: deleted_at (partial)

### evaluations
Stores evaluator votes and assessments.

**Columns:**
- `id` (UUID, PK): Evaluation identifier
- `session_id` (UUID, FK → sessions): Session being evaluated
- `evaluator_address` (VARCHAR): Evaluator wallet
- `vote` (vote_type ENUM): Vote choice
- `weight` (INTEGER): Vote weight based on credibility
- `reasoning` (TEXT): Vote justification
- `confidence_score` (INTEGER): Confidence level (0-100)
- `is_correct` (BOOLEAN): Correctness flag
- `metadata` (JSONB): Additional data
- `created_at` (TIMESTAMP): Submission time

**Indexes:**
- `idx_evaluations_session`: session_id
- `idx_evaluations_evaluator`: evaluator_address
- `idx_evaluations_correct`: is_correct (partial)
- `idx_evaluations_confidence`: confidence_score (partial)

### credibility_events
Tracks credibility score changes over time.

**Columns:**
- `id` (UUID, PK): Event identifier
- `user_address` (VARCHAR): User wallet
- `event_type` (credibility_event_type ENUM): Event category
- `session_id` (UUID, FK → sessions): Related session
- `points_change` (INTEGER): Points delta
- `old_score` (INTEGER): Score before event
- `new_score` (INTEGER): Score after event
- `metadata` (JSONB): Event details
- `created_at` (TIMESTAMP): Event time

**Indexes:**
- `idx_credibility_events_user`: user_address
- `idx_credibility_events_type`: event_type
- `idx_credibility_events_session`: session_id (partial)
- `idx_credibility_events_created`: created_at DESC

### achievements
Stores unlocked user achievements.

**Columns:**
- `id` (UUID, PK): Achievement identifier
- `user_address` (VARCHAR): User wallet
- `achievement_type` (achievement_type ENUM): Achievement category
- `token_id` (BIGINT): NFT token ID
- `transaction_hash` (VARCHAR): Mint transaction
- `metadata` (JSONB): Achievement data
- `unlocked_at` (TIMESTAMP): Unlock time

**Indexes:**
- `idx_achievements_user_type`: (user_address, achievement_type) UNIQUE
- `idx_achievements_type`: achievement_type
- `idx_achievements_unlocked`: unlocked_at DESC

## Enums

### session_status
- `pending`: Waiting for challenger
- `active`: Session in progress
- `voting`: Evaluation phase
- `completed`: Finished with winner
- `cancelled`: Session cancelled

### vote_type
- `initiator`: Vote for initiator
- `challenger`: Vote for challenger
- `tie`: Vote for tie

### achievement_type
- `first_session`: First session participation
- `first_win`: First session victory
- `first_evaluation`: First evaluation submitted
- `ten_sessions`: 10 sessions participated
- `fifty_sessions`: 50 sessions participated
- `high_accuracy`: 80%+ evaluation accuracy
- `legendary`: Top 10 credibility
- `champion`: Most session wins

### credibility_event_type
- `session_participated`: Session participation
- `session_won`: Session victory
- `evaluation_submitted`: Evaluation submitted
- `evaluation_correct`: Correct evaluation
- `evaluation_incorrect`: Incorrect evaluation
- `achievement_unlocked`: Achievement earned

## Views

### v_credibility_leaderboard
Ranked list of users by credibility score.

### v_active_sessions
Active sessions with participant details.

### v_user_session_history
User session participation history.

### v_achievement_progress
User achievement progress tracking.

### v_session_evaluation_stats
Session evaluation statistics with vote weights.

## Migrations

Run migrations: `pnpm migrate`
Rollback migration: `pnpm migrate:rollback <migration_name>`
Seed database: `pnpm seed`
