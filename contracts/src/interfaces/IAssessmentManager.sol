// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAssessmentManager
/// @notice Interface for managing discourse session evaluations and scoring
interface IAssessmentManager {
    /// @notice Evaluation verdict options
    enum Verdict {
        Creator, // Creator wins the discourse
        Challenger, // Challenger wins the discourse
        Draw // Neither side wins
    }

    /// @notice Evaluation data structure
    struct Evaluation {
        address evaluator; // Address of the evaluator
        Verdict verdict; // The evaluator's verdict
        uint256 timestamp; // When the evaluation was submitted
        uint256 weight; // Weight of this evaluation (based on evaluator credibility)
    }

    /// @notice Session evaluation results
    struct SessionResult {
        uint256 creatorScore; // Weighted score for creator
        uint256 challengerScore; // Weighted score for challenger
        uint256 drawScore; // Weighted score for draw
        uint256 totalWeight; // Total weight of all evaluations
        Verdict finalVerdict; // Final calculated verdict
        bool finalized; // Whether results have been finalized
    }

    /// @notice Emitted when an evaluation is submitted
    /// @param sessionId The session being evaluated
    /// @param evaluator Address of the evaluator
    /// @param verdict The evaluator's verdict
    /// @param weight Weight assigned to this evaluation
    event EvaluationSubmitted(
        uint256 indexed sessionId, address indexed evaluator, Verdict verdict, uint256 weight
    );

    /// @notice Emitted when session results are finalized
    /// @param sessionId The session ID
    /// @param finalVerdict The final verdict
    /// @param creatorScore Final weighted score for creator
    /// @param challengerScore Final weighted score for challenger
    event ResultsFinalized(
        uint256 indexed sessionId, Verdict finalVerdict, uint256 creatorScore, uint256 challengerScore
    );

    /// @notice Emitted when evaluator rewards are distributed
    /// @param sessionId The session ID
    /// @param evaluator Address receiving rewards
    /// @param amount Reward amount
    event EvaluatorRewarded(uint256 indexed sessionId, address indexed evaluator, uint256 amount);

    /// @notice Submit an evaluation for a session
    /// @param sessionId The session to evaluate
    /// @param verdict The evaluator's verdict
    function submitEvaluation(uint256 sessionId, Verdict verdict) external;

    /// @notice Finalize session results after evaluation period
    /// @param sessionId The session to finalize
    /// @return finalVerdict The calculated final verdict
    function finalizeResults(uint256 sessionId) external returns (Verdict finalVerdict);

    /// @notice Distribute rewards to evaluators
    /// @param sessionId The session ID
    function distributeRewards(uint256 sessionId) external;

    /// @notice Get evaluation for a specific evaluator and session
    /// @param sessionId The session ID
    /// @param evaluator The evaluator address
    /// @return evaluation The evaluation data
    function getEvaluation(uint256 sessionId, address evaluator)
        external
        view
        returns (Evaluation memory evaluation);

    /// @notice Get session results
    /// @param sessionId The session ID
    /// @return result The session results
    function getSessionResult(uint256 sessionId) external view returns (SessionResult memory result);

    /// @notice Check if an evaluator is eligible to evaluate a session
    /// @param sessionId The session ID
    /// @param evaluator The evaluator address
    /// @return eligible True if eligible
    function isEligible(uint256 sessionId, address evaluator) external view returns (bool eligible);

    /// @notice Get total number of evaluations for a session
    /// @param sessionId The session ID
    /// @return count Number of evaluations
    function getEvaluationCount(uint256 sessionId) external view returns (uint256 count);
}
