// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IAssessmentManager.sol";

/// @title AssessmentLib
/// @notice Library for assessment calculations and utilities
library AssessmentLib {
    /// @notice Calculate weighted score for a verdict
    /// @param evaluations Array of evaluations
    /// @param target Target verdict to calculate score for
    /// @return score Weighted score for the verdict
    function calculateWeightedScore(IAssessmentManager.Evaluation[] memory evaluations, IAssessmentManager.Verdict target)
        internal
        pure
        returns (uint256 score)
    {
        for (uint256 i = 0; i < evaluations.length; i++) {
            if (evaluations[i].verdict == target) {
                score += evaluations[i].weight;
            }
        }
        return score;
    }

    /// @notice Determine verdict with highest weighted score
    /// @param creatorScore Weighted score for creator
    /// @param challengerScore Weighted score for challenger
    /// @param drawScore Weighted score for draw
    /// @return verdict The winning verdict
    function determineWinner(uint256 creatorScore, uint256 challengerScore, uint256 drawScore)
        internal
        pure
        returns (IAssessmentManager.Verdict verdict)
    {
        if (creatorScore > challengerScore && creatorScore > drawScore) {
            return IAssessmentManager.Verdict.Creator;
        } else if (challengerScore > creatorScore && challengerScore > drawScore) {
            return IAssessmentManager.Verdict.Challenger;
        } else {
            return IAssessmentManager.Verdict.Draw;
        }
    }

    /// @notice Calculate evaluator reward share
    /// @param totalRewardPool Total rewards to distribute
    /// @param numEvaluators Number of evaluators
    /// @return rewardPerEvaluator Amount per evaluator
    function calculateEvaluatorReward(uint256 totalRewardPool, uint256 numEvaluators)
        internal
        pure
        returns (uint256 rewardPerEvaluator)
    {
        require(numEvaluators > 0, "No evaluators");
        return totalRewardPool / numEvaluators;
    }

    /// @notice Check if verdict distribution is a tie
    /// @param creatorScore Weighted score for creator
    /// @param challengerScore Weighted score for challenger
    /// @param drawScore Weighted score for draw
    /// @return isTie True if there's a tie
    function isTieScore(uint256 creatorScore, uint256 challengerScore, uint256 drawScore)
        internal
        pure
        returns (bool isTie)
    {
        return (creatorScore == challengerScore && creatorScore > 0) ||
               (creatorScore == drawScore && creatorScore > 0) ||
               (challengerScore == drawScore && challengerScore > 0);
    }
}
