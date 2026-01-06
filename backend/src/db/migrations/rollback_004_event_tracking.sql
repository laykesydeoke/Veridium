-- Rollback script for event tracking migration

-- Drop views
DROP VIEW IF EXISTS v_event_error_summary;
DROP VIEW IF EXISTS v_event_processing_health;

-- Drop tables
DROP TABLE IF EXISTS event_queue;
DROP TABLE IF EXISTS event_errors;
DROP TABLE IF EXISTS event_logs;
DROP TABLE IF EXISTS event_checkpoints;
