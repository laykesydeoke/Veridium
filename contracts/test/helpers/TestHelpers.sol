// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/WagerPool.sol";
import "../../src/SessionFactory.sol";
import "../../src/mocks/MockUSDC.sol";

/// @title TestHelpers
/// @notice Reusable test helpers and utilities for Veridium contract tests
contract TestHelpers is Test {
    /// @notice Creates a fully funded session ready for testing
    /// @param factory The SessionFactory instance
    /// @param usdc The USDC token contract
    /// @param creator Address of the session creator
    /// @param challenger Address of the challenger
    /// @param wagerAmount Amount to wager in USDC (6 decimals)
    /// @return sessionId The created session ID
    /// @return pool The WagerPool contract instance
    function createAndFundSession(
        SessionFactory factory,
        MockUSDC usdc,
        address creator,
        address challenger,
        uint256 wagerAmount
    ) internal returns (uint256 sessionId, WagerPool pool) {
        // Create session
        vm.prank(creator);
        sessionId = factory.createSession("Test Proposition", wagerAmount, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        pool = WagerPool(poolAddress);

        // Fund both participants
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();
    }

    /// @notice Starts evaluation period and warps past it
    /// @param factory The SessionFactory (owner of pool)
    /// @param pool The WagerPool instance
    /// @param duration Evaluation period duration
    function startAndCompleteEvaluation(SessionFactory factory, WagerPool pool, uint256 duration) internal {
        vm.prank(address(factory));
        pool.startEvaluation(duration);

        vm.warp(block.timestamp + duration + 1);
    }

    /// @notice Calculates expected prize distribution amounts
    /// @param totalPool The total prize pool
    /// @return platformFee The platform fee (3%)
    /// @return evaluatorRewards The evaluator rewards (10%)
    /// @return victorPrize The prize for the victor
    function calculatePrizeDistribution(uint256 totalPool)
        internal
        pure
        returns (uint256 platformFee, uint256 evaluatorRewards, uint256 victorPrize)
    {
        platformFee = (totalPool * 300) / 10000; // 3%
        evaluatorRewards = (totalPool * 1000) / 10000; // 10%
        victorPrize = totalPool - platformFee - evaluatorRewards; // 87%
    }

    /// @notice Mints USDC to multiple addresses
    /// @param usdc The USDC token contract
    /// @param recipients Array of recipient addresses
    /// @param amount Amount to mint to each recipient
    function mintToMany(MockUSDC usdc, address[] memory recipients, uint256 amount) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            usdc.mint(recipients[i], amount);
        }
    }

    /// @notice Creates a test address with a label
    /// @param name The label for the address
    /// @return addr The created address
    function createUser(string memory name) internal returns (address addr) {
        addr = makeAddr(name);
        vm.label(addr, name);
    }

    /// @notice Checks if value is within expected range (for fuzzing)
    /// @param value The value to check
    /// @param expected The expected value
    /// @param tolerance The allowed tolerance
    /// @return True if within range
    function isWithinTolerance(uint256 value, uint256 expected, uint256 tolerance)
        internal
        pure
        returns (bool)
    {
        if (expected > value) {
            return (expected - value) <= tolerance;
        } else {
            return (value - expected) <= tolerance;
        }
    }
}
