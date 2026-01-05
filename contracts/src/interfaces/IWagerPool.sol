// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IWagerPool
/// @notice Interface for the WagerPool contract that manages session wagers and prizes
interface IWagerPool {
    /// @notice Session status enum
    enum SessionStatus {
        Pending,
        Active,
        Evaluating,
        Completed,
        Cancelled
    }

    /// @notice Emitted when a participant deposits their wager
    /// @param participant The address of the participant
    /// @param amount The wager amount deposited
    event WagerDeposited(address indexed participant, uint256 amount);

    /// @notice Emitted when the session is finalized and prizes distributed
    /// @param victor The address of the winning participant
    /// @param prizeAmount The prize amount awarded
    event PrizesDistributed(address indexed victor, uint256 prizeAmount);

    /// @notice Deposits wager for a participant
    /// @param participant The address of the participant
    function depositWager(address participant) external;

    /// @notice Finalizes the session and distributes prizes
    /// @param victor The address of the winning participant
    function distributePrizes(address victor) external;

    /// @notice Gets the current session status
    /// @return The current status
    function getStatus() external view returns (SessionStatus);

    /// @notice Gets the total prize pool
    /// @return The total USDC in the pool
    function getPrizePool() external view returns (uint256);
}
