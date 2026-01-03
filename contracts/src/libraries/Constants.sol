// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Constants
/// @notice Common constants used across Veridium contracts
library Constants {
    /// @notice Minimum wager amount in USDC (6 decimals)
    uint256 internal constant MIN_WAGER = 5 * 10 ** 6; // 5 USDC

    /// @notice Maximum wager amount in USDC (6 decimals)
    uint256 internal constant MAX_WAGER = 1000 * 10 ** 6; // 1000 USDC

    /// @notice Platform fee in basis points
    uint256 internal constant PLATFORM_FEE_BPS = 300; // 3%

    /// @notice Evaluator rewards in basis points
    uint256 internal constant EVALUATOR_REWARDS_BPS = 1000; // 10%

    /// @notice Basis points denominator
    uint256 internal constant BPS_DENOMINATOR = 10000; // 100%

    /// @notice Minimum evaluation period
    uint256 internal constant MIN_EVALUATION_PERIOD = 1 days;

    /// @notice Maximum evaluation period
    uint256 internal constant MAX_EVALUATION_PERIOD = 7 days;
}
