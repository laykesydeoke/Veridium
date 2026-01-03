// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Errors
/// @notice Custom error definitions for Veridium contracts
library Errors {
    /// @notice Thrown when an invalid address is provided
    error InvalidAddress();

    /// @notice Thrown when wager amount is outside valid range
    error InvalidWagerAmount();

    /// @notice Thrown when evaluation period is invalid
    error InvalidEvaluationPeriod();

    /// @notice Thrown when proposition is empty
    error EmptyProposition();

    /// @notice Thrown when session is in wrong status for operation
    error InvalidSessionStatus();

    /// @notice Thrown when session is already full
    error SessionFull();

    /// @notice Thrown when caller is not authorized
    error Unauthorized();

    /// @notice Thrown when prize pool is empty
    error EmptyPrizePool();

    /// @notice Thrown when evaluation period has not ended
    error EvaluationPeriodNotEnded();

    /// @notice Thrown when session is already completed
    error AlreadyCompleted();
}
