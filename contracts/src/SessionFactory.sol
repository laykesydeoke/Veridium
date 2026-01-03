// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WagerPool.sol";
import "./interfaces/ISessionFactory.sol";

/// @title SessionFactory
/// @notice Factory contract for creating discourse sessions
/// @dev Creates WagerPool contracts for each session
contract SessionFactory is ISessionFactory, Ownable, ReentrancyGuard {
    /// @notice Counter for session IDs
    uint256 private sessionCounter;

    /// @notice USDC token address
    address public immutable usdc;

    /// @notice Platform wallet for fees
    address public platformWallet;

    /// @notice Minimum wager amount
    uint256 public constant MIN_WAGER = 5 * 10 ** 6; // 5 USDC (6 decimals)

    /// @notice Maximum wager amount
    uint256 public constant MAX_WAGER = 1000 * 10 ** 6; // 1000 USDC

    /// @notice Mapping from session ID to WagerPool address
    mapping(uint256 => address) public sessionPools;

    /// @notice Mapping from session ID to proposition
    mapping(uint256 => string) public sessionPropositions;

    /// @notice Constructor
    /// @param _usdc The USDC token address
    /// @param _platformWallet The platform fee recipient
    constructor(address _usdc, address _platformWallet) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");

        usdc = _usdc;
        platformWallet = _platformWallet;
    }

    /// @inheritdoc ISessionFactory
    function createSession(
        string calldata proposition,
        uint256 wagerAmount,
        uint256 evaluationPeriod
    ) external override nonReentrant returns (uint256 sessionId) {
        require(bytes(proposition).length > 0, "Empty proposition");
        require(wagerAmount >= MIN_WAGER && wagerAmount <= MAX_WAGER, "Invalid wager amount");
        require(evaluationPeriod > 0, "Invalid evaluation period");

        // Increment session counter
        sessionCounter++;
        sessionId = sessionCounter;

        // Deploy new WagerPool
        WagerPool pool = new WagerPool(sessionId, msg.sender, wagerAmount, usdc, platformWallet);

        // Store session data
        sessionPools[sessionId] = address(pool);
        sessionPropositions[sessionId] = proposition;

        emit SessionCreated(sessionId, address(pool), msg.sender, wagerAmount);
    }

    /// @inheritdoc ISessionFactory
    function getSessionCount() external view override returns (uint256) {
        return sessionCounter;
    }

    /// @inheritdoc ISessionFactory
    function getSessionPool(uint256 sessionId) external view override returns (address) {
        return sessionPools[sessionId];
    }

    /// @notice Updates the platform wallet address
    /// @param _platformWallet The new platform wallet
    function updatePlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }

    /// @notice Gets the proposition for a session
    /// @param sessionId The session identifier
    /// @return The proposition text
    function getSessionProposition(uint256 sessionId) external view returns (string memory) {
        return sessionPropositions[sessionId];
    }
}
