// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWagerPool.sol";

/// @title WagerPool
/// @notice Manages wagers and prize distribution for a single discourse session
/// @dev Uses ReentrancyGuard for security and SafeERC20 for token transfers
contract WagerPool is IWagerPool, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The USDC token contract
    IERC20 public immutable usdc;

    /// @notice The session ID this pool manages
    uint256 public immutable sessionId;

    /// @notice The wager amount required from each participant
    uint256 public immutable wagerAmount;

    /// @notice The platform fee percentage (in basis points, e.g., 300 = 3%)
    uint256 public constant PLATFORM_FEE_BPS = 300; // 3%

    /// @notice The evaluator rewards percentage (in basis points)
    uint256 public constant EVALUATOR_REWARDS_BPS = 1000; // 10%

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Current status of the session
    SessionStatus public status;

    /// @notice Creator of the session
    address public creator;

    /// @notice Challenger (second participant)
    address public challenger;

    /// @notice Timestamp when evaluation period ends
    uint256 public evaluationEndTime;

    /// @notice Platform fee recipient address
    address public platformWallet;

    /// @notice Total prize pool accumulated
    uint256 public prizePool;

    /// @notice Modifier to check if session is in specific status
    /// @param requiredStatus The required status
    modifier inStatus(SessionStatus requiredStatus) {
        require(status == requiredStatus, "Invalid session status");
        _;
    }

    /// @notice Constructor
    /// @param _sessionId The session identifier
    /// @param _creator The session creator address
    /// @param _wagerAmount The required wager amount
    /// @param _usdc The USDC token address
    /// @param _platformWallet The platform fee recipient
    constructor(
        uint256 _sessionId,
        address _creator,
        uint256 _wagerAmount,
        address _usdc,
        address _platformWallet
    ) Ownable(msg.sender) {
        require(_creator != address(0), "Invalid creator");
        require(_wagerAmount > 0, "Invalid wager amount");
        require(_usdc != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");

        sessionId = _sessionId;
        creator = _creator;
        wagerAmount = _wagerAmount;
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
        status = SessionStatus.Pending;
    }

    /// @inheritdoc IWagerPool
    function depositWager(address participant) external override nonReentrant inStatus(SessionStatus.Pending) {
        require(participant != address(0), "Invalid participant");
        require(participant == creator || challenger == address(0), "Session full");

        // Transfer USDC from participant
        usdc.safeTransferFrom(participant, address(this), wagerAmount);
        prizePool += wagerAmount;

        emit WagerDeposited(participant, wagerAmount);

        // If this is the challenger, activate the session
        if (participant != creator) {
            challenger = participant;
            status = SessionStatus.Active;
        }
    }

    /// @inheritdoc IWagerPool
    function distributePrizes(address victor) external override onlyOwner nonReentrant inStatus(SessionStatus.Evaluating) {
        require(victor == creator || victor == challenger, "Invalid victor");
        require(block.timestamp >= evaluationEndTime, "Evaluation period not ended");

        uint256 totalPool = prizePool;
        require(totalPool > 0, "No prize pool");

        // Calculate fees and rewards
        uint256 platformFee = (totalPool * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 evaluatorRewards = (totalPool * EVALUATOR_REWARDS_BPS) / BPS_DENOMINATOR;
        uint256 prizeAmount = totalPool - platformFee - evaluatorRewards;

        // Transfer platform fee
        usdc.safeTransfer(platformWallet, platformFee);

        // Transfer evaluator rewards (managed by owner/backend)
        usdc.safeTransfer(owner(), evaluatorRewards);

        // Transfer prize to victor
        usdc.safeTransfer(victor, prizeAmount);

        status = SessionStatus.Completed;

        emit PrizesDistributed(victor, prizeAmount);
    }

    /// @notice Starts the evaluation period
    /// @param duration The evaluation period duration in seconds
    function startEvaluation(uint256 duration) external onlyOwner inStatus(SessionStatus.Active) {
        require(duration > 0, "Invalid duration");
        evaluationEndTime = block.timestamp + duration;
        status = SessionStatus.Evaluating;
    }

    /// @notice Emergency cancel function
    /// @dev Refunds both participants
    function cancelSession() external onlyOwner {
        require(status != SessionStatus.Completed, "Already completed");

        uint256 refundAmount = wagerAmount;

        // Refund creator
        if (prizePool >= refundAmount) {
            usdc.safeTransfer(creator, refundAmount);
            prizePool -= refundAmount;
        }

        // Refund challenger if they deposited
        if (challenger != address(0) && prizePool >= refundAmount) {
            usdc.safeTransfer(challenger, refundAmount);
            prizePool -= refundAmount;
        }

        status = SessionStatus.Cancelled;
    }

    /// @inheritdoc IWagerPool
    function getStatus() external view override returns (SessionStatus) {
        return status;
    }

    /// @inheritdoc IWagerPool
    function getPrizePool() external view override returns (uint256) {
        return prizePool;
    }
}
