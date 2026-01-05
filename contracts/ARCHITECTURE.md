# Smart Contract Architecture

## Overview

Veridium's smart contract architecture is designed for security, gas efficiency, and modularity on Base L2.

## Contract Hierarchy

```
SessionFactory (Main Entry Point)
    ├─> WagerPool (Per-Session Instance)
    ├─> AssessmentManager (Evaluation & Scoring)
    ├─> CredibilityRegistry (Reputation Tracking)
    ├─> AchievementNFT (Soulbound Achievements)
    └─> Libraries
            ├─> AssessmentLib
            ├─> AchievementUnlocker
            ├─> AssessmentConstants
            └─> AssessmentErrors
```

## Core Contracts

### SessionFactory.sol

**Purpose**: Factory contract for creating discourse sessions

**Key Features**:

- Creates WagerPool instances for each session
- Tracks all sessions via mapping
- Enforces wager amount limits (5-1000 USDC)
- Manages platform wallet configuration

**Access Control**: Ownable (for platform wallet updates)

### WagerPool.sol

**Purpose**: Manages wagers and prize distribution for individual sessions

**Key Features**:

- Escrows USDC from both participants
- Implements state machine (Pending → Active → Evaluating → Completed/Cancelled)
- Distributes prizes based on evaluation results
- Calculates platform fees (3%) and evaluator rewards (10%)
- Emergency cancellation with refunds

**Security**:

- ReentrancyGuard on all state-changing functions
- SafeERC20 for token transfers
- Access control via Ownable
- Status-based modifiers

### AssessmentManager.sol

**Purpose**: Manages session evaluations, weighted scoring, and result calculation

**Key Features**:

- Handles evaluator submissions and duplicate prevention
- Implements weighted scoring algorithm based on evaluator credibility
- Calculates final session results using majority weighted voting
- Manages evaluator reward distribution
- Enforces minimum evaluation thresholds (3+ evaluations)
- Prevents participants from evaluating their own sessions
- Integrates with CredibilityRegistry for evaluator weights

**Security**:

- ReentrancyGuard on all state-changing functions
- Access control via Ownable for result finalization
- Eligibility checks to prevent conflicts of interest
- Duplicate evaluation prevention

### CredibilityRegistry.sol

**Purpose**: Manages onchain reputation scores for participants and evaluators

**Key Features**:

- Tracks credibility scores, sessions participated/won, evaluations submitted
- Calculates evaluator weights (100-1000) based on credibility
- Maintains credibility history for transparency
- Determines evaluator eligibility (minimum 50 credibility)
- Provides leaderboard and accuracy metrics

**Security**:

- ReentrancyGuard on all state-changing functions
- Authorized updaters pattern for score modifications
- Access control via Ownable

### AchievementNFT.sol

**Purpose**: Mints soulbound (non-transferable) NFTs for achievements

**Key Features**:

- ERC-721 compliant with transfer restrictions
- 8 achievement types (FirstSession, FirstWin, HighAccuracy, etc.)
- IPFS metadata integration
- Batch minting for gas efficiency
- Achievement revocation for moderation

**Security**:

- Soulbound logic prevents transfers (except burning)
- Authorized minters pattern
- Duplicate achievement prevention
- ReentrancyGuard on minting functions

## State Flow

```
1. Session Created (SessionFactory)
   └─> WagerPool deployed with status: Pending

2. Creator Deposits Wager
   └─> Status: Pending (waiting for challenger)

3. Challenger Deposits Wager
   └─> Status: Active (session ongoing)

4. Backend Triggers Evaluation Period
   └─> Status: Evaluating

5. Evaluation Period Ends
   └─> Status: Completed (prizes distributed)
```

## Fee Distribution

Total Pool: 100 USDC (50 + 50)

- Platform Fee: 3 USDC (3%)
- Evaluator Rewards: 10 USDC (10%)
- Victor Prize: 87 USDC (87%)

## Gas Optimization

- Immutable variables for frequently accessed data
- Events for off-chain indexing
- Minimal storage reads/writes
- Efficient struct packing

## Security Considerations

1. **Reentrancy Protection**: All external calls use ReentrancyGuard
2. **Access Control**: Critical functions restricted to owner
3. **Input Validation**: All parameters validated before use
4. **Safe Math**: Solidity 0.8.x built-in overflow protection
5. **Token Safety**: SafeERC20 for all USDC transfers

## Future Enhancements

- UUPS Proxy Pattern for upgradeability
- Multi-signature admin controls
- Emergency pause functionality
- Timelocks for sensitive operations
