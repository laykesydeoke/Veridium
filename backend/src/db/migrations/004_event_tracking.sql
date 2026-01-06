-- Event tracking tables for blockchain event listener
-- This migration creates tables for tracking processed events and checkpoints

-- Event checkpoints table to track last processed block per contract
CREATE TABLE IF NOT EXISTS event_checkpoints (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL UNIQUE,
  last_processed_block VARCHAR(100) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for contract address lookups
CREATE INDEX idx_event_checkpoints_contract ON event_checkpoints(contract_address);

-- Event logs table to track successfully processed events
CREATE TABLE IF NOT EXISTS event_logs (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  block_number VARCHAR(100) NOT NULL,
  log_index INTEGER NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure we don't process the same event twice
  UNIQUE(transaction_hash, log_index)
);

-- Indexes for event logs
CREATE INDEX idx_event_logs_contract ON event_logs(contract_address);
CREATE INDEX idx_event_logs_event_name ON event_logs(event_name);
CREATE INDEX idx_event_logs_tx_hash ON event_logs(transaction_hash);
CREATE INDEX idx_event_logs_block ON event_logs(block_number);
CREATE INDEX idx_event_logs_processed_at ON event_logs(processed_at DESC);

-- Event errors table to track failed event processing
CREATE TABLE IF NOT EXISTS event_errors (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  block_number VARCHAR(100) NOT NULL,
  log_index INTEGER NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for event errors
CREATE INDEX idx_event_errors_contract ON event_errors(contract_address);
CREATE INDEX idx_event_errors_event_name ON event_errors(event_name);
CREATE INDEX idx_event_errors_tx_hash ON event_errors(transaction_hash);
CREATE INDEX idx_event_errors_unresolved ON event_errors(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_event_errors_created_at ON event_errors(created_at DESC);

-- Event processing queue table
CREATE TABLE IF NOT EXISTS event_queue (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for event queue
CREATE INDEX idx_event_queue_status ON event_queue(status);
CREATE INDEX idx_event_queue_priority ON event_queue(priority DESC, created_at ASC);
CREATE INDEX idx_event_queue_scheduled ON event_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_event_queue_contract ON event_queue(contract_address);

-- View for monitoring event processing health
CREATE OR REPLACE VIEW v_event_processing_health AS
SELECT
  el.contract_address,
  COUNT(DISTINCT el.event_name) as unique_events,
  COUNT(*) as total_processed,
  MAX(el.processed_at) as last_processed_at,
  (
    SELECT COUNT(*)
    FROM event_errors ee
    WHERE ee.contract_address = el.contract_address
      AND ee.resolved_at IS NULL
  ) as unresolved_errors,
  (
    SELECT last_processed_block
    FROM event_checkpoints ec
    WHERE ec.contract_address = el.contract_address
  ) as current_checkpoint
FROM event_logs el
GROUP BY el.contract_address;

-- View for event error analysis
CREATE OR REPLACE VIEW v_event_error_summary AS
SELECT
  event_name,
  contract_address,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved_count,
  AVG(retry_count) as avg_retry_count,
  MAX(created_at) as last_error_at,
  array_agg(DISTINCT substring(error_message, 1, 100)) as error_samples
FROM event_errors
GROUP BY event_name, contract_address
ORDER BY total_errors DESC;

-- Comments for documentation
COMMENT ON TABLE event_checkpoints IS 'Tracks the last processed block number for each contract to enable resumable event listening';
COMMENT ON TABLE event_logs IS 'Records all successfully processed blockchain events to prevent duplicate processing';
COMMENT ON TABLE event_errors IS 'Logs failed event processing attempts for debugging and retry mechanisms';
COMMENT ON TABLE event_queue IS 'Queue for asynchronous event processing with priority and retry support';
COMMENT ON VIEW v_event_processing_health IS 'Monitoring view showing event processing status per contract';
COMMENT ON VIEW v_event_error_summary IS 'Analysis view for event processing errors grouped by event type';
