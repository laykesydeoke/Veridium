# Veridium Backend

Backend API for Veridium, a blockchain-powered discourse platform on Base L2.

## Features

- **RESTful API** with Fastify
- **PostgreSQL** database with connection pooling
- **Redis** caching and session management
- **JWT** authentication with wallet signature verification
- **Basename** identity resolution (Base L2 naming service)
- **Real-time event listening** for blockchain events
- **Session orchestration** with state machine
- **Credibility tracking** and leaderboards
- **Achievement NFT** integration
- **Rate limiting** and security middleware

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify 5.x
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Blockchain**: Viem 2.x (Base L2)
- **Validation**: Zod
- **Authentication**: JWT with EIP-191 signatures

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (env, database, redis)
│   ├── contracts/       # Smart contract ABIs
│   ├── db/
│   │   ├── migrations/  # SQL migration files
│   │   └── seed/        # Seed data
│   ├── middleware/      # Auth, error handling, validation
│   ├── models/          # Database models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   │   ├── basename.ts          # ENS/Basename resolution
│   │   ├── eventListener.ts     # Blockchain event processing
│   │   ├── eventQueue.ts        # Event queue system
│   │   ├── eventWatcher.ts      # Real-time event watching
│   │   ├── eventCron.ts         # Event maintenance jobs
│   │   ├── profile.ts           # User profile management
│   │   ├── sessionOrchestrator.ts  # Session lifecycle
│   │   └── sessionCron.ts       # Session maintenance
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper utilities
│   ├── index.ts         # Application entry point
│   └── server.ts        # Fastify server setup
├── EVENT_LISTENER.md    # Event listener documentation
├── EVALUATION_SYSTEM.md # Evaluation & scoring system documentation
├── DATABASE.md          # Database schema documentation
├── BASENAME_SERVICE.md  # Basename service documentation
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Required variables in `.env`:

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/veridium
REDIS_URL=redis://localhost:6379

# Blockchain
BASE_RPC_URL=https://sepolia.base.org
CHAIN_ID=84532  # Base Sepolia (use 8453 for mainnet)

# Contract Addresses (set after deployment)
SESSION_FACTORY_ADDRESS=
ACHIEVEMENT_NFT_ADDRESS=
CREDIBILITY_TRACKER_ADDRESS=

# Security
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:3000
```

### Database Setup

```bash
# Run migrations
psql $DATABASE_URL < src/db/migrations/001_initial_schema.sql
psql $DATABASE_URL < src/db/migrations/002_complete_schema.sql
psql $DATABASE_URL < src/db/migrations/003_views.sql
psql $DATABASE_URL < src/db/migrations/004_event_tracking.sql

# Optional: Load seed data
psql $DATABASE_URL < src/db/seed/001_sample_data.sql
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run type checking
pnpm type-check

# Lint code
pnpm lint
```

## API Documentation

Once the server is running, access the interactive API docs:

- Swagger UI: http://localhost:3001/docs

## Key Features

### Authentication

Wallet-based authentication using EIP-191 signatures:

1. Request challenge: `POST /api/auth/challenge`
2. Sign challenge with wallet
3. Login: `POST /api/auth/login` with signature
4. Receive JWT token
5. Use token in `Authorization: Bearer <token>` header

### Basename Integration

Resolve Base L2 names (like ENS):

```typescript
// Resolve basename to address
GET /api/basename/resolve/:basename

// Reverse resolve address to basename
GET /api/basename/reverse/:address

// Get user profile by basename
GET /api/profiles/basename/:basename
```

### Session Management

Full lifecycle management with state machine:

- **States**: pending → active → voting → completed/cancelled
- **Validation**: Automatic validation of state transitions
- **Notifications**: Redis-based notification queue
- **Auto-expiry**: Cron job checks and completes expired sessions

### Blockchain Event Listener

Real-time synchronization with smart contracts:

- **Event Detection**: Polls for new blocks and events
- **Queue System**: Asynchronous processing with retry
- **Checkpoints**: Tracks last processed block per contract
- **Error Handling**: Logs errors and supports manual retry
- **Monitoring**: Health checks and statistics

See [EVENT_LISTENER.md](./EVENT_LISTENER.md) for details.

### Evaluation & Scoring System

Weighted voting with credibility-based scoring:

- **Weighted Scoring**: Multi-factor algorithm (credibility, confidence, timing, quality)
- **Outcome Calculation**: Determines winners with tie-breaking logic
- **Spam Prevention**: Advanced detection and filtering
- **Analytics**: Performance tracking and insights
- **Auto-Finalization**: Automatic result calculation when voting ends

See [EVALUATION_SYSTEM.md](./EVALUATION_SYSTEM.md) for details.

### Credibility System

Track user credibility based on:
- Evaluation accuracy
- Session participation
- Achievement unlocks
- Voting patterns

## API Endpoints

### Health
- `GET /health` - Health check

### Auth
- `POST /api/auth/challenge` - Get signature challenge
- `POST /api/auth/login` - Login with signature
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Sessions
- `GET /api/sessions` - List sessions (with filters)
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create session
- `POST /api/sessions/:id/join` - Join as challenger
- `POST /api/sessions/:id/start-voting` - Start voting
- `POST /api/sessions/:id/cancel` - Cancel session
- `POST /api/sessions/:id/forfeit` - Forfeit session

### Events
- `GET /api/events/queue/stats` - Queue statistics
- `GET /api/events/watcher/status` - Watcher status
- `GET /api/events/health` - Processing health
- `GET /api/events/logs` - Recent event logs
- `POST /api/events/replay` - Replay missed events (admin)

### Evaluations
- `POST /api/evaluations` - Submit evaluation
- `GET /api/evaluations/session/:sessionId` - Get session evaluations
- `GET /api/evaluations/user/:address` - Get user's evaluations
- `GET /api/evaluations/assessment/:sessionId` - Aggregated assessment
- `GET /api/evaluations/metrics/:sessionId` - Quality metrics
- `GET /api/evaluations/progress/:sessionId` - Real-time progress
- `GET /api/evaluations/outcome/:sessionId` - Outcome prediction
- `GET /api/evaluations/eligibility/:sessionId` - Check eligibility
- `POST /api/evaluations/finalize/:sessionId` - Finalize results (admin)

### Profiles
- `GET /api/profiles/:address` - Get user profile
- `PUT /api/profiles` - Update profile
- `GET /api/profiles/search` - Search profiles

### Leaderboard
- `GET /api/leaderboard` - Get credibility rankings

### Achievements
- `GET /api/achievements/:address` - Get user achievements

## Background Jobs

### Session Expiration Cron
- Runs every 5 minutes
- Checks for expired voting sessions
- Auto-completes sessions past voting deadline

### Event Queue Worker
- Runs every 5 seconds
- Processes queued blockchain events
- Handles retries with exponential backoff

### Event Maintenance Cron
- Runs every 10 minutes
- Resets stuck events (>5min in processing)
- Checks for high error rates
- Auto-purges old completed events (every 6 hours)

## Database Schema

See [DATABASE.md](./DATABASE.md) for complete schema documentation.

Key tables:
- `users` - User accounts and profiles
- `sessions` - Discourse sessions
- `evaluations` - User votes on sessions
- `achievements` - NFT achievements
- `credibility_events` - Credibility score changes
- `event_logs` - Processed blockchain events
- `event_queue` - Event processing queue

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/services/__tests__/sessionOrchestrator.test.ts
```

## Production Deployment

### Build

```bash
pnpm build
```

### Environment

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET` (32+ chars)
- Configure production database
- Set actual contract addresses
- Enable HTTPS/TLS
- Configure CORS properly

### Database

- Run all migrations in order
- Set up connection pooling
- Configure backups
- Monitor query performance

### Monitoring

- Event processing health: `GET /api/events/health`
- Queue stats: `GET /api/events/queue/stats`
- Error summary: `GET /api/events/errors/summary`
- Application logs via Pino logger

## Security

- Helmet.js for security headers
- Rate limiting (100 req/min)
- JWT authentication
- Wallet signature verification (EIP-191)
- SQL injection protection (parameterized queries)
- CORS configuration
- Input validation with Zod

## License

MIT

## Support

For issues and questions:
- Check documentation in `/backend/*.md` files
- Review API docs at `/docs` endpoint
- Check event listener guide in `EVENT_LISTENER.md`
