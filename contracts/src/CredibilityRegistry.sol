// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ICredibilityRegistry.sol";

/// @title CredibilityRegistry
/// @notice Manages onchain reputation scores for discourse participants
/// @dev Integrates with AssessmentManager for evaluation tracking
contract CredibilityRegistry is ICredibilityRegistry, Ownable, ReentrancyGuard {
    /// @notice Minimum credibility score for eligibility
    uint256 public constant MIN_CREDIBILITY = 50;

    /// @notice Base weight for evaluators
    uint256 public constant BASE_WEIGHT = 100;

    /// @notice Maximum weight for evaluators
    uint256 public constant MAX_WEIGHT = 1000;

    /// @notice Score awarded for session participation
    uint256 public constant PARTICIPATION_SCORE = 10;

    /// @notice Score awarded for winning a session
    uint256 public constant WIN_SCORE = 50;

    /// @notice Score awarded for submitting an evaluation
    uint256 public constant EVALUATION_SCORE = 5;

    /// @notice Score awarded for correct evaluation
    uint256 public constant CORRECT_EVALUATION_BONUS = 15;

    /// @notice Mapping of user address to credibility score
    mapping(address => CredibilityScore) private credibilityScores;

    /// @notice Mapping of user address to credibility history
    mapping(address => CredibilityHistory[]) private credibilityHistory;

    /// @notice Array of all active users
    address[] private activeUsers;

    /// @notice Mapping to track if user is in active users array
    mapping(address => bool) private isUserActive;

    /// @notice Authorized updaters (e.g., AssessmentManager)
    mapping(address => bool) public authorizedUpdaters;

    constructor() Ownable(msg.sender) {
        // Owner is automatically authorized
        authorizedUpdaters[msg.sender] = true;
    }

    /// @notice Modifier to restrict access to authorized updaters
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender], "Not authorized");
        _;
    }

    /// @inheritdoc ICredibilityRegistry
    function updateCredibility(address user, int256 scoreChange, uint256 sessionId, string calldata reason)
        external
        override
        onlyAuthorized
        nonReentrant
    {
        require(user != address(0), "Invalid user");

        CredibilityScore storage score = credibilityScores[user];
        uint256 oldScore = score.totalScore;

        // Apply score change
        if (scoreChange > 0) {
            score.totalScore += uint256(scoreChange);
        } else if (scoreChange < 0) {
            uint256 decrease = uint256(-scoreChange);
            if (decrease >= score.totalScore) {
                score.totalScore = 0;
            } else {
                score.totalScore -= decrease;
            }
        }

        score.lastUpdated = block.timestamp;
        score.isActive = true;

        // Add to active users if not already
        if (!isUserActive[user]) {
            activeUsers.push(user);
            isUserActive[user] = true;
        }

        // Record history
        credibilityHistory[user].push(
            CredibilityHistory({sessionId: sessionId, scoreChange: scoreChange, timestamp: block.timestamp, reason: reason})
        );

        emit CredibilityUpdated(user, oldScore, score.totalScore, reason);
    }

    /// @inheritdoc ICredibilityRegistry
    function recordSessionParticipation(address participant, uint256 sessionId, bool won)
        external
        override
        onlyAuthorized
        nonReentrant
    {
        require(participant != address(0), "Invalid participant");

        CredibilityScore storage score = credibilityScores[participant];
        score.sessionsParticipated++;

        if (won) {
            score.sessionsWon++;
        }

        score.lastUpdated = block.timestamp;
        score.isActive = true;

        // Add to active users if not already
        if (!isUserActive[participant]) {
            activeUsers.push(participant);
            isUserActive[participant] = true;
        }

        emit SessionParticipation(participant, sessionId);
    }

    /// @inheritdoc ICredibilityRegistry
    function recordEvaluation(address evaluator, uint256 sessionId, bool correct)
        external
        override
        onlyAuthorized
        nonReentrant
    {
        require(evaluator != address(0), "Invalid evaluator");

        CredibilityScore storage score = credibilityScores[evaluator];
        score.evaluationsSubmitted++;

        if (correct) {
            score.evaluationsCorrect++;
        }

        score.lastUpdated = block.timestamp;
        score.isActive = true;

        // Add to active users if not already
        if (!isUserActive[evaluator]) {
            activeUsers.push(evaluator);
            isUserActive[evaluator] = true;
        }

        emit EvaluationRecorded(evaluator, sessionId, correct);
    }

    /// @inheritdoc ICredibilityRegistry
    function getCredibility(address user) external view override returns (CredibilityScore memory score) {
        return credibilityScores[user];
    }

    /// @inheritdoc ICredibilityRegistry
    function getEvaluatorWeight(address evaluator) external view override returns (uint256 weight) {
        CredibilityScore memory score = credibilityScores[evaluator];

        // Base weight
        weight = BASE_WEIGHT;

        // Add weight based on credibility score (1 point = 1 weight, capped at MAX_WEIGHT)
        uint256 bonusWeight = score.totalScore;
        if (bonusWeight > (MAX_WEIGHT - BASE_WEIGHT)) {
            bonusWeight = MAX_WEIGHT - BASE_WEIGHT;
        }

        weight += bonusWeight;

        // Cap at MAX_WEIGHT
        if (weight > MAX_WEIGHT) {
            weight = MAX_WEIGHT;
        }

        return weight;
    }

    /// @inheritdoc ICredibilityRegistry
    function getHistory(address user) external view override returns (CredibilityHistory[] memory history) {
        return credibilityHistory[user];
    }

    /// @inheritdoc ICredibilityRegistry
    function getActiveUserCount() external view override returns (uint256 count) {
        return activeUsers.length;
    }

    /// @inheritdoc ICredibilityRegistry
    function isEligibleEvaluator(address user) external view override returns (bool eligible) {
        return credibilityScores[user].totalScore >= MIN_CREDIBILITY;
    }

    /// @inheritdoc ICredibilityRegistry
    function getLeaderboard(uint256 limit) external view override returns (address[] memory users) {
        uint256 userCount = activeUsers.length;
        if (limit > userCount) {
            limit = userCount;
        }

        // Simple implementation - returns first N users
        // TODO: Implement sorting for true leaderboard
        users = new address[](limit);
        for (uint256 i = 0; i < limit; i++) {
            users[i] = activeUsers[i];
        }

        return users;
    }

    /// @notice Add authorized updater
    /// @param updater The address to authorize
    function addAuthorizedUpdater(address updater) external onlyOwner {
        require(updater != address(0), "Invalid updater");
        authorizedUpdaters[updater] = true;
    }

    /// @notice Remove authorized updater
    /// @param updater The address to remove
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }

    /// @notice Get all active users
    /// @return users Array of active user addresses
    function getActiveUsers() external view returns (address[] memory users) {
        return activeUsers;
    }

    /// @notice Get accuracy rate for evaluator
    /// @param evaluator The evaluator address
    /// @return accuracy Percentage accuracy (0-100)
    function getEvaluatorAccuracy(address evaluator) external view returns (uint256 accuracy) {
        CredibilityScore memory score = credibilityScores[evaluator];
        if (score.evaluationsSubmitted == 0) {
            return 0;
        }
        return (score.evaluationsCorrect * 100) / score.evaluationsSubmitted;
    }

    /// @notice Get win rate for participant
    /// @param participant The participant address
    /// @return winRate Percentage win rate (0-100)
    function getWinRate(address participant) external view returns (uint256 winRate) {
        CredibilityScore memory score = credibilityScores[participant];
        if (score.sessionsParticipated == 0) {
            return 0;
        }
        return (score.sessionsWon * 100) / score.sessionsParticipated;
    }
}
