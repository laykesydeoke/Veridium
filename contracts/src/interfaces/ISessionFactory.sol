// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISessionFactory
/// @notice Interface for the SessionFactory contract that creates discourse sessions
interface ISessionFactory {
    /// @notice Emitted when a new session is created
    /// @param sessionId The unique identifier for the session
    /// @param wagerPool The address of the deployed WagerPool contract
    /// @param creator The address of the session creator
    /// @param wagerAmount The USDC amount required to participate
    event SessionCreated(
        uint256 indexed sessionId,
        address indexed wagerPool,
        address indexed creator,
        uint256 wagerAmount
    );

    /// @notice Creates a new discourse session
    /// @param proposition The topic/resolution for the session
    /// @param wagerAmount The USDC amount each participant must wager
    /// @param evaluationPeriod The duration for evaluation after session ends
    /// @return sessionId The unique identifier for the created session
    function createSession(
        string calldata proposition,
        uint256 wagerAmount,
        uint256 evaluationPeriod
    ) external returns (uint256 sessionId);

    /// @notice Gets the total number of sessions created
    /// @return The total session count
    function getSessionCount() external view returns (uint256);

    /// @notice Gets the WagerPool address for a specific session
    /// @param sessionId The session identifier
    /// @return The WagerPool contract address
    function getSessionPool(uint256 sessionId) external view returns (address);
}
