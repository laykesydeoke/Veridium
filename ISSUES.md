# Veridium MVP Issues Tracker

**IMPORTANT**: This file should NOT be committed to GitHub. It's for local development tracking only.

---

## Issue #1: Project Foundation & Monorepo Setup
**Branch**: `feat/project-foundation`
**Labels**: setup, infrastructure
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Setup the complete monorepo structure with all necessary tooling, configuration, and development environment. This includes TypeScript configuration, linting, formatting, and build tools across all packages.

### Tasks
- [ ] Initialize pnpm workspace with monorepo structure
- [ ] Setup root package.json with workspace configuration
- [ ] Create contracts/ directory with Foundry setup
- [ ] Create frontend/ directory with Next.js 14+ setup
- [ ] Create backend/ directory with Fastify setup
- [ ] Configure TypeScript for all packages
- [ ] Setup ESLint and Prettier across workspace
- [ ] Configure Husky for pre-commit hooks
- [ ] Create shared tsconfig base configuration
- [ ] Setup environment variable templates (.env.example)
- [ ] Configure build scripts for all packages
- [ ] Add development scripts (dev, build, test, lint)
- [ ] Setup GitHub Actions workflow structure
- [ ] Configure path aliases for imports
- [ ] Add workspace dependencies management

### Acceptance Criteria
- All packages build successfully
- Linting and formatting work across entire workspace
- Development servers start without errors
- Pre-commit hooks run successfully
- Clear README.md with setup instructions

---

## Issue #2: Smart Contract Foundation
**Branch**: `feat/smart-contracts-foundation`
**Labels**: contracts, blockchain
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Implement the core smart contract architecture using Foundry. Setup base contracts, interfaces, and foundational infrastructure for the Veridium protocol.

### Tasks
- [ ] Initialize Foundry project structure
- [ ] Setup OpenZeppelin contracts dependencies
- [ ] Create base contract interfaces (ISessionFactory, IWagerPool, etc.)
- [ ] Implement SessionFactory.sol with UUPS proxy pattern
- [ ] Create WagerPool.sol for escrow and prize distribution
- [ ] Implement access control using OpenZeppelin
- [ ] Add reentrancy guards on critical functions
- [ ] Create MockUSDC.sol for testing
- [ ] Setup contract deployment scripts
- [ ] Configure Base Sepolia network in foundry.toml
- [ ] Add natspec documentation to all contracts
- [ ] Implement emergency pause functionality
- [ ] Create contract constants and configuration
- [ ] Setup gas optimization patterns
- [ ] Add events for all state changes

### Acceptance Criteria
- All contracts compile without errors
- Foundry tests scaffold created
- Deployment scripts work on local testnet
- Contracts follow security best practices
- Comprehensive natspec documentation

---

## Issue #3: Smart Contract Testing Suite
**Branch**: `feat/contract-tests`
**Labels**: contracts, testing
**Priority**: High
**Estimated Commits**: 15+

### Description
Build comprehensive test suite for all smart contracts using Foundry. Cover all functionality, edge cases, security scenarios, and gas optimization.

### Tasks
- [ ] Create test file structure matching contracts
- [ ] Implement SessionFactory.t.sol with full coverage
- [ ] Implement WagerPool.t.sol with full coverage
- [ ] Test USDC deposit and withdrawal flows
- [ ] Test access control mechanisms
- [ ] Test reentrancy protection
- [ ] Test emergency pause functionality
- [ ] Create fuzzing tests for critical functions
- [ ] Test proxy upgrade mechanisms
- [ ] Add invariant tests for protocol safety
- [ ] Test event emissions
- [ ] Test edge cases and revert scenarios
- [ ] Gas optimization benchmarking tests
- [ ] Create integration test scenarios
- [ ] Setup test coverage reporting

### Acceptance Criteria
- 100% test coverage on critical contracts
- All tests pass successfully
- Gas benchmarks within acceptable limits
- No critical vulnerabilities in tests
- Clear test documentation

---

## Issue #4: AssessmentManager Contract
**Branch**: `feat/assessment-manager`
**Labels**: contracts, evaluation
**Priority**: High
**Estimated Commits**: 15+

### Description
Implement the AssessmentManager smart contract that handles evaluation submission, weighting, result calculation, and evaluator reward distribution.

### Tasks
- [ ] Create AssessmentManager.sol base structure
- [ ] Implement evaluation submission function
- [ ] Add duplicate evaluation prevention
- [ ] Implement weighted scoring algorithm
- [ ] Create result calculation logic
- [ ] Add evaluator reward distribution
- [ ] Implement evaluation period time locks
- [ ] Add evaluation eligibility checks
- [ ] Create events for evaluation tracking
- [ ] Implement dispute mechanism hooks
- [ ] Add gas-efficient storage patterns
- [ ] Create helper view functions
- [ ] Implement batch evaluation processing
- [ ] Add comprehensive natspec documentation
- [ ] Write comprehensive unit tests

### Acceptance Criteria
- Evaluations can be submitted and weighted correctly
- Results calculation is accurate
- Rewards distribute properly
- All tests pass with high coverage
- Gas costs are optimized

---

## Issue #5: CredibilityRegistry & AchievementNFT Contracts
**Branch**: `feat/credibility-achievements`
**Labels**: contracts, reputation
**Priority**: High
**Estimated Commits**: 15+

### Description
Implement CredibilityRegistry for onchain reputation tracking and AchievementNFT (ERC-721) for soulbound achievement badges.

### Tasks
- [ ] Create CredibilityRegistry.sol contract
- [ ] Implement credibility score storage and updates
- [ ] Add credibility calculation functions
- [ ] Create credibility history tracking
- [ ] Implement Basename-based queries
- [ ] Create AchievementNFT.sol (ERC-721)
- [ ] Implement soulbound token logic (non-transferable)
- [ ] Add achievement metadata structure
- [ ] Create IPFS metadata integration
- [ ] Implement batch minting for gas efficiency
- [ ] Add achievement query functions
- [ ] Create achievement unlocking logic
- [ ] Implement events for tracking
- [ ] Write comprehensive tests for both contracts
- [ ] Add natspec documentation

### Acceptance Criteria
- Credibility scores update correctly
- Achievements mint as soulbound NFTs
- Metadata properly stored on IPFS
- All tests pass successfully
- Basename integration works

---

## Issue #6: Frontend Foundation & Design System
**Branch**: `feat/frontend-foundation`
**Labels**: frontend, ui/ux
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Setup Next.js 14+ frontend with App Router, Tailwind CSS, and create the core design system with reusable components.

### Tasks
- [ ] Initialize Next.js 14 with App Router
- [ ] Configure Tailwind CSS with custom theme
- [ ] Setup TypeScript strict mode
- [ ] Create design tokens (colors, spacing, typography)
- [ ] Implement core UI components (Button, Input, Card, etc.)
- [ ] Create layout components (Header, Footer, Sidebar)
- [ ] Setup Zustand for state management
- [ ] Configure React Hook Form + Zod
- [ ] Create loading and error states
- [ ] Implement responsive design patterns
- [ ] Add dark mode support (optional for MVP)
- [ ] Create component documentation with Storybook (optional)
- [ ] Setup SEO configuration
- [ ] Configure fonts and icons
- [ ] Add accessibility features

### Acceptance Criteria
- Next.js app runs without errors
- Design system is consistent and reusable
- Components are responsive and accessible
- State management works correctly
- Forms validate properly

---

## Issue #7: OnchainKit & Wallet Integration
**Branch**: `feat/onchainkit-wallet`
**Labels**: frontend, web3
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Integrate OnchainKit for wallet connection, identity, and transaction components. Setup Smart Wallet with Coinbase Developer Platform.

### Tasks
- [ ] Install and configure OnchainKit SDK
- [ ] Setup Wagmi and Viem for Base
- [ ] Configure Base network (Sepolia + Mainnet)
- [ ] Implement Wallet connection components
- [ ] Add Basename identity display
- [ ] Create wallet dropdown with user info
- [ ] Setup Smart Wallet with passkey auth
- [ ] Configure Paymaster for gasless transactions
- [ ] Implement wallet balance display
- [ ] Add network switching functionality
- [ ] Create transaction status components
- [ ] Setup CDP API credentials
- [ ] Implement wallet session management
- [ ] Add wallet error handling
- [ ] Create wallet connection state management

### Acceptance Criteria
- Users can connect wallets (Smart Wallet + external)
- Basenames display correctly
- Gasless transactions work on testnet
- Network switching functions properly
- All OnchainKit components render correctly

---

## Issue #8: Backend API Foundation
**Branch**: `feat/backend-foundation`
**Labels**: backend, api
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Setup Fastify backend with PostgreSQL database, Redis cache, and core API structure with authentication and middleware.

### Tasks
- [ ] Initialize Fastify server with TypeScript
- [ ] Setup PostgreSQL database connection
- [ ] Configure Redis for caching and sessions
- [ ] Create database schema migrations
- [ ] Implement user authentication middleware
- [ ] Setup CORS and security headers
- [ ] Create error handling middleware
- [ ] Implement request validation with Zod
- [ ] Setup logging with Pino
- [ ] Create database models and repositories
- [ ] Implement connection pooling
- [ ] Add rate limiting middleware
- [ ] Setup environment configuration
- [ ] Create health check endpoints
- [ ] Add API documentation with OpenAPI/Swagger

### Acceptance Criteria
- Server starts and accepts requests
- Database connections work correctly
- Authentication middleware functions
- Error handling is comprehensive
- API documentation is accessible

---

## Issue #9: Database Schema & Migrations
**Branch**: `feat/database-schema`
**Labels**: backend, database
**Priority**: High
**Estimated Commits**: 15+

### Description
Implement complete database schema with all tables, relationships, indexes, and migration system for the Veridium platform.

### Tasks
- [ ] Create users table with indexes
- [ ] Create sessions table with relationships
- [ ] Create arguments table for async sessions
- [ ] Create evaluations table with constraints
- [ ] Create credibility_events table
- [ ] Create achievements table
- [ ] Add foreign key relationships
- [ ] Create database indexes for performance
- [ ] Implement migration system (Drizzle/Prisma/raw SQL)
- [ ] Add database seeding scripts
- [ ] Create enum types for statuses
- [ ] Implement soft delete patterns where needed
- [ ] Add timestamp triggers
- [ ] Create database views for complex queries
- [ ] Write migration rollback scripts

### Acceptance Criteria
- All tables created successfully
- Relationships and constraints work correctly
- Indexes improve query performance
- Migrations run forward and backward
- Seed data loads properly

---

## Issue #10: Basename Identity Service
**Branch**: `feat/basename-service`
**Labels**: backend, identity
**Priority**: High
**Estimated Commits**: 15+

### Description
Create backend service for Basename resolution, user profile management, and integration with onchain identity data.

### Tasks
- [ ] Create BasenameResolver service
- [ ] Implement Basename lookup from onchain data
- [ ] Create user profile CRUD operations
- [ ] Add Basename validation logic
- [ ] Implement profile caching with Redis
- [ ] Create profile update endpoints
- [ ] Add wallet address to Basename mapping
- [ ] Implement profile image/avatar handling
- [ ] Create profile search functionality
- [ ] Add Basename availability checking
- [ ] Implement profile analytics tracking
- [ ] Create profile history tracking
- [ ] Add batch Basename resolution
- [ ] Implement error handling for resolution failures
- [ ] Write comprehensive tests

### Acceptance Criteria
- Basenames resolve correctly
- Profile CRUD operations work
- Caching improves performance
- All tests pass successfully
- Error handling is robust

---

## Issue #11: Session Management System
**Branch**: `feat/session-management`
**Labels**: backend, core-feature
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Implement the core session management system including creation, joining, lifecycle orchestration, and status management.

### Tasks
- [ ] Create SessionOrchestrator service
- [ ] Implement session creation endpoint
- [ ] Add session joining/challenging logic
- [ ] Create session status state machine
- [ ] Implement session lifecycle management
- [ ] Add session validation logic
- [ ] Create session query endpoints
- [ ] Implement session filtering and pagination
- [ ] Add session search functionality
- [ ] Create session cancellation logic
- [ ] Implement forfeit handling
- [ ] Add session expiration checks
- [ ] Create session notification triggers
- [ ] Implement session metadata management
- [ ] Write comprehensive tests

### Acceptance Criteria
- Sessions can be created and joined
- Lifecycle transitions work correctly
- All validation works properly
- Search and filtering function
- Tests cover all scenarios

---

## Issue #12: Blockchain Event Listener Service
**Branch**: `feat/event-listener`
**Labels**: backend, blockchain
**Priority**: High
**Estimated Commits**: 15+

### Description
Create service to listen for smart contract events and synchronize onchain data with the database.

### Tasks
- [ ] Create EventListener service with Viem
- [ ] Implement contract event subscription
- [ ] Add event parsing and validation
- [ ] Create database sync logic for events
- [ ] Implement wager deposit event handling
- [ ] Add evaluation submission event handling
- [ ] Handle result finalization events
- [ ] Implement achievement minting event sync
- [ ] Add event replay for missed events
- [ ] Create event processing queue
- [ ] Implement error handling and retries
- [ ] Add event logging and monitoring
- [ ] Create checkpoint system for event tracking
- [ ] Implement multi-contract event listening
- [ ] Write comprehensive tests

### Acceptance Criteria
- Events are captured in real-time
- Database stays in sync with blockchain
- Missed events are replayed correctly
- Error handling prevents data loss
- Tests verify all event types

---

## Issue #13: Evaluation & Scoring System
**Branch**: `feat/evaluation-scoring`
**Labels**: backend, core-feature
**Priority**: High
**Estimated Commits**: 15+

### Description
Implement the evaluation submission system, weighted scoring calculation, and result determination logic.

### Tasks
- [ ] Create AssessmentAggregator service
- [ ] Implement evaluation submission endpoint
- [ ] Add evaluation eligibility validation
- [ ] Create weighted scoring algorithm
- [ ] Implement OutcomeCalculator service
- [ ] Add tie-breaking logic
- [ ] Create evaluator reward calculation
- [ ] Implement evaluation period management
- [ ] Add evaluation analytics tracking
- [ ] Create evaluation history endpoints
- [ ] Implement evaluation spam prevention
- [ ] Add evaluation quality scoring
- [ ] Create leaderboard calculation
- [ ] Implement consensus detection
- [ ] Write comprehensive tests

### Acceptance Criteria
- Evaluations submit successfully
- Scoring weights applied correctly
- Results calculated accurately
- Rewards distributed properly
- Tests cover all scenarios

---

## Issue #14: Credibility System Implementation
**Branch**: `feat/credibility-system`
**Labels**: backend, reputation
**Priority**: High
**Estimated Commits**: 15+

### Description
Implement the credibility scoring system for both participants and evaluators with onchain sync.

### Tasks
- [ ] Create ScoreCalculator service
- [ ] Implement participant credibility algorithm
- [ ] Add evaluator credibility algorithm
- [ ] Create credibility update triggers
- [ ] Implement credibility event logging
- [ ] Add credibility decay/boost logic
- [ ] Create credibility history tracking
- [ ] Implement credibility analytics
- [ ] Add credibility milestones
- [ ] Create credibility leaderboards
- [ ] Implement onchain sync for scores
- [ ] Add credibility visualization data
- [ ] Create credibility export functions
- [ ] Implement credibility dispute handling
- [ ] Write comprehensive tests

### Acceptance Criteria
- Credibility scores calculate correctly
- Updates sync to blockchain
- History tracking works properly
- Leaderboards display accurately
- Tests cover all formulas

---

## Issue #15: IPFS Integration & Content Storage
**Branch**: `feat/ipfs-storage`
**Labels**: backend, storage
**Priority**: High
**Estimated Commits**: 15+

### Description
Integrate IPFS for storing session arguments, achievement metadata, and other content with pinning service.

### Tasks
- [ ] Setup Pinata or Web3.Storage SDK
- [ ] Create IPFS upload service
- [ ] Implement argument content upload
- [ ] Add achievement metadata upload
- [ ] Create IPFS retrieval functions
- [ ] Implement content validation before upload
- [ ] Add content encryption (if needed)
- [ ] Create pinning status tracking
- [ ] Implement batch upload optimization
- [ ] Add IPFS gateway configuration
- [ ] Create content versioning
- [ ] Implement cache for frequently accessed content
- [ ] Add error handling for upload failures
- [ ] Create content deletion/unpinning logic
- [ ] Write comprehensive tests

### Acceptance Criteria
- Content uploads to IPFS successfully
- Retrieval works consistently
- Metadata properly formatted
- Pinning service maintains content
- Tests cover all operations

---

## Issue #16: WebSocket Real-time Service
**Branch**: `feat/websocket-realtime`
**Labels**: backend, real-time
**Priority**: Medium
**Estimated Commits**: 15+

### Description
Implement WebSocket server with Socket.io for real-time session updates, notifications, and live features.

### Tasks
- [ ] Setup Socket.io server with Fastify
- [ ] Create WebSocket authentication
- [ ] Implement room-based connections
- [ ] Add session event broadcasting
- [ ] Create evaluation update broadcasts
- [ ] Implement user notification system
- [ ] Add presence tracking (online users)
- [ ] Create typing indicators (for live sessions)
- [ ] Implement reconnection handling
- [ ] Add message queuing for offline users
- [ ] Create rate limiting for WebSocket events
- [ ] Implement event acknowledgment system
- [ ] Add WebSocket error handling
- [ ] Create monitoring for WebSocket connections
- [ ] Write comprehensive tests

### Acceptance Criteria
- WebSocket connections establish successfully
- Real-time updates broadcast correctly
- Reconnection works seamlessly
- Rate limiting prevents abuse
- Tests verify all event types

---

## Issue #17: Session UI Components
**Branch**: `feat/session-ui`
**Labels**: frontend, components
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Create all session-related UI components including cards, rooms, argument threads, evaluation panels, and timers.

### Tasks
- [ ] Create SessionCard component for list view
- [ ] Implement SessionRoom for live sessions
- [ ] Build ArgumentThread for async sessions
- [ ] Create TimerDisplay with countdown
- [ ] Implement EvaluationPanel with scoring
- [ ] Add SessionDetails page
- [ ] Create SessionList with filters
- [ ] Build SessionCreation form
- [ ] Implement SessionJoin flow
- [ ] Add real-time session updates
- [ ] Create session status indicators
- [ ] Implement participant avatars and info
- [ ] Add session sharing functionality
- [ ] Create session bookmarking
- [ ] Write component tests

### Acceptance Criteria
- All components render correctly
- Real-time updates display properly
- Forms validate and submit correctly
- Components are responsive
- Tests cover all interactions

---

## Issue #18: Wager & Transaction Components
**Branch**: `feat/wager-transactions`
**Labels**: frontend, web3
**Priority**: Critical
**Estimated Commits**: 15+

### Description
Implement OnchainKit transaction components for wagering, evaluation submission, prize claiming, and USDC purchases.

### Tasks
- [ ] Create WagerButton transaction component
- [ ] Implement EvaluateButton with scoring
- [ ] Build ClaimButton for prize withdrawal
- [ ] Add FundSession checkout component
- [ ] Create transaction status displays
- [ ] Implement transaction error handling
- [ ] Add USDC approval flow
- [ ] Create transaction confirmation modals
- [ ] Implement gas estimation display
- [ ] Add transaction history tracking
- [ ] Create pending transaction indicators
- [ ] Implement transaction success/failure toasts
- [ ] Add multi-step transaction flows
- [ ] Create transaction receipt display
- [ ] Write component tests

### Acceptance Criteria
- All transactions submit successfully
- Error handling works properly
- UI updates reflect transaction status
- Gas estimates are accurate
- Tests cover all transaction types

---

## Issue #19: User Profile & Dashboard
**Branch**: `feat/user-dashboard`
**Labels**: frontend, ui/ux
**Priority**: High
**Estimated Commits**: 15+

### Description
Create user profile pages, dashboard with stats, session history, achievements display, and credibility visualization.

### Tasks
- [ ] Create ProfileCard component
- [ ] Build user dashboard page
- [ ] Implement CredibilityDisplay with visualization
- [ ] Create AchievementCollection gallery
- [ ] Add session history list
- [ ] Build statistics cards (wins, losses, earnings)
- [ ] Create credibility score chart
- [ ] Implement profile editing functionality
- [ ] Add session filtering on profile
- [ ] Create achievement progress tracking
- [ ] Build earnings summary
- [ ] Implement profile sharing
- [ ] Add follow/unfollow functionality (future)
- [ ] Create profile SEO optimization
- [ ] Write component tests

### Acceptance Criteria
- Profile displays all user data correctly
- Statistics calculate accurately
- Achievements render properly
- Profile is responsive and accessible
- Tests cover all features

---

## Issue #20: AI Integration with AgentKit
**Branch**: `feat/agentkit-integration`
**Labels**: backend, ai, Phase-2
**Priority**: Medium
**Estimated Commits**: 15+

### Description
Integrate AgentKit for AI Evaluator, Coach, and Moderation agents. This is Phase 2 but laying foundation in MVP.

### Tasks
- [ ] Setup AgentKit SDK and credentials
- [ ] Create AgentService base class
- [ ] Implement AI Evaluator agent structure
- [ ] Add evaluation prompt engineering
- [ ] Create AI Coach agent structure
- [ ] Implement coaching session logic
- [ ] Build AI Moderation agent
- [ ] Add content moderation logic
- [ ] Create agent wallet management
- [ ] Implement agent transaction signing
- [ ] Add agent response parsing
- [ ] Create agent error handling
- [ ] Implement agent rate limiting
- [ ] Add agent analytics tracking
- [ ] Write comprehensive tests

### Acceptance Criteria
- AgentKit initialized successfully
- AI agents can be invoked
- Responses are properly formatted
- Wallet transactions work
- Tests verify agent functionality

---

## Summary Statistics

**Total Issues**: 20
**Total Estimated Commits**: 300+ (15+ per issue)
**Commit Message Max Length**: 50 characters
**Files to NOT Commit**: All .md files except README.md

## Workflow

1. **For each issue**:
   - Create new branch from main
   - Make 15+ commits (max 50 chars each)
   - Push branch to GitHub
   - User creates Pull Request manually
   - User merges PR
   - Move to next issue

2. **Commit Message Guidelines**:
   - Max 50 characters
   - Use imperative mood
   - Be specific and descriptive
   - Examples:
     - "Add pnpm workspace configuration"
     - "Create SessionFactory contract base"
     - "Implement weighted scoring algorithm"
     - "Add WebSocket event broadcasting"

3. **Files to Exclude from Commits**:
   - PRD.md (local only)
   - ISSUES.md (this file - local only)
   - PROGRESS.md (local only)
   - Any other .md files except README.md

---

**Ready to start with Issue #1!**
