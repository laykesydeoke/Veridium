# Blockchain Event Listener Service

The event listener system provides real-time synchronization between smart contracts on Base L2 and the Veridium backend database.

## Architecture

### Components

1. **EventListener** (`services/eventListener.ts`)
   - Core event processing logic
   - Handles individual event types
   - Manages event checkpoints
   - Prevents duplicate processing

2. **EventQueue** (`services/eventQueue.ts`)
   - Asynchronous event processing queue
   - Retry mechanism with exponential backoff
   - Failed event tracking and recovery
   - Queue statistics and monitoring

3. **EventWatcher** (`services/eventWatcher.ts`)
   - Real-time blockchain event listening
   - Multi-contract support
   - Automatic checkpoint management
   - Block polling and event detection

4. **EventCron** (`services/eventCron.ts`)
   - Maintenance tasks
   - Stuck event recovery
   - Auto-purge old events
   - Error rate monitoring

### Database Tables

#### event_checkpoints
Tracks the last processed block for each contract to enable resumable listening.

```sql
contract_address | last_processed_block | last_updated
```

#### event_logs
Records successfully processed events to prevent duplicates.

```sql
transaction_hash | log_index | event_name | contract_address | processed_at
```

#### event_errors
Logs failed event processing attempts for debugging and retry.

```sql
transaction_hash | event_name | error_message | retry_count | resolved_at
```

#### event_queue
Asynchronous processing queue with priority and retry support.

```sql
event_name | event_data | status | priority | retry_count | scheduled_for
```

## Supported Events

### Session Factory
- **SessionCreated**: New session created
  - Syncs: sessions table, session_participants

### Session Contract
- **ChallengerJoined**: Challenger joins session
  - Syncs: sessions.status = 'active', session_participants

- **VotingStarted**: Voting phase begins
  - Syncs: sessions.status = 'voting', voting_end_time

- **EvaluationSubmitted**: Evaluator submits vote
  - Syncs: evaluations, session_participants

- **ResultFinalized**: Session completes with winner
  - Syncs: sessions.status = 'completed', winner_address, vote counts

- **WagerDeposited**: Wager payment received
  - Syncs: credibility_events

- **SessionCancelled**: Session cancelled
  - Syncs: sessions.status = 'cancelled', metadata

### Achievement NFT
- **AchievementMinted**: NFT achievement awarded
  - Syncs: achievements table

### Credibility Tracker
- **CredibilityUpdated**: User credibility score changed
  - Syncs: credibility_events

## Event Flow

```
Blockchain Event
    ↓
EventWatcher detects new block
    ↓
Fetch logs for watched contracts
    ↓
Enqueue events in EventQueue
    ↓
EventQueue worker processes event
    ↓
EventListener.process{EventType}()
    ↓
Update database tables
    ↓
Log to event_logs or event_errors
    ↓
Update checkpoint
```

## API Endpoints

### Queue Management

**GET /api/events/queue/stats**
```json
{
  "pending": 5,
  "processing": 2,
  "completed": 1234,
  "failed": 3
}
```

**GET /api/events/queue/failed**
Get failed events for manual review

**POST /api/events/queue/retry/:id**
Retry a failed event (admin only)

**POST /api/events/queue/purge**
Purge completed events (admin only)

### Watcher Management

**GET /api/events/watcher/status**
```json
{
  "watchedCount": 3,
  "contracts": [
    {
      "address": "0x...",
      "events": ["SessionCreated", "EvaluationSubmitted"]
    }
  ]
}
```

**GET /api/events/watcher/health**
Health check with current block and latency

**POST /api/events/watcher/watch**
Start watching a contract (admin only)

**POST /api/events/watcher/unwatch**
Stop watching a contract (admin only)

**POST /api/events/replay**
Replay missed events from a specific block (admin only)

### Monitoring

**GET /api/events/health**
Processing health view per contract

**GET /api/events/errors/summary**
Error summary grouped by event type

**GET /api/events/logs**
Recent processed events with filtering

**GET /api/events/checkpoint/:contractAddress**
Get checkpoint for specific contract

**GET /api/events/stats**
Overall event processing statistics

## Configuration

### Environment Variables

Required in `.env`:

```bash
# Contract Addresses
SESSION_FACTORY_ADDRESS=0x...
ACHIEVEMENT_NFT_ADDRESS=0x...
CREDIBILITY_TRACKER_ADDRESS=0x...

# Already configured
BASE_RPC_URL=https://...
CHAIN_ID=8453  # Base mainnet (or 84532 for Sepolia)
```

## Usage

### Starting the Event Listener

The event listener automatically starts with the main server:

```typescript
// In src/index.ts
import { EventWatcher } from './services/eventWatcher';
import { EventQueue } from './services/eventQueue';
import { EventCron } from './services/eventCron';

// Initialize watchers
await EventWatcher.initialize();

// Start queue worker
EventQueue.startWorker();

// Start maintenance cron
EventCron.startMaintenanceCron();
```

### Manually Replay Events

If events were missed due to downtime:

```bash
curl -X POST http://localhost:3000/api/events/replay \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "0x...",
    "fromBlock": "12345678"
  }'
```

### Monitor Event Processing

```bash
# Get queue stats
curl http://localhost:3000/api/events/queue/stats

# Get processing health
curl http://localhost:3000/api/events/health

# Get failed events
curl http://localhost:3000/api/events/queue/failed

# Get error summary
curl http://localhost:3000/api/events/errors/summary
```

## Error Handling

### Automatic Retry
- Failed events are automatically retried with exponential backoff
- Default: 3 retries (configurable per event)
- Backoff: 1min, 2min, 4min, 8min...

### Stuck Event Recovery
- EventCron checks for stuck events every 10 minutes
- Events stuck in "processing" for >5 minutes are reset to "pending"

### Manual Intervention
1. View failed events: `GET /api/events/queue/failed`
2. Review error details
3. Fix underlying issue
4. Retry: `POST /api/events/queue/retry/:id`

## Database Views

### v_event_processing_health
Shows processing status per contract:
- Total events processed
- Unique event types
- Last processed timestamp
- Unresolved error count
- Current checkpoint

### v_event_error_summary
Error analysis by event type:
- Total errors
- Unresolved count
- Average retry count
- Last error timestamp
- Error message samples

## Performance

### Optimizations
- Checkpoint system prevents re-processing old blocks
- Duplicate detection via event_logs unique constraint
- Queue worker processes events asynchronously
- Batch block processing (1000 blocks per batch)
- Redis caching for checkpoint reads

### Monitoring
- Track queue size: `GET /api/events/queue/stats`
- Monitor latency: `GET /api/events/watcher/health`
- Check error rate: `GET /api/events/errors/summary`
- View throughput: `GET /api/events/stats`

## Deployment Checklist

- [ ] Set contract addresses in environment variables
- [ ] Run database migration: `004_event_tracking.sql`
- [ ] Verify RPC endpoint connectivity
- [ ] Configure contract ABIs to match deployed contracts
- [ ] Test event replay for historical data
- [ ] Set up monitoring alerts for error rates
- [ ] Configure auto-purge schedule (default: 7 days)
- [ ] Verify authentication for admin endpoints

## Troubleshooting

### Events not being detected
1. Check EventWatcher status: `GET /api/events/watcher/status`
2. Verify contract addresses in env config
3. Check RPC connectivity: `GET /api/events/watcher/health`
4. Review event signatures in `contracts/abis.ts`

### Events failing to process
1. Check error logs: `GET /api/events/errors/summary`
2. Review database constraints (sessions, users tables)
3. Verify event data format matches processor expectations
4. Check for missing foreign key relationships

### High error rate
1. EventCron logs warnings when >5 errors/hour for an event
2. Review error messages in event_errors table
3. Check for contract ABI mismatches
4. Verify database schema is up to date

### Checkpoint issues
1. View checkpoints: `GET /api/events/checkpoints`
2. Manually update if needed via database
3. Use replay to reprocess from specific block
4. Check for RPC rate limiting issues
