// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/interfaces/IAssessmentManager.sol";

/// @title AssessmentHelpers
/// @notice Helper functions for AssessmentManager tests
library AssessmentHelpers {
    /// @notice Create evaluation struct for testing
    /// @param evaluator The evaluator address
    /// @param verdict The verdict
    /// @param weight The weight
    /// @return eval The evaluation struct
    function createEvaluation(address evaluator, IAssessmentManager.Verdict verdict, uint256 weight)
        internal
        view
        returns (IAssessmentManager.Evaluation memory eval)
    {
        return IAssessmentManager.Evaluation({
            evaluator: evaluator,
            verdict: verdict,
            timestamp: block.timestamp,
            weight: weight
        });
    }

    /// @notice Check if verdict matches expected
    /// @param actual The actual verdict
    /// @param expected The expected verdict
    /// @return matches True if verdicts match
    function verdictMatches(IAssessmentManager.Verdict actual, IAssessmentManager.Verdict expected)
        internal
        pure
        returns (bool matches)
    {
        return uint8(actual) == uint8(expected);
    }

    /// @notice Calculate expected winner based on scores
    /// @param creatorScore Creator's weighted score
    /// @param challengerScore Challenger's weighted score
    /// @param drawScore Draw weighted score
    /// @return verdict The expected winning verdict
    function expectedWinner(uint256 creatorScore, uint256 challengerScore, uint256 drawScore)
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
}
