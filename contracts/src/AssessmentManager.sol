// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAssessmentManager.sol";
import "./WagerPool.sol";
import "./libraries/AssessmentLib.sol";

/// @title AssessmentManager
/// @notice Manages discourse session evaluations, scoring, and reward distribution
/// @dev Uses weighted scoring based on evaluator credibility
contract AssessmentManager is IAssessmentManager, Ownable, ReentrancyGuard {
    using AssessmentLib for *;
    /// @notice Minimum number of evaluations required to finalize results
    uint256 public constant MIN_EVALUATIONS = 3;

    /// @notice Base weight for new evaluators
    uint256 public constant BASE_WEIGHT = 100;

    /// @notice Maximum weight for highly credible evaluators
    uint256 public constant MAX_WEIGHT = 1000;

    /// @notice Reference to the credibility registry (for future integration)
    address public credibilityRegistry;

    /// @notice Mapping of sessionId => evaluator => Evaluation
    mapping(uint256 => mapping(address => Evaluation)) private evaluations;

    /// @notice Mapping of sessionId => SessionResult
    mapping(uint256 => SessionResult) private sessionResults;

    /// @notice Mapping of sessionId => array of evaluator addresses
    mapping(uint256 => address[]) private sessionEvaluators;

    /// @notice Mapping of sessionId => WagerPool address
    mapping(uint256 => address) public sessionPools;

    /// @notice Mapping to track if evaluator has already evaluated a session
    mapping(uint256 => mapping(address => bool)) private hasEvaluated;

    constructor() Ownable(msg.sender) {}

    /// @notice Register a session for evaluation
    /// @param sessionId The session ID
    /// @param poolAddress The WagerPool contract address
    function registerSession(uint256 sessionId, address poolAddress) external onlyOwner {
        require(poolAddress != address(0), "Invalid pool address");
        require(sessionPools[sessionId] == address(0), "Session already registered");

        sessionPools[sessionId] = poolAddress;
    }

    /// @inheritdoc IAssessmentManager
    function submitEvaluation(uint256 sessionId, Verdict verdict) external override nonReentrant {
        require(sessionPools[sessionId] != address(0), "Session not registered");
        require(!hasEvaluated[sessionId][msg.sender], "Already evaluated");
        require(isEligible(sessionId, msg.sender), "Not eligible");
        require(!sessionResults[sessionId].finalized, "Results already finalized");

        // Get evaluator weight (for now using base weight, will integrate credibility later)
        uint256 weight = _getEvaluatorWeight(msg.sender);

        // Store evaluation
        evaluations[sessionId][msg.sender] = Evaluation({
            evaluator: msg.sender,
            verdict: verdict,
            timestamp: block.timestamp,
            weight: weight
        });

        hasEvaluated[sessionId][msg.sender] = true;
        sessionEvaluators[sessionId].push(msg.sender);

        // Update session scores
        _updateSessionScores(sessionId, verdict, weight);

        emit EvaluationSubmitted(sessionId, msg.sender, verdict, weight);
    }

    /// @inheritdoc IAssessmentManager
    function finalizeResults(uint256 sessionId)
        external
        override
        onlyOwner
        nonReentrant
        returns (Verdict finalVerdict)
    {
        require(sessionPools[sessionId] != address(0), "Session not registered");
        require(!sessionResults[sessionId].finalized, "Already finalized");
        require(sessionEvaluators[sessionId].length >= MIN_EVALUATIONS, "Insufficient evaluations");

        SessionResult storage result = sessionResults[sessionId];

        // Determine final verdict using library function
        finalVerdict = AssessmentLib.determineWinner(
            result.creatorScore,
            result.challengerScore,
            result.drawScore
        );

        result.finalVerdict = finalVerdict;
        result.finalized = true;

        emit ResultsFinalized(sessionId, finalVerdict, result.creatorScore, result.challengerScore);

        return finalVerdict;
    }

    /// @inheritdoc IAssessmentManager
    function distributeRewards(uint256 sessionId) external override onlyOwner nonReentrant {
        require(sessionResults[sessionId].finalized, "Results not finalized");

        // Reward distribution logic will be implemented with WagerPool integration
        // For now, emit events for tracking
        address[] memory evaluators = sessionEvaluators[sessionId];
        for (uint256 i = 0; i < evaluators.length; i++) {
            emit EvaluatorRewarded(sessionId, evaluators[i], 0);
        }
    }

    /// @inheritdoc IAssessmentManager
    function getEvaluation(uint256 sessionId, address evaluator)
        external
        view
        override
        returns (Evaluation memory evaluation)
    {
        return evaluations[sessionId][evaluator];
    }

    /// @inheritdoc IAssessmentManager
    function getSessionResult(uint256 sessionId) external view override returns (SessionResult memory result) {
        return sessionResults[sessionId];
    }

    /// @inheritdoc IAssessmentManager
    function isEligible(uint256 sessionId, address evaluator) public view override returns (bool eligible) {
        // Basic eligibility: not a participant and hasn't evaluated yet
        address poolAddress = sessionPools[sessionId];
        if (poolAddress == address(0)) return false;

        WagerPool pool = WagerPool(poolAddress);

        // Cannot be the creator or challenger
        if (evaluator == pool.creator() || evaluator == pool.challenger()) {
            return false;
        }

        // Cannot have already evaluated
        if (hasEvaluated[sessionId][evaluator]) {
            return false;
        }

        return true;
    }

    /// @inheritdoc IAssessmentManager
    function getEvaluationCount(uint256 sessionId) external view override returns (uint256 count) {
        return sessionEvaluators[sessionId].length;
    }

    /// @notice Get all evaluators for a session
    /// @param sessionId The session ID
    /// @return evaluators Array of evaluator addresses
    function getSessionEvaluators(uint256 sessionId) external view returns (address[] memory evaluators) {
        return sessionEvaluators[sessionId];
    }

    /// @notice Update credibility registry address
    /// @param _credibilityRegistry New credibility registry address
    function updateCredibilityRegistry(address _credibilityRegistry) external onlyOwner {
        credibilityRegistry = _credibilityRegistry;
    }

    /// @notice Check if session has minimum evaluations
    /// @param sessionId The session ID
    /// @return hasMinimum True if session has minimum evaluations
    function hasMinimumEvaluations(uint256 sessionId) external view returns (bool hasMinimum) {
        return sessionEvaluators[sessionId].length >= MIN_EVALUATIONS;
    }

    /// @notice Get session scores
    /// @param sessionId The session ID
    /// @return creatorScore Creator's weighted score
    /// @return challengerScore Challenger's weighted score
    /// @return drawScore Draw weighted score
    function getSessionScores(uint256 sessionId)
        external
        view
        returns (uint256 creatorScore, uint256 challengerScore, uint256 drawScore)
    {
        SessionResult memory result = sessionResults[sessionId];
        return (result.creatorScore, result.challengerScore, result.drawScore);
    }

    /// @notice Get evaluator weight based on credibility
    /// @param evaluator The evaluator address
    /// @return weight The evaluator's weight
    function _getEvaluatorWeight(address evaluator) internal view returns (uint256 weight) {
        // For now, return base weight
        // Will integrate with CredibilityRegistry in future
        evaluator; // Silence unused variable warning
        return BASE_WEIGHT;
    }

    /// @notice Update session scores with new evaluation
    /// @param sessionId The session ID
    /// @param verdict The verdict to add
    /// @param weight The weight of the evaluation
    function _updateSessionScores(uint256 sessionId, Verdict verdict, uint256 weight) internal {
        SessionResult storage result = sessionResults[sessionId];

        if (verdict == Verdict.Creator) {
            result.creatorScore += weight;
        } else if (verdict == Verdict.Challenger) {
            result.challengerScore += weight;
        } else {
            result.drawScore += weight;
        }

        result.totalWeight += weight;
    }
}
