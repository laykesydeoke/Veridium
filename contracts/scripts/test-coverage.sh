#!/bin/bash
# Test coverage script for Veridium smart contracts

echo "Running Foundry test coverage..."

# Generate coverage report
forge coverage --report lcov

# Check if lcov report was generated
if [ -f "lcov.info" ]; then
    echo "Coverage report generated: lcov.info"
    echo ""
    echo "To view detailed coverage:"
    echo "  genhtml lcov.info -o coverage"
    echo "  open coverage/index.html"
else
    echo "Failed to generate coverage report"
    exit 1
fi
