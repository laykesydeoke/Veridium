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

## License

MIT
