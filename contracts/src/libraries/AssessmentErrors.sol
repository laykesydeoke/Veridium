// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AssessmentErrors
/// @notice Custom errors for AssessmentManager operations
library AssessmentErrors {
    /// @notice Thrown when session is not registered
    error SessionNotRegistered();

    /// @notice Thrown when evaluator has already submitted evaluation
    error AlreadyEvaluated();

    /// @notice Thrown when evaluator is not eligible (participant or already evaluated)
    error NotEligible();

    /// @notice Thrown when results are already finalized
    error AlreadyFinalized();

    /// @notice Thrown when attempting to finalize with insufficient evaluations
    error InsufficientEvaluations(uint256 current, uint256 required);

    /// @notice Thrown when attempting operations on unregistered session
    error InvalidPoolAddress();

    /// @notice Thrown when session already registered
    error SessionAlreadyRegistered();

    /// @notice Thrown when results not yet finalized
    error ResultsNotFinalized();
}
