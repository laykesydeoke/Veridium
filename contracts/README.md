# Veridium Smart Contracts

Smart contracts for the Veridium discourse platform built on Base.

## Contracts

### Core Contracts

- **SessionFactory.sol**: Factory contract for creating discourse sessions
- **WagerPool.sol**: Manages wagers and prize distribution for individual sessions

### Interfaces

- **ISessionFactory.sol**: SessionFactory interface
- **IWagerPool.sol**: WagerPool interface

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

## Security

- Uses OpenZeppelin contracts for security best practices
- Implements ReentrancyGuard for state-changing functions
- Access control via Ownable pattern
- SafeERC20 for token transfers

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
