# Session Management System

## Overview
Comprehensive session lifecycle management for Veridium debate sessions, including creation, joining, voting, completion, and cancellation.

## Status State Machine

```
pending → active → voting → completed
   ↓         ↓        ↓
cancelled cancelled cancelled
```

### Valid Transitions
- **pending**: → active, cancelled
- **active**: → voting, cancelled
- **voting**: → completed, cancelled
- **completed**: (final state)
- **cancelled**: (final state)

## API Endpoints

### GET /api/sessions
Get sessions with filtering and pagination.

**Query Parameters:**
- `status`: Filter by status
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset
- `initiator`: Filter by initiator address
- `challenger`: Filter by challenger address

### GET /api/sessions/search?q=query
Search sessions by topic or description.

### GET /api/sessions/:id
Get session details by ID.

### POST /api/sessions
Create a new session (authenticated).

**Request:**
```json
{
  "sessionAddress": "0x...",
  "topic": "Should AI be regulated?",
  "description": "A debate on AI regulation",
  "initiatorAddress": "0x...",
  "wagerAmount": "1000000000000000000",
  "metadata": {}
}
```

### POST /api/sessions/:id/join
Join session as challenger (authenticated).

**Request:**
```json
{
  "challengerAddress": "0x...",
  "transactionHash": "0x..."
}
```

### POST /api/sessions/:id/start-voting
Start voting phase (authenticated).

**Request:**
```json
{
  "votingDurationHours": 24
}
```

### POST /api/sessions/:id/cancel
Cancel session (authenticated, initiator only).

**Request:**
```json
{
  "reason": "Cancellation reason"
}
```

### POST /api/sessions/:id/forfeit
Forfeit session (authenticated, participants only).

### GET /api/sessions/user/:address
Get user's sessions.

## Services

### SessionOrchestrator
Core service for session lifecycle management.

**Methods:**
- `createSession(data)`: Create new session
- `joinSession(sessionId, data)`: Join as challenger
- `startVoting(sessionId, duration)`: Transition to voting
- `completeSession(sessionId, winner?)`: Complete session
- `cancelSession(sessionId, reason?)`: Cancel session
- `forfeitSession(sessionId, address)`: Forfeit session
- `checkExpiredSessions()`: Check and expire voting sessions
- `canTransition(from, to)`: Validate state transitions

### SessionValidator
Validation logic for session operations.

**Methods:**
- `validateSessionCreation(data)`: Validate creation data
- `validateSessionJoin(sessionId, address)`: Validate join request
- `validateVotingStart(sessionId)`: Validate voting start
- `validateMetadata(metadata)`: Validate metadata format

### SessionNotifier
Notification management for session events.

**Methods:**
- `notifySessionCreated(sessionId, initiator)`: Notify session creation
- `notifySessionJoined(sessionId, initiator, challenger)`: Notify join
- `notifyVotingStarted(sessionId)`: Notify voting phase
- `notifySessionCompleted(sessionId, winner?)`: Notify completion
- `notifySessionCancelled(sessionId, reason?)`: Notify cancellation
- `getUserNotifications(address, limit?)`: Get user notifications
- `clearUserNotifications(address)`: Clear notifications

### SessionCron
Background job for session management.

**Methods:**
- `startExpirationCron()`: Start periodic expiration checks (5 min intervals)
- `runExpirationCheck()`: Check and expire sessions
- `stopCron(interval)`: Stop cron job

## Validation Rules

### Session Creation
- Topic: 10-500 characters
- Description: 0-2000 characters
- Wager: Non-negative BigInt
- Max 5 pending sessions per user

### Session Join
- Session must be in `pending` status
- No existing challenger
- Cannot join own session
- User cannot be in another active session

### Voting Start
- Session must be `active`
- Must have challenger
- Minimum 30 minutes session duration

## Metadata Management

Session metadata is stored as JSONB and can include:
- Custom tags
- External references
- Cancellation reasons
- Forfeit information
- Any additional context

Max metadata size: 10KB

## Notifications

Notifications are queued in Redis and stored for 24 hours.

**Notification Types:**
- `session_created`
- `session_joined`
- `voting_started`
- `session_completed`
- `session_cancelled`
- `session_forfeited`

## Expiration Handling

Sessions in `voting` status are automatically checked every 5 minutes:
1. If `voting_end_time` has passed
2. Calculate winner from vote weights
3. Complete session with winner
4. Notify all participants

## Helper Utilities

### SessionHelpers
- `calculateDuration()`: Calculate session duration
- `formatDuration()`: Human-readable duration
- `isExpired()`: Check expiration
- `getTimeRemaining()`: Time until voting ends
- `calculateWinProbability()`: Win probability calculation

## Usage Example

```typescript
// Create session
const session = await SessionOrchestrator.createSession({
  sessionAddress: '0x...',
  topic: 'Is blockchain the future?',
  description: 'Debate on blockchain adoption',
  initiatorAddress: '0x...',
  wagerAmount: '1000000000000000000',
});

// Join session
await SessionOrchestrator.joinSession(session.id, {
  challengerAddress: '0x...',
});

// Start voting after debate
await SessionOrchestrator.startVoting(session.id, 24);

// System automatically completes after 24 hours
// Or manually forfeit
await SessionOrchestrator.forfeitSession(session.id, '0x...');
```
