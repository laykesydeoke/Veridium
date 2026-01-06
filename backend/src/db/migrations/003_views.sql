-- View for user credibility leaderboard
CREATE OR REPLACE VIEW v_credibility_leaderboard AS
WITH latest_snapshots AS (
  SELECT DISTINCT ON (user_address)
    user_address,
    total_score,
    sessions_participated,
    sessions_won,
    evaluations_submitted,
    evaluations_correct,
    snapshot_at
  FROM credibility_snapshots
  ORDER BY user_address, snapshot_at DESC
)
SELECT
  ls.user_address,
  u.basename,
  u.display_name,
  u.avatar_url,
  ls.total_score,
  ls.sessions_participated,
  ls.sessions_won,
  ls.evaluations_submitted,
  ls.evaluations_correct,
  CASE
    WHEN ls.evaluations_submitted > 0
    THEN ROUND((ls.evaluations_correct::DECIMAL / ls.evaluations_submitted) * 100, 2)
    ELSE 0
  END AS accuracy_percentage,
  RANK() OVER (ORDER BY ls.total_score DESC) AS rank
FROM latest_snapshots ls
LEFT JOIN users u ON u.wallet_address = ls.user_address
WHERE u.deleted_at IS NULL
ORDER BY ls.total_score DESC;

-- View for active sessions with participant info
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT
  s.id,
  s.session_address,
  s.topic,
  s.description,
  s.status,
  s.wager_amount,
  s.start_time,
  s.end_time,
  s.voting_end_time,
  s.total_votes,
  s.initiator_votes,
  s.challenger_votes,
  s.created_at,
  ui.wallet_address AS initiator_address,
  ui.basename AS initiator_basename,
  ui.display_name AS initiator_name,
  uc.wallet_address AS challenger_address,
  uc.basename AS challenger_basename,
  uc.display_name AS challenger_name,
  (SELECT COUNT(*) FROM evaluations e WHERE e.session_id = s.id) AS evaluation_count,
  (SELECT COUNT(*) FROM arguments a WHERE a.session_id = s.id AND a.deleted_at IS NULL) AS argument_count
FROM sessions s
LEFT JOIN users ui ON ui.wallet_address = s.initiator_address
LEFT JOIN users uc ON uc.wallet_address = s.challenger_address
WHERE s.deleted_at IS NULL
  AND s.status IN ('active', 'voting', 'pending');

-- View for user session history
CREATE OR REPLACE VIEW v_user_session_history AS
SELECT
  s.id AS session_id,
  s.topic,
  s.status,
  s.wager_amount,
  s.winner_address,
  s.created_at,
  s.end_time,
  sp.user_address,
  sp.role,
  CASE
    WHEN s.winner_address = sp.user_address THEN TRUE
    WHEN s.winner_address IS NOT NULL THEN FALSE
    ELSE NULL
  END AS did_win,
  (SELECT COUNT(*) FROM evaluations e WHERE e.session_id = s.id AND e.evaluator_address = sp.user_address) AS evaluations_made
FROM session_participants sp
JOIN sessions s ON s.id = sp.session_id
WHERE s.deleted_at IS NULL;

-- View for achievement progress tracking
CREATE OR REPLACE VIEW v_achievement_progress AS
SELECT
  u.wallet_address,
  u.basename,
  -- Achievement flags
  EXISTS(SELECT 1 FROM achievements a WHERE a.user_address = u.wallet_address AND a.achievement_type = 'first_session') AS has_first_session,
  EXISTS(SELECT 1 FROM achievements a WHERE a.user_address = u.wallet_address AND a.achievement_type = 'first_win') AS has_first_win,
  EXISTS(SELECT 1 FROM achievements a WHERE a.user_address = u.wallet_address AND a.achievement_type = 'first_evaluation') AS has_first_evaluation,
  EXISTS(SELECT 1 FROM achievements a WHERE a.user_address = u.wallet_address AND a.achievement_type = 'ten_sessions') AS has_ten_sessions,
  EXISTS(SELECT 1 FROM achievements a WHERE a.user_address = u.wallet_address AND a.achievement_type = 'fifty_sessions') AS has_fifty_sessions,
  EXISTS(SELECT 1 FROM achievements a WHERE a.user_address = u.wallet_address AND a.achievement_type = 'high_accuracy') AS has_high_accuracy,
  -- Progress metrics
  (SELECT COUNT(*) FROM session_participants sp WHERE sp.user_address = u.wallet_address) AS total_sessions,
  (SELECT COUNT(*) FROM sessions s WHERE s.winner_address = u.wallet_address) AS total_wins,
  (SELECT COUNT(*) FROM evaluations e WHERE e.evaluator_address = u.wallet_address) AS total_evaluations,
  (SELECT COUNT(*) FROM achievements a WHERE a.user_address = u.wallet_address) AS total_achievements
FROM users u
WHERE u.deleted_at IS NULL;

-- View for session evaluation statistics
CREATE OR REPLACE VIEW v_session_evaluation_stats AS
SELECT
  s.id AS session_id,
  s.topic,
  s.status,
  COUNT(e.id) AS total_evaluations,
  COUNT(e.id) FILTER (WHERE e.vote = 'initiator') AS initiator_votes,
  COUNT(e.id) FILTER (WHERE e.vote = 'challenger') AS challenger_votes,
  COUNT(e.id) FILTER (WHERE e.vote = 'tie') AS tie_votes,
  SUM(e.weight) AS total_weight,
  SUM(e.weight) FILTER (WHERE e.vote = 'initiator') AS initiator_weight,
  SUM(e.weight) FILTER (WHERE e.vote = 'challenger') AS challenger_weight,
  SUM(e.weight) FILTER (WHERE e.vote = 'tie') AS tie_weight,
  AVG(e.confidence_score) AS avg_confidence
FROM sessions s
LEFT JOIN evaluations e ON e.session_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.topic, s.status;
