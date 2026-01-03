# Product Requirements Document: Veridium

## **Product Vision**

### Mission Statement
Veridium is a decentralized discourse platform where truth is refined through structured argumentation. Participants wager USDC on their convictions, engage in evidence-based discourse, and allow the community to determine validity through transparent evaluation mechanisms. The platform transforms intellectual debate into an engaging prediction market while incentivizing rigorous reasoning.

### Core Propositions
- **For Discourse Participants**: Monetize intellectual rigor and persuasive reasoning; establish verifiable onchain credibility
- **For Evaluators**: Engage with substantive discourse; receive rewards for quality curation
- **For Observers**: Access refined arguments on critical topics; explore multiple evidence-based perspectives
- **For Base Ecosystem**: Demonstrate consumer-accessible dApp with genuine utility; accelerate Smart Wallet adoption

---

## **Core Capabilities & Specifications**

### **1. Discourse Session Creation & Orchestration**

#### 1.1 Session Formats
- **Binary Propositions**: Two opposing stances (e.g., "ETH will flip BTC by 2027: Affirm vs Deny")
- **Multi-Perspective Sessions**: 3-4 distinct viewpoints on nuanced topics
- **Synchronous Sessions**: Real-time exchanges with immediate responses (15-60 min duration)
- **Asynchronous Sessions**: Extended discourse with 24-48hr response windows
- **Elimination Tournaments**: Bracket-style competitive progression

#### 1.2 Topic Domains
- Blockchain & Protocol Analysis
- Emerging Technology & AI Ethics
- Governance & Public Policy
- Market Economics & Finance
- Social Dynamics
- Culture & Philosophy
- DAO Operations & Protocol Governance
- Open Submission (community-proposed)

#### 1.3 Session Configuration Requirements
- Proposition statement (precise, verifiable, contestable)
- Format selection (sync/async, rounds, time limits)
- Wager amount (floor: 5 USDC, ceiling: 1000 USDC per position)
- Participant requirements (credibility score, participation history, credentials)
- Evaluation mechanism (community assessment, expert council, AI evaluator, hybrid)
- Commencement time and registration cutoff
- Optional: Reference materials (datasets, citations, context documents)

#### 1.4 Participant Matching System
- **Open Sessions**: Any qualified participant can claim opposing position
- **Direct Challenge**: Participant A initiates session, challenges Participant B specifically
- **Algorithmic Matching**: Platform pairs participants by expertise, credibility, opposing viewpoints
- **Interest Tags**: Participants set topic preferences, receive notifications for relevant sessions

---

### **2. Wagering & Prize Distribution Mechanics**

#### 2.1 Wager Architecture
- Symmetrical wagers from both participants (equal USDC amounts)
- Funds escrowed in smart contract at session initiation
- Platform commission: 3-5% of total pool (governance-adjustable)
- Evaluator incentives: 10-15% of pool distributed to quality assessors
- Victor allocation: 75-82% of total pool
- Optional: Consolation return for participant (5% of wagered amount)

#### 2.2 Advanced Wagering Options
- **Collective Sessions**: Multiple participants per position pool wagers collectively
- **Observer Co-Wagering**: Spectators contribute to pool, predicting victor
- **Sponsored Sessions**: DAOs/protocols sponsor topic-relevant sessions (enhanced pools)
- **Escalating Wagers**: Stakes increase per round in tournament progression

#### 2.3 Edge Case Handling
- Participant absence: Automatic forfeit, wager transfers to present participant
- Evaluation deadlock: Pool distributed 50/50 minus platform commission
- Disputed outcomes: Appeal mechanism triggers secondary evaluation round

---

### **3. Discourse Execution & Structure**

#### 3.1 Synchronous Session Rounds
- **Initial Thesis** (3-5 min each): Present foundational arguments
- **First Counterpoint** (2-3 min each): Address opposing claims
- **Direct Interrogation** (4-6 min): Pose questions to opponent
- **Second Counterpoint** (2-3 min each): Final rebuttals
- **Closing Synthesis** (2-3 min each): Consolidate position
- **Optional Community Q&A** (5-10 min): Observer questions

#### 3.2 Asynchronous Progression
- Submission 1: Opening position (48hr response deadline)
- Submission 2: Counter-position (24hr response window)
- Submissions 3-6: Iterative exchanges (24hr windows)
- Submission 7: Closing statements from both positions
- Evaluation period: 48-72 hours post-completion

#### 3.3 Submission Standards
- Text arguments (200-1000 words per round)
- Optional: Embedded media (visualizations, images, videos under 2MB)
- Citation requirements for empirical claims
- Length constraints to prevent content abuse
- Profanity filtering and civility standards
- Logical fallacy prohibition (AI monitoring flags violations)

#### 3.4 Real-Time Features (Synchronous Sessions)
- Live text streaming
- Active observer counter
- Audience reactions (emoji responses, non-evaluative)
- Moderated observer chat sidebar
- Round timer visualization
- Active speaker indicator

---

### **4. Evaluation & Assessment System**

#### 4.1 Evaluator Eligibility
- **Baseline Requirements**:
  - Must possess Basename identity
  - Must maintain >0 credibility score OR completed verification
  - Must have evaluated ≥1 previous session (after initial evaluation)
  - Optional: Small wager (1-2 USDC) to evaluate (anti-Sybil measure, refunded if aligned with consensus)

#### 4.2 Assessment Criteria (Weighted Scoring)
Evaluators rate each participant on:
- **Argumentation Quality** (30%): Logical coherence, evidence strength, reasoning validity
- **Counterpoint Efficacy** (25%): Effectiveness in addressing opposing claims
- **Communication Clarity** (20%): Organization, comprehensibility, structure
- **Evidence Integrity** (15%): Source quality and relevance of supporting materials
- **Persuasive Impact** (10%): Overall convincing capacity

Evaluators submit:
- Score per criterion (1-10 scale)
- Optional written rationale
- Overall victor selection

#### 4.3 Evaluation Weighting System
Evaluations weighted by:
- Evaluator credibility score (higher credibility = greater weight)
- Historical assessment accuracy (consensus alignment)
- Domain expertise (topic-matched knowledge)
- Wager amount (if applicable)
- Account tenure and activity level

#### 4.4 Evaluation Mechanisms
- **Community Assessment**: Open to all qualified evaluators (default)
- **Quadratic Evaluation**: Evaluators allocate multiple assessments with diminishing returns
- **Expert Council**: Pre-selected assessors with verified domain expertise (premium sessions)
- **AI Evaluator**: AgentKit-powered AI analyzes arguments via logic, evidence, coherence
- **Hybrid Model**: Combined community + AI (70% community, 30% AI)

#### 4.5 Assessment Timeline
- Evaluation opens: Immediately post-session
- Evaluation duration: 48-72 hours (extended for complex topics)
- Early assessment incentive: Bonus for evaluations within first 24hrs
- Results disclosure: Delayed to prevent anchoring bias
- Live evaluation count: Hidden until assessment period closes

#### 4.6 Integrity Safeguards
- Vote manipulation detection (anomalous patterns flagged)
- Collusion prevention (participants barred from evaluating own sessions)
- Alternate account detection (linked wallets identified via behavioral analysis)
- Credibility reduction for consistent outlier assessments
- Random audit sampling by AI evaluator

---

### **5. Identity & Credibility System**

#### 5.1 Basename Integration
- Mandatory for all participants (discourse participants + evaluators)
- Basename displayed throughout platform
- Link to Basename profile displaying session history
- Basename serves as portable credential across Base ecosystem

#### 5.2 Credibility Scoring
**Participant Credibility (0-100 scale)**:
- Victory rate (25%)
- Average assessment scores received (30%)
- Total sessions participated (10%)
- Topic complexity engagement (10%)
- Reliability (no forfeits/violations) (15%)
- Peer recognition (10%)

**Evaluator Credibility (0-100 scale)**:
- Assessment accuracy (consensus alignment) (35%)
- Total assessments submitted (15%)
- Rationale quality (20%)
- Demonstrated domain expertise (15%)
- Consistency (no suspicious/random patterns) (15%)

#### 5.3 Achievement System (Onchain Recognition)
- **Participant Achievements**: First Victory, 10-Session Streak, David's Triumph (victory over higher-credibility opponent), Domain Specialist (10 victories in category), Undefeated Record
- **Evaluator Achievements**: 100 Assessments Completed, Consensus Architect (95%+ accuracy), Platform Pioneer, Category Authority
- **Special Recognition**: Tournament Champion, Veridium Founder, Community Distinguished

#### 5.4 Recognition Boards
- Global participant rankings
- Domain-specific rankings
- Evaluator influence rankings
- Temporal leaderboards (monthly/all-time)
- Geographic leaderboards (if applicable)

---

### **6. AI Integration (AgentKit)**

#### 6.1 AI Evaluator Agent
- Deployed via AgentKit with wallet for onchain operations
- Analyzes arguments using Claude/GPT-4 for:
  - Logical fallacy identification
  - Empirical claim verification (via web research)
  - Source credibility evaluation
  - Argument structure assessment
  - Coherence and clarity measurement
- Provides granular scoring breakdown
- Selectable as evaluation option for sessions
- Continuously adapts from human assessment patterns

#### 6.2 AI Preparation Coach Agent
- Assists participants in argument development
- Suggests counterpoints to test positions
- Recommends relevant sources and evidence
- Provides practice rounds against AI opponent
- Analyzes historical session performance, suggests improvements
- Premium feature: 5-10 USDC per coaching session (agent accumulates fees)

#### 6.3 AI Moderation Agent
- Real-time monitoring for civility violations
- Flags inappropriate submissions for human review
- Detects potential plagiarism or duplicate content
- Monitors assessment patterns for anomalies
- Issues automated warnings for rule violations

#### 6.4 AI Synthesis Agent
- Generates concise session summaries for observers
- Creates highlight compilations of critical moments
- Produces shareable content for social distribution
- Available immediately post-session

---

### **7. Smart Wallet Integration**

#### 7.1 Onboarding Flow
- Single-click Smart Wallet creation (passkey-based, seedless)
- Gasless account creation (Paymaster sponsored)
- Fiat onramp integration via Coinbase Pay
- Direct USDC purchase in-app with card payment
- Zero blockchain knowledge required

#### 7.2 Gasless Operations (Paymaster)
**Platform-Sponsored Actions**:
- Session creation (sponsored up to 1x/day per participant)
- Evaluation submission (fully sponsored)
- Winnings distribution (sponsored)
- Profile/Basename updates (sponsored monthly)

**Participant-Paid Actions**:
- High-stake sessions (>100 USDC)
- External wallet withdrawals
- Premium feature sponsorship

#### 7.3 USDC-Centric Experience
- All wagers, prizes, fees denominated in USDC (no native ETH required)
- Paymaster enables gas payment in USDC
- Seamless USDC deposits from Coinbase account
- USD-denominated balance displays for clarity

---

### **8. Discovery & Social Features**

#### 8.1 Activity Feed
- Trending session discovery
- Follow preferred participants
- Tag-based topic filtering
- Personalized recommendations based on assessment history
- Share sessions to Warpcast/X/Farcaster with preview cards

#### 8.2 Session Archive
- Repository of completed sessions
- Searchable by topic, participant, date, outcome
- Filter by domain, wager size, format
- Bookmark sessions for reference
- Curate custom session collections

#### 8.3 Community Capabilities
- Participant profiles with complete history
- Follow/subscriber system
- Direct challenges between participants
- Collective sessions (team vs team)
- Topic-focused communities/circles

#### 8.4 Notifications
- Session invitations/challenges
- Watched session commencement alerts
- Evaluation period opening for observed sessions
- Victory/outcome notifications
- Credibility changes and achievement unlocks
- New sessions in followed domains

---

### **9. Mini App Integration (Warpcast/Coinbase Wallet)**

#### 9.1 Frame Capabilities (Warpcast)
- Browse trending sessions directly in feed
- One-tap observer mode
- Submit evaluations without leaving Warpcast
- Share session outcomes as frames
- Generate challenge frames
- Display live sessions in progress

#### 9.2 Widget in Coinbase Wallet
- Quick access to active sessions
- Wallet balance and earnings summary
- Upcoming registered sessions
- Notification hub
- One-tap USDC funding

#### 9.3 Composability
- Deep linking from other Base applications
- Embeddable session widgets for external sites
- API for third-party integrations
- Export session data for analysis tools

---

### **10. Governance & Community**

#### 10.1 Platform Governance (Future Phase)
Token-gated decisions for:
- Platform commission adjustments
- New domain additions
- Rule modifications and updates
- Treasury allocation
- Feature prioritization

#### 10.2 Dispute Resolution
- Appeal mechanism for contested outcomes
- Community arbitration system for edge cases
- 3-member arbitration panel (high-credibility participants)
- Final decisions binding and onchain
- Precedent repository for consistent rulings

#### 10.3 Community Moderation
- Violation reporting system
- Community moderator roles (elected)
- Progressive warning system for repeat violations
- Restriction mechanism for severe violations
- Appeals process for restricted participants

---

## **Technical Architecture**

### **Frontend Stack**

#### Core Technologies
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.io for live sessions
- **Forms**: React Hook Form with Zod validation

#### Base Integration Layer
- **OnchainKit**: Primary SDK for Base interactions
  - Identity components (Basename display, avatar)
  - Wallet components (Connect, balance, fund)
  - Transaction components (wager, evaluate, claim)
  - Checkout flows for USDC purchases
- **Wagmi + Viem**: Low-level blockchain interactions
- **RainbowKit**: Fallback wallet connection

#### Component Architecture
```
/components
  /session
    - SessionCard.tsx
    - SessionRoom.tsx
    - ArgumentThread.tsx
    - TimerDisplay.tsx
    - EvaluationPanel.tsx
  /identity
    - ProfileCard.tsx
    - CredibilityDisplay.tsx
    - AchievementCollection.tsx
  /onchain
    - WagerButton.tsx
    - EvaluateButton.tsx
    - ClaimButton.tsx
    - FundSession.tsx
  /ai
    - AIEvaluatorPanel.tsx
    - CoachInterface.tsx
  /discovery
    - ShareButton.tsx
    - FeedItem.tsx
```

---

### **Backend Stack**

#### Core Infrastructure
- **Runtime**: Node.js (TypeScript)
- **Framework**: Fastify
- **Database**: PostgreSQL + Redis
- **Storage**: IPFS for session content
- **Real-time**: Socket.io for live updates

#### Services Architecture
```
/services
  /blockchain
    - ContractService.ts
    - EventListener.ts
    - TransactionService.ts
  /session
    - SessionOrchestrator.ts
    - TimerService.ts
    - MatchingService.ts
  /evaluation
    - AssessmentAggregator.ts
    - OutcomeCalculator.ts
    - IncentiveDistributor.ts
  /ai
    - AgentService.ts
    - EvaluatorService.ts
    - ModerationService.ts
  /credibility
    - ScoreCalculator.ts
    - AchievementIssuer.ts
  /identity
    - BasenameResolver.ts
    - ProfileService.ts
```

---

### **Smart Contract Architecture**

#### Contract Suite

**1. SessionFactory.sol**
- Creates new session instances
- Tracks deployed sessions
- Manages session templates
- Upgradeable via proxy

**2. WagerPool.sol** (per session)
- Escrows USDC from participants
- Holds funds until outcome finalized
- Distributes prizes based on evaluation
- Handles platform fees and evaluator incentives

**3. AssessmentManager.sol**
- Accepts weighted evaluations
- Calculates final scores and victor
- Prevents duplicate evaluations
- Distributes evaluator rewards

**4. CredibilityRegistry.sol**
- Tracks onchain credibility scores
- Updates based on session outcomes
- Queries by Basename
- Access-controlled updates

**5. AchievementNFT.sol** (ERC-721)
- Mints achievement recognition
- Soulbound (non-transferable)
- Metadata on IPFS
- Queryable by Basename

**6. Governance.sol** (Future Phase)
- Manages platform parameters
- Voting on fee changes, rules
- Treasury management
- Timelocked execution

#### Smart Contract Features

**Security Measures**:
- Reentrancy guards on all withdrawal functions
- Access control (OpenZeppelin)
- Pausable in emergency situations
- Rate limiting on critical functions
- Multi-sig admin controls

**Gas Optimization**:
- Batch operations where possible
- Efficient storage packing
- Use of events over storage reads
- Minimal onchain computation (offload to backend)

**Upgradeability**:
- UUPS proxy pattern for core contracts
- Separate logic and data storage
- Version tracking
- Safe upgrade procedures

#### Contract Interactions Flow
```
1. Session Creation
   User → SessionFactory.createSession() → Deploy WagerPool

2. Wager Deposit
   Participant → USDC.approve(WagerPool) → WagerPool.depositWager()

3. Evaluation Submission
   Evaluator → AssessmentManager.submitEvaluation() → weight calculation

4. Result Finalization
   Backend → AssessmentManager.finalizeResults()
   → WagerPool.distributePrizes()
   → CredibilityRegistry.updateScores()
   → AchievementNFT.mint() (if achievement unlocked)

5. Prize Claim
   Victor → WagerPool.claimPrize() → USDC transfer
```

---

### **Database Schema (Key Tables)**

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  basename VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  participant_credibility INTEGER DEFAULT 50,
  evaluator_credibility INTEGER DEFAULT 50,
  total_sessions INTEGER DEFAULT 0,
  total_evaluations INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  INDEX idx_basename (basename),
  INDEX idx_wallet (wallet_address)
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  proposition TEXT NOT NULL,
  category VARCHAR(100),
  format VARCHAR(50), -- 'async' | 'sync'
  wager_amount DECIMAL(18,6) NOT NULL,
  creator_id UUID REFERENCES users(id),
  challenger_id UUID REFERENCES users(id),
  status VARCHAR(50), -- 'pending' | 'active' | 'evaluating' | 'completed'
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  contract_address VARCHAR(42),
  prize_pool DECIMAL(18,6),
  victor_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_creator (creator_id),
  INDEX idx_challenger (challenger_id)
);

-- Arguments (for async sessions)
CREATE TABLE arguments (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES users(id),
  round_number INTEGER NOT NULL,
  content_ipfs_hash VARCHAR(100),
  word_count INTEGER,
  posted_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_session (session_id),
  INDEX idx_user (user_id)
);

-- Evaluations
CREATE TABLE evaluations (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  evaluator_id UUID REFERENCES users(id),
  victor_id UUID REFERENCES users(id),
  argumentation_quality INTEGER, -- 1-10
  counterpoint_efficacy INTEGER, -- 1-10
  communication_clarity INTEGER, -- 1-10
  evidence_integrity INTEGER, -- 1-10
  persuasive_impact INTEGER, -- 1-10
  rationale TEXT,
  weight DECIMAL(10,6),
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, evaluator_id),
  INDEX idx_session (session_id),
  INDEX idx_evaluator (evaluator_id)
);

-- Credibility Events
CREATE TABLE credibility_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50), -- 'session_win' | 'session_loss' | 'evaluation_accurate' | etc
  delta INTEGER, -- credibility change
  session_id UUID REFERENCES sessions(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  INDEX idx_user (user_id),
  INDEX idx_session (session_id)
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_type VARCHAR(100),
  earned_at TIMESTAMP DEFAULT NOW(),
  token_id VARCHAR(100),
  metadata_uri VARCHAR(255),
  INDEX idx_user (user_id)
);
```

---

### **API Endpoints (RESTful)**

```
/api/sessions
  GET    /                    - List sessions (paginated, filtered)
  POST   /                    - Create new session
  GET    /:id                 - Get session details
  POST   /:id/join            - Join as challenger
  POST   /:id/arguments       - Submit argument (async)
  GET    /:id/evaluations     - Get evaluation results
  POST   /:id/evaluate        - Submit evaluation

/api/users
  GET    /:basename           - Get user profile
  GET    /:basename/sessions  - User's session history
  GET    /:basename/achievements - User's achievements
  POST   /credibility         - Update credibility (internal)

/api/ai
  POST   /evaluate            - Request AI evaluation
  POST   /coach/session       - Start coaching session
  POST   /moderate            - Submit content for moderation

/api/leaderboards
  GET    /participants        - Top participants
  GET    /evaluators          - Top evaluators
  GET    /domains/:domain     - Domain-specific rankings
```

#### Websocket Events (Real-time)
```
/session/:id
  - argument_posted
  - timer_update
  - round_changed
  - session_ended
  - observer_joined
  - observer_left
  - reaction_added

/evaluation/:id
  - evaluation_submitted
  - results_revealed

/user/:basename
  - challenge_received
  - session_started
  - achievement_earned
```

---

### **Coinbase Developer Platform (CDP) Integration**

#### 1. Smart Wallet Implementation
- Use CDP Smart Wallet SDK for passkey-based authentication
- Configure Paymaster for gasless transactions
- Set spending limits per user (prevent abuse)
- Implement session keys for seamless UX
- Batch transactions where multiple actions needed

#### 2. Onramp Integration
- Coinbase Pay widget for USDC purchases
- Minimum purchase: $5, maximum: $500 (configurable)
- Direct USDC minting to user's Smart Wallet
- Show real-time exchange rates
- Handle payment failures gracefully

#### 3. Wallet Management
- CDP Wallet API for programmatic operations
- Automated wallet creation on signup
- Secure key management (delegated to CDP)
- Recovery mechanisms via social/email
- Export option for users wanting self-custody

#### 4. Transaction Management
- Use CDP's transaction APIs for reliable sending
- Automatic nonce management
- Gas estimation and optimization
- Transaction status tracking
- Retry logic for failed transactions

---

### **AgentKit Integration Details**

#### AI Evaluator Agent Setup
```typescript
import { AgentKit } from '@coinbase/agentkit-core'

// Initialize agent with wallet
const evaluatorAgent = new AgentKit({
  wallet: createSmartWallet(),
  apiKey: process.env.CDP_API_KEY,
  model: 'claude-sonnet-4-20250514'
})

// Provide agent with tools
evaluatorAgent.addTools([
  webSearchTool,        // Research empirical claims
  contractReadTool,     // Check session data
  contractWriteTool,    // Submit evaluation onchain
])

// Define evaluator behavior
const evaluatorPrompt = `
You are an impartial evaluator analyzing discourse sessions.
Assess both participants on: logic, evidence, clarity, counterpoint strength.
Use web search to verify empirical claims. Score each criterion 1-10.
Submit evaluation onchain by calling submitEvaluation().
`

// Execute evaluation
const evaluation = await evaluatorAgent.run(evaluatorPrompt, {
  sessionId: sessionId,
  arguments: [participant1Args, participant2Args]
})
```

#### AI Coach Agent Setup
```typescript
const coachAgent = new AgentKit({
  wallet: createSmartWallet(),
  model: 'claude-sonnet-4-20250514'
})

// Coaching interaction flow
async function runCoachingSession(userId, topic, position) {
  const session = await coachAgent.run(`
    You're coaching a participant on topic: "${topic}".
    Their position: ${position}.

    1. Ask about their main arguments
    2. Identify weak points
    3. Suggest counterarguments they should prepare for
    4. Recommend 3-5 credible sources
    5. Run a practice round (argue opposing side)

    Keep responses concise and actionable.
  `)

  // Charge user 10 USDC for session
  await chargeCoachingFee(userId, 10)

  return session
}
```

#### AI Moderation Agent
```typescript
const moderatorAgent = new AgentKit({
  model: 'claude-sonnet-4-20250514'
})

// Real-time content moderation
async function moderateArgument(content) {
  const result = await moderatorAgent.run(`
    Analyze this discourse argument for:
    1. Profanity or offensive language
    2. Personal attacks (ad hominem)
    3. Hate speech or discrimination
    4. Spam or gibberish
    5. Plagiarism (unusual phrasing patterns)

    Argument: "${content}"

    Return JSON: {
      isViolation: boolean,
      violationType: string,
      severity: 1-10,
      suggestedAction: 'warn' | 'flag' | 'remove'
    }
  `)

  return JSON.parse(result)
}
```

---

### **OnchainKit Component Usage**

#### Identity Components
```tsx
import {
  Identity,
  Avatar,
  Name,
  Address,
  Badge
} from '@coinbase/onchainkit/identity'

// Participant Profile Display
<Identity address={participantAddress} schemaId="basename">
  <Avatar />
  <div>
    <Name />
    <Address />
  </div>
  <div className="achievements">
    {achievements.map(achievement => (
      <Badge key={achievement.id} tokenId={achievement.tokenId} />
    ))}
  </div>
</Identity>
```

#### Wallet Components
```tsx
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet'

// Wallet Connection
<Wallet>
  <ConnectWallet>
    <Avatar />
    <Name />
    <Badge />
  </ConnectWallet>
  <WalletDropdown>
    <Identity address={address} />
    <WalletDropdownDisconnect />
  </WalletDropdown>
</Wallet>
```

#### Transaction Components
```tsx
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionToast,
} from '@coinbase/onchainkit/transaction'

// Wager on Session
<Transaction
  contracts={[{
    address: wagerPoolAddress,
    abi: wagerPoolAbi,
    functionName: 'depositWager',
    args: [sessionId, amount]
  }]}
  onSuccess={handleWagerSuccess}
>
  <TransactionButton text="Wager & Join Session" />
  <TransactionStatus>
    <TransactionToast />
  </TransactionStatus>
</Transaction>
```

#### Checkout Component
```tsx
import {
  Checkout,
  CheckoutButton,
  CheckoutStatus
} from '@coinbase/onchainkit/checkout'

// Buy USDC to Fund Wallet
<Checkout
  productId="usdc-purchase"
  onSuccess={handlePurchaseSuccess}
>
  <CheckoutButton coinbaseBranded text="Buy USDC" />
  <CheckoutStatus />
</Checkout>
```

#### Fund Component
```tsx
import {
  Fund,
  FundButton
} from '@coinbase/onchainkit/fund'

// Quick Funding Flow
<Fund
  fundingUrl={`https://pay.coinbase.com?...`}
>
  <FundButton />
</Fund>
```

---

### **Testing Strategy (OnchainTestKit)**

#### End-to-End Tests
```typescript
import { OnchainTestKit } from '@coinbase/onchainkit/test'

describe('Session Flow', () => {
  let testKit: OnchainTestKit

  beforeAll(async () => {
    testKit = new OnchainTestKit({
      network: 'base-sepolia'
    })
  })

  test('Complete session lifecycle', async () => {
    // 1. Create wallets for test users
    const participant1 = await testKit.createWallet()
    const participant2 = await testKit.createWallet()

    // 2. Fund wallets with test USDC
    await testKit.fundWallet(participant1, { USDC: 100 })
    await testKit.fundWallet(participant2, { USDC: 100 })

    // 3. Create session
    const session = await testKit.executeTransaction({
      wallet: participant1,
      contract: 'SessionFactory',
      function: 'createSession',
      args: ['Proposition', 50] // 50 USDC wager
    })

    // 4. Join as challenger
    await testKit.executeTransaction({
      wallet: participant2,
      contract: 'WagerPool',
      function: 'depositWager',
      args: [session.id]
    })

    // 5. Submit arguments
    // 6. Submit evaluations
    // 7. Finalize results
    // 8. Verify prize distribution

    expect(await testKit.getBalance(participant1, 'USDC'))
      .toBeGreaterThan(100) // Won session
  })

  test('Gasless evaluation', async () => {
    const evaluator = await testKit.createWallet()

    // Verify evaluation transaction is gasless
    const tx = await testKit.executeTransaction({
      wallet: evaluator,
      contract: 'AssessmentManager',
      function: 'submitEvaluation',
      args: [sessionId, scores]
    })

    expect(tx.gasFeePaidByUser).toBe(0)
  })
})
```

#### Smart Contract Tests
```solidity
// Foundry tests
contract WagerPoolTest is Test {
    WagerPool public pool;
    MockUSDC public usdc;

    function testWagerAndDistribute() public {
        // Setup
        pool.initialize(sessionId, wagerAmount);

        // Both participants wager
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(sessionId);

        vm.prank(participant2);
        pool.depositWager(sessionId);

        // Finalize with participant1 winning
        pool.finalizeResults(participant1, scores);

        // Verify distribution
        assertEq(usdc.balanceOf(participant1), expectedPrize);
        assertEq(usdc.balanceOf(platformWallet), platformFee);
    }
}
```

---

### **Mini App Implementation (Warpcast/Coinbase Wallet)**

#### Frame Configuration
```tsx
import { FrameMetadata } from '@coinbase/onchainkit/frame'

// Session Frame Metadata
export const sessionFrameMetadata: FrameMetadata = {
  buttons: [
    { label: 'View Session', action: 'link', target: sessionUrl },
    { label: 'Evaluate Now', action: 'post' },
    { label: 'Share', action: 'post' }
  ],
  image: {
    src: generateSessionPreview(sessionId),
    aspectRatio: '1.91:1'
  },
  input: {
    text: 'Enter your evaluation (1-10)'
  },
  postUrl: `${baseUrl}/api/frame/evaluate/${sessionId}`,
  state: {
    sessionId,
    evaluationOpen
  }
}
```

#### Minikit Integration (Coinbase Wallet)
```typescript
// minikit.config.ts
export const minikitConfig = {
  appId: 'veridium',
  appName: 'Veridium',
  iconUrl: 'https://...',
  description: 'Where truth is refined through discourse',

  // Widget configuration
  widget: {
    type: 'tab',
    position: 'bottom',
    routes: [
      { path: '/sessions', label: 'Active' },
      { path: '/profile', label: 'Profile' },
      { path: '/earnings', label: 'Earnings' }
    ]
  },

  // Deep link handlers
  deepLinks: {
    '/session/:id': (id) => openSession(id),
    '/challenge/:basename': (bn) => challengeUser(bn)
  }
}
```

---

### **Analytics & Monitoring**

#### Key Metrics to Track

**Platform Health**:
- Total sessions created (daily/weekly/monthly)
- Active participants and evaluators
- Total USDC wagered (TVL)
- Average session duration
- Completion rate (started vs finished)
- Platform revenue from fees

**User Engagement**:
- Daily/Monthly Active Users (DAU/MAU)
- Average sessions per user
- Retention curves (D1, D7, D30)
- Time spent in sessions
- Social shares and referrals

**Session Quality**:
- Average argument length
- Source citations per argument
- AI moderation flag rate
- Dispute/appeal frequency
- Evaluator participation rate
- Evaluation consensus level (agreement)

**Economic Metrics**:
- Average wager size
- Total winnings distributed
- Evaluator rewards paid
- Platform fee revenue
- User ARPU (Average Revenue Per User)

**Technical Performance**:
- Transaction success rate
- Gas costs (even with Paymaster)
- API response times
- Real-time latency (live sessions)
- Smart contract gas efficiency

#### Analytics Tools
- **Dune Analytics**: Onchain data dashboards
- **Mixpanel/Amplitude**: User behavior tracking
- **Sentry**: Error monitoring
- **Datadog**: Infrastructure monitoring
- **Custom Dashboard**: Real-time platform stats

---

### **Security & Compliance Requirements**

#### Smart Contract Security
- **Audits**: 2+ independent audits before mainnet (Consensys Diligence, Trail of Bits)
- **Bug Bounty**: ImmuneFi program with up to $50k rewards
- **Formal Verification**: Critical functions mathematically proven
- **Insurance**: Smart contract coverage via Nexus Mutual or similar
- **Emergency Pause**: Multi-sig controlled circuit breakers

#### Application Security
- **Authentication**: Secure wallet connection (no phishing)
- **Input Validation**: All user inputs sanitized
- **Rate Limiting**: Prevent spam and DoS attacks
- **DDoS Protection**: Cloudflare or similar
- **Secure Storage**: Encrypted sensitive data
- **HTTPS Only**: All traffic encrypted

#### Compliance Considerations
- **Terms of Service**: Clear rules and expectations
- **Privacy Policy**: GDPR-compliant data handling
- **KYC/AML**: Not required for small wagers; consider for high-value users
- **Gambling Laws**: Structure as skill-based competition, not pure gambling
- **Content Moderation**: Remove illegal content promptly
- **Geographic Restrictions**: Block sanctioned countries

#### Data Privacy
- **Minimal Data Collection**: Only essential information
- **User Consent**: Clear opt-ins for data usage
- **Data Portability**: Users can export their data
- **Right to Deletion**: Users can delete accounts (except onchain data)
- **Encryption**: At rest and in transit

---

### **Deployment & Infrastructure**

#### Hosting
- **Frontend**: Vercel or Cloudflare Pages
- **Backend**: AWS/GCP (load balanced, auto-scaling)
- **Database**: Managed PostgreSQL (AWS RDS or Supabase)
- **Redis**: Managed cache (AWS ElastiCache or Upstash)
- **Storage**: IPFS pinning via Pinata or Web3.Storage

#### Smart Contracts
- **Testnet**: Base Sepolia (extensive testing)
- **Mainnet**: Base L2
- **Deployment**: Foundry scripts
- **Verification**: Automated Basescan verification
- **Monitoring**: Tenderly for contract observability

#### CI/CD Pipeline
- GitHub Actions for automated testing
- Automated security scanning (Slither, MythX)
- Staging environment for final testing
- Blue-green deployments for zero downtime
- Automated rollback on critical failures

#### Scalability Considerations
- Horizontal scaling for backend services
- Database read replicas for heavy queries
- CDN for static assets
- Redis caching for frequently accessed data
- Database indexing optimization
- Connection pooling

---

### **Success Metrics & KPIs**

### North Star Metric
**Total Value Discoursed (TVD)**: Cumulative USDC wagered across all sessions

### Primary KPIs
- **User Acquisition**: 1,000 participants in first 3 months
- **Engagement**: 50% of users participate in 3+ sessions
- **Retention**: 30%+ D30 retention
- **Economic Activity**: $100k TVD in first 3 months
- **Quality**: Average session score >7/10 from evaluators

### Secondary KPIs
- Evaluator participation rate >60% of eligible users
- Average wager size growing over time
- Platform revenue sustainability (fees cover costs)
- Community satisfaction (NPS >50)
- Base ecosystem integration (featured in Base showcase)

---

## **Base Tools Integration Summary**

✅ **OnchainKit**: Identity, Wallet, Transactions, Checkout, Fund
✅ **Smart Wallet**: Passkey onboarding, gasless operations
✅ **Basenames**: Required identity, portable credibility
✅ **Paymaster**: Sponsored gas for evaluations, session creation
✅ **AgentKit**: AI Evaluator, Coach, Moderator agents with wallets
✅ **CDP APIs**: Wallet creation, transaction management, onramp
✅ **Minikit/Frames**: Warpcast and Coinbase Wallet integration
✅ **Base Infrastructure**: Native Base L2 deployment

---

## **Launch Phases**

### Phase 1: Core Platform (MVP)
- Asynchronous session creation
- Community evaluation system
- Wager & prize distribution
- Basename integration
- Smart Wallet onboarding
- Essential moderation

### Phase 2: Enhanced Platform
- Synchronous live sessions
- AI Evaluator agent
- Credibility system & recognition boards
- Achievement NFTs
- Tournament format
- Warpcast frame launch

### Phase 3: Full Ecosystem
- AI Coach agent
- Advanced matching algorithms
- Expert councils for premium sessions
- Sponsored sessions
- Governance system

---

This document defines Veridium as a platform where truth is refined through rigorous discourse, economic incentives align with intellectual integrity, and the Base ecosystem enables seamless user experience.
