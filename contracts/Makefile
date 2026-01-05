.PHONY: test test-v test-vv test-gas test-coverage test-unit test-integration test-fuzz snapshot clean

# Run all tests
test:
	forge test

# Run tests with verbose output
test-v:
	forge test -v

# Run tests with very verbose output
test-vv:
	forge test -vvv

# Run tests with gas reporting
test-gas:
	forge test --gas-report

# Generate test coverage report
test-coverage:
	@bash scripts/test-coverage.sh

# Run only unit tests
test-unit:
	forge test --match-path "test/WagerPool.t.sol" --match-path "test/SessionFactory.t.sol"

# Run only integration tests
test-integration:
	forge test --match-path "test/Integration.t.sol"

# Run only fuzz tests
test-fuzz:
	forge test --match-path "test/WagerPoolFuzz.t.sol"

# Generate gas snapshot
snapshot:
	forge snapshot

# Clean build artifacts
clean:
	forge clean
	rm -rf cache out lcov.info coverage
