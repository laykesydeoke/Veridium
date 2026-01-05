// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AssessmentConstants
/// @notice Centralized constants for assessment operations
library AssessmentConstants {
    /// @notice Minimum number of evaluations required to finalize results
    uint256 internal constant MIN_EVALUATIONS = 3;

    /// @notice Base weight for new evaluators
    uint256 internal constant BASE_WEIGHT = 100;

    /// @notice Maximum weight for highly credible evaluators
    uint256 internal constant MAX_WEIGHT = 1000;

    /// @notice Minimum weight for evaluators
    uint256 internal constant MIN_WEIGHT = 50;

    /// @notice Maximum number of evaluators per session (gas optimization)
    uint256 internal constant MAX_EVALUATORS = 100;

    /// @notice Evaluation period extension in seconds (if needed)
    uint256 internal constant EVALUATION_EXTENSION = 1 days;
}
