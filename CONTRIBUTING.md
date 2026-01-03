# Contributing to Veridium

Thank you for your interest in contributing to Veridium!

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - pnpm 8+
   - Foundry (for smart contracts)

2. **Installation**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   cp contracts/.env.example contracts/.env
   ```

## Development Workflow

### Running Development Servers

```bash
# Run all services
pnpm dev

# Run specific service
pnpm dev:frontend
pnpm dev:backend
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:frontend
pnpm build:backend
pnpm build:contracts
```

### Testing

```bash
# Run all tests
pnpm test

# Run contract tests
pnpm test:contracts
```

### Linting & Formatting

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Commit Guidelines

- Keep commits focused and atomic
- Use present tense ("Add feature" not "Added feature")
- Max 50 characters for commit messages
- Reference issues when applicable

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with descriptive commits
3. Ensure all tests pass
4. Update documentation as needed
5. Submit PR with clear description

## Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write self-documenting code
- Add comments for complex logic

## Questions?

Open an issue for any questions or concerns.
