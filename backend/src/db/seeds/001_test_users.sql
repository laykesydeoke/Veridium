-- Seed test users for development
INSERT INTO users (wallet_address, basename, display_name, email, bio, is_verified)
VALUES
  ('0x1111111111111111111111111111111111111111', 'alice.base.eth', 'Alice Debater', 'alice@example.com', 'Professional debater and truth-seeker', TRUE),
  ('0x2222222222222222222222222222222222222222', 'bob.base.eth', 'Bob Philosopher', 'bob@example.com', 'Philosophy enthusiast', TRUE),
  ('0x3333333333333333333333333333333333333333', 'carol.base.eth', 'Carol Thinker', 'carol@example.com', 'Critical thinking advocate', TRUE),
  ('0x4444444444444444444444444444444444444444', 'dave.base.eth', 'Dave Analyst', 'dave@example.com', 'Data-driven discourse', FALSE),
  ('0x5555555555555555555555555555555555555555', 'eve.base.eth', 'Eve Mediator', 'eve@example.com', 'Neutral evaluator', TRUE)
ON CONFLICT (wallet_address) DO NOTHING;

-- Seed credibility snapshots
INSERT INTO credibility_snapshots (user_address, total_score, sessions_participated, sessions_won, evaluations_submitted, evaluations_correct)
VALUES
  ('0x1111111111111111111111111111111111111111', 450, 25, 15, 50, 42),
  ('0x2222222222222222222222222222222222222222', 380, 20, 10, 45, 38),
  ('0x3333333333333333333333333333333333333333', 520, 30, 18, 60, 54),
  ('0x4444444444444444444444444444444444444444', 120, 8, 3, 15, 12),
  ('0x5555555555555555555555555555555555555555', 620, 35, 20, 80, 76)
ON CONFLICT DO NOTHING;

-- Seed notification preferences
INSERT INTO notification_preferences (user_address, email_notifications, session_invites, evaluation_reminders)
VALUES
  ('0x1111111111111111111111111111111111111111', TRUE, TRUE, TRUE),
  ('0x2222222222222222222222222222222222222222', TRUE, TRUE, FALSE),
  ('0x3333333333333333333333333333333333333333', TRUE, FALSE, TRUE),
  ('0x4444444444444444444444444444444444444444', FALSE, TRUE, TRUE),
  ('0x5555555555555555555555555555555555555555', TRUE, TRUE, TRUE)
ON CONFLICT (user_address) DO NOTHING;
