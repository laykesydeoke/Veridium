// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICredibilityRegistry
/// @notice Interface for onchain reputation tracking
/// @dev Manages credibility scores and history for discourse participants
interface ICredibilityRegistry {
    /// @notice Credibility score record for a user
    struct CredibilityScore {
        uint256 totalScore; // Cumulative credibility score
        uint256 sessionsParticipated; // Number of sessions participated
        uint256 sessionsWon; // Number of sessions won
        uint256 evaluationsSubmitted; // Number of evaluations submitted
        uint256 evaluationsCorrect; // Number of correct evaluations (matched final verdict)
        uint256 lastUpdated; // Timestamp of last update
        bool isActive; // Whether user is active
    }

    /// @notice History entry for credibility changes
    struct CredibilityHistory {
        uint256 sessionId; // Session ID
        int256 scoreChange; // Score change (positive or negative)
        uint256 timestamp; // When the change occurred
        string reason; // Reason for change
    }

    /// @notice Emitted when credibility score is updated
    /// @param user The user address
    /// @param oldScore Previous score
    /// @param newScore New score
    /// @param reason Reason for update
    event CredibilityUpdated(address indexed user, uint256 oldScore, uint256 newScore, string reason);

    /// @notice Emitted when user participates in session
    /// @param user The user address
    /// @param sessionId The session ID
    event SessionParticipation(address indexed user, uint256 indexed sessionId);

    /// @notice Emitted when evaluation is recorded
    /// @param evaluator The evaluator address
    /// @param sessionId The session ID
    /// @param correct Whether evaluation was correct
    event EvaluationRecorded(address indexed evaluator, uint256 indexed sessionId, bool correct);

    /// @notice Update credibility score for a user
    /// @param user The user address
    /// @param scoreChange The score change (can be negative)
    /// @param sessionId The session ID causing the change
    /// @param reason The reason for update
    function updateCredibility(address user, int256 scoreChange, uint256 sessionId, string calldata reason) external;

    /// @notice Record session participation
    /// @param participant The participant address
    /// @param sessionId The session ID
    /// @param won Whether the participant won
    function recordSessionParticipation(address participant, uint256 sessionId, bool won) external;

    /// @notice Record evaluation submission
    /// @param evaluator The evaluator address
    /// @param sessionId The session ID
    /// @param correct Whether the evaluation matched final verdict
    function recordEvaluation(address evaluator, uint256 sessionId, bool correct) external;

    /// @notice Get credibility score for a user
    /// @param user The user address
    /// @return score The credibility score
    function getCredibility(address user) external view returns (CredibilityScore memory score);

    /// @notice Get evaluator weight based on credibility
    /// @param evaluator The evaluator address
    /// @return weight The weight (100-1000)
    function getEvaluatorWeight(address evaluator) external view returns (uint256 weight);

    /// @notice Get credibility history for a user
    /// @param user The user address
    /// @return history Array of history entries
    function getHistory(address user) external view returns (CredibilityHistory[] memory history);

    /// @notice Get total number of active users
    /// @return count Number of active users
    function getActiveUserCount() external view returns (uint256 count);

    /// @notice Check if user is eligible to evaluate
    /// @param user The user address
    /// @return eligible True if user can evaluate
    function isEligibleEvaluator(address user) external view returns (bool eligible);

    /// @notice Get leaderboard (top N users by credibility)
    /// @param limit Number of users to return
    /// @return users Array of top user addresses
    function getLeaderboard(uint256 limit) external view returns (address[] memory users);
}
