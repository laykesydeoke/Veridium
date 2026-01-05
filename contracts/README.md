# Veridium Smart Contracts

Smart contracts for the Veridium discourse platform built on Base.

## Contracts

### Core Contracts

- **SessionFactory.sol**: Factory contract for creating discourse sessions
- **WagerPool.sol**: Manages wagers and prize distribution for individual sessions
- **AssessmentManager.sol**: Manages session evaluations, weighted scoring, and results
- **CredibilityRegistry.sol**: Onchain reputation tracking for participants and evaluators
- **AchievementNFT.sol**: Soulbound NFTs for discourse achievements (ERC-721)

### Interfaces

- **ISessionFactory.sol**: SessionFactory interface
- **IWagerPool.sol**: WagerPool interface
- **IAssessmentManager.sol**: AssessmentManager interface
- **ICredibilityRegistry.sol**: CredibilityRegistry interface
- **IAchievementNFT.sol**: AchievementNFT interface

### Libraries

- **AssessmentLib.sol**: Utility functions for assessment calculations
- **AssessmentErrors.sol**: Custom errors for assessment operations
- **AssessmentConstants.sol**: Centralized constants for gas optimization
- **AchievementUnlocker.sol**: Helper functions for checking achievement unlock conditions

### Mocks

- **MockUSDC.sol**: Mock USDC token for testing (DO NOT use in production)

## Build & Test

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Run tests with coverage
forge coverage
```

## Deployment

### Base Sepolia (Testnet)

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export PLATFORM_WALLET=0x...

# Deploy to Base Sepolia
forge script script/Deploy.s.sol:Deploy --rpc-url base_sepolia --broadcast --verify
```

### Base Mainnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export PLATFORM_WALLET=0x...

# Deploy to Base Mainnet
forge script script/DeployMainnet.s.sol:DeployMainnet --rpc-url base_mainnet --broadcast --verify
```

## Contract Addresses

### Base Sepolia

- SessionFactory: TBD
- MockUSDC: TBD

### Base Mainnet

- SessionFactory: TBD
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## AssessmentManager Features

### Weighted Scoring System

- Evaluations are weighted based on evaluator credibility
- Base weight: 100, Max weight: 1000
- Minimum 3 evaluations required to finalize results
- Prevents participants from evaluating their own sessions

### Verdict Options

- **Creator**: Creator wins the discourse
- **Challenger**: Challenger wins the discourse
- **Draw**: Tie result

### Integration Points

- Connects with WagerPool for session validation
- Integrated with CredibilityRegistry for dynamic weights
- Supports evaluator reward distribution

## Reputation & Achievements

### CredibilityRegistry Features

- **Onchain Reputation**: Tracks credibility scores based on participation and performance
- **Dynamic Weights**: Evaluator weights calculated from credibility (100-1000 range)
- **Eligibility**: Minimum 50 credibility required to evaluate sessions
- **Metrics**: Win rate, evaluation accuracy, session participation tracking
- **History**: Full credibility change history for transparency
- **Leaderboard**: Query top users by credibility score

### AchievementNFT Features

- **Soulbound Tokens**: Non-transferable NFTs that stay with the recipient
- **8 Achievement Types**:
  - FirstSession, FirstWin, FirstEvaluation
  - TenSessions, FiftySessions
  - HighAccuracy (80%+ evaluation accuracy)
  - Legendary (100+ credibility)
  - Champion (10+ wins)
- **IPFS Metadata**: Achievement details stored on IPFS
- **Batch Minting**: Gas-efficient batch operations
- **Moderation**: Achievement revocation for fraud cases

## Security

- Uses OpenZeppelin contracts for security best practices
- Implements ReentrancyGuard for state-changing functions
- Access control via Ownable pattern
- SafeERC20 for token transfers
- Duplicate evaluation prevention
- Participant exclusion from evaluation

## Testing

Comprehensive test suite with 51+ tests covering:

### Test Types

- **Unit Tests**: Individual contract function testing
  - `SessionFactory.t.sol`: 20 tests
  - `WagerPool.t.sol`: 17 tests
- **Integration Tests**: End-to-end workflow testing
  - `Integration.t.sol`: 8 complete scenario tests
- **Fuzz Tests**: Property-based testing with random inputs
  - `WagerPoolFuzz.t.sol`: 6 fuzz tests with 256 runs each

### Running Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test file
forge test --match-path test/WagerPool.t.sol

# Run specific test
forge test --match-test testDepositWagerCreator

# Generate gas report
forge test --gas-report
```

### Test Coverage

The test suite covers:

- Wager deposit flows (creator and challenger)
- Session state transitions
- Prize distribution calculations
- Platform fee and evaluator rewards
- Evaluation period mechanics
- Cancellation and refund logic
- Access control enforcement
- Input validation and edge cases
- Reentrancy protection
- Gas optimization verification

## License

MIT
