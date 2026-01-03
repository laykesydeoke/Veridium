# Veridium

**Where truth is refined through discourse**

Veridium is a decentralized platform built on Base that transforms intellectual discourse into an engaging prediction market. Participants wager USDC on their convictions, engage in structured argumentation, and allow the community to determine validity through transparent evaluation mechanisms.

## 🎯 Overview

Veridium incentivizes quality discourse by combining:
- **Economic Stakes**: Participants wager USDC on their positions
- **Structured Argumentation**: Clear formats for rigorous discourse
- **Community Evaluation**: Transparent assessment mechanisms
- **Onchain Credibility**: Portable reputation via Basenames
- **AI-Powered Tools**: AgentKit-powered evaluators, coaches, and moderators

## 🏗️ Built on Base

Veridium leverages the complete Base ecosystem:

- ✅ **OnchainKit**: Identity, Wallet, Transaction components
- ✅ **Smart Wallets**: Passkey-based onboarding, gasless transactions
- ✅ **Basenames**: Required identity system for all participants
- ✅ **Paymaster**: Sponsored gas for evaluations and session creation
- ✅ **AgentKit**: AI agents with wallets for evaluation and coaching
- ✅ **CDP APIs**: Wallet creation, transaction management, fiat onramp
- ✅ **Minikit/Frames**: Warpcast and Coinbase Wallet integration

## 🚀 Core Features (MVP)

### Phase 1: Core Platform
- **Asynchronous Sessions**: Extended discourse with 24-48hr response windows
- **Community Evaluation**: Transparent assessment by qualified evaluators
- **Wager & Prize Distribution**: Smart contract-based escrow and payouts
- **Basename Integration**: Portable identity across Base ecosystem
- **Smart Wallet Onboarding**: Seedless, passkey-based authentication
- **Essential Moderation**: AI-powered content filtering

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Real-time**: Socket.io
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js (TypeScript)
- **Framework**: Fastify
- **Database**: PostgreSQL + Redis
- **Storage**: IPFS
- **Real-time**: Socket.io

### Smart Contracts
- **Language**: Solidity
- **Framework**: Foundry
- **Network**: Base (Sepolia testnet → Mainnet)
- **Key Contracts**:
  - SessionFactory.sol
  - WagerPool.sol
  - AssessmentManager.sol
  - CredibilityRegistry.sol
  - AchievementNFT.sol

## 📦 Project Structure

```
veridium/
├── contracts/          # Smart contracts
├── frontend/           # Next.js application
├── backend/            # Node.js API
├── docs/               # Documentation
└── scripts/            # Deployment scripts
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and pnpm
- Foundry (for smart contracts)
- PostgreSQL 14+
- Redis

### Installation

```bash
# Clone repository
git clone https://github.com/laykesydeoke/Veridium.git
cd Veridium

# Install dependencies (will be automated)
pnpm install

# Setup environment variables
cp .env.example .env

# Run local development
pnpm dev
```

## 🎮 How It Works

### For Participants
1. **Connect Wallet**: Use Smart Wallet (passkey) or external wallet
2. **Create Session**: Define proposition, wager amount, format
3. **Engage**: Present arguments with evidence and citations
4. **Await Evaluation**: Community assesses both positions
5. **Claim Winnings**: Receive USDC based on evaluation outcome

### For Evaluators
1. **Browse Sessions**: Discover completed discourse sessions
2. **Evaluate**: Score participants on multiple criteria
3. **Earn Rewards**: Receive portion of prize pool for quality assessments
4. **Build Credibility**: Accurate evaluations increase your influence

## 🏆 Credibility System

### Participant Credibility (0-100)
- Victory rate (25%)
- Average assessment scores (30%)
- Total sessions (10%)
- Topic complexity (10%)
- Reliability (15%)
- Peer recognition (10%)

### Evaluator Credibility (0-100)
- Assessment accuracy (35%)
- Total evaluations (15%)
- Rationale quality (20%)
- Domain expertise (15%)
- Consistency (15%)

## 🤖 AI Agents (AgentKit)

- **AI Evaluator**: Analyzes arguments for logic, evidence, coherence
- **AI Coach**: Helps participants prepare arguments and strategy
- **AI Moderator**: Real-time content filtering and violation detection
- **AI Synthesizer**: Generates summaries and highlights

## 🔐 Security

- Smart contract audits before mainnet
- Multi-sig admin controls
- Rate limiting and anti-Sybil measures
- Encrypted data storage
- Regular security monitoring

## 📈 Roadmap

### Phase 1: MVP (Current)
- Core asynchronous sessions
- Basic evaluation system
- Smart Wallet integration
- Essential AI moderation

### Phase 2: Enhanced Platform
- Synchronous live sessions
- AI Evaluator agent
- Credibility leaderboards
- Achievement NFTs
- Tournament format
- Warpcast Frame

### Phase 3: Full Ecosystem
- AI Coach agent
- Advanced matching algorithms
- Expert councils
- Sponsored sessions
- Governance system

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Website**: Coming soon
- **Documentation**: Coming soon
- **Twitter**: Coming soon
- **Discord**: Coming soon

## 💡 Brand Identity

**Veridium** (veh-RID-ee-um)
- From Latin "veritas" (truth) + "-ium" (place/element)
- Meaning: "The place where truth resides" or "The element of truth"
- Represents a crucible where truth is tested and refined through discourse

---

Built with ❤️ on Base
