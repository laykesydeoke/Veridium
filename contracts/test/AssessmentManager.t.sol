// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AssessmentManager.sol";
import "../src/SessionFactory.sol";
import "../src/WagerPool.sol";
import "../src/mocks/MockUSDC.sol";

/// @title AssessmentManager Tests
/// @notice Comprehensive tests for AssessmentManager contract
contract AssessmentManagerTest is Test {
    AssessmentManager assessmentManager;
    SessionFactory factory;
    MockUSDC usdc;
    WagerPool pool;

    address owner;
    address creator;
    address challenger;
    address evaluator1;
    address evaluator2;
    address evaluator3;
    address platformWallet;

    uint256 sessionId;
    uint256 wagerAmount = 100 * 10 ** 6;

    function setUp() public {
        owner = address(this);
        creator = makeAddr("creator");
        challenger = makeAddr("challenger");
        evaluator1 = makeAddr("evaluator1");
        evaluator2 = makeAddr("evaluator2");
        evaluator3 = makeAddr("evaluator3");
        platformWallet = makeAddr("platform");

        // Deploy contracts
        usdc = new MockUSDC();
        factory = new SessionFactory(address(usdc), platformWallet);
        assessmentManager = new AssessmentManager();

        // Create a session
        vm.prank(creator);
        sessionId = factory.createSession("Test Discourse", wagerAmount, 7 days);

        address poolAddress = factory.getSessionPool(sessionId);
        pool = WagerPool(poolAddress);

        // Register session with AssessmentManager
        assessmentManager.registerSession(sessionId, poolAddress);
    }

    function testRegisterSession() public {
        uint256 newSessionId = 2;
        vm.prank(creator);
        uint256 sid = factory.createSession("New Discourse", wagerAmount, 7 days);

        address poolAddr = factory.getSessionPool(sid);

        assessmentManager.registerSession(newSessionId, poolAddr);

        assertEq(assessmentManager.sessionPools(newSessionId), poolAddr);
    }

    function testCannotRegisterSessionTwice() public {
        vm.expectRevert("Session already registered");
        assessmentManager.registerSession(sessionId, address(pool));
    }

    function testSubmitEvaluation() public {
        vm.prank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        IAssessmentManager.Evaluation memory eval = assessmentManager.getEvaluation(sessionId, evaluator1);

        assertEq(eval.evaluator, evaluator1);
        assertEq(uint8(eval.verdict), uint8(IAssessmentManager.Verdict.Creator));
        assertEq(eval.weight, 100); // BASE_WEIGHT
    }

    function testCannotSubmitEvaluationTwice() public {
        vm.startPrank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.expectRevert("Already evaluated");
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Challenger);
        vm.stopPrank();
    }

    function testCreatorCannotEvaluate() public {
        vm.prank(creator);
        vm.expectRevert("Not eligible");
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);
    }

    function testChallengerCannotEvaluate() public {
        // Fund the pool so challenger is set
        usdc.mint(creator, wagerAmount);
        usdc.mint(challenger, wagerAmount);

        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Now challenger tries to evaluate
        vm.prank(challenger);
        vm.expectRevert("Not eligible");
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Challenger);
    }

    function testMultipleEvaluations() public {
        vm.prank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator2);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator3);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Challenger);

        assertEq(assessmentManager.getEvaluationCount(sessionId), 3);
    }

    function testFinalizeResults() public {
        // Submit minimum evaluations
        vm.prank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator2);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator3);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Challenger);

        // Finalize results
        IAssessmentManager.Verdict verdict = assessmentManager.finalizeResults(sessionId);

        assertEq(uint8(verdict), uint8(IAssessmentManager.Verdict.Creator));

        IAssessmentManager.SessionResult memory result = assessmentManager.getSessionResult(sessionId);
        assertTrue(result.finalized);
        assertEq(result.creatorScore, 200); // 2 evaluators * 100 weight
        assertEq(result.challengerScore, 100); // 1 evaluator * 100 weight
    }

    function testCannotFinalizeWithInsufficientEvaluations() public {
        vm.prank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.expectRevert("Insufficient evaluations");
        assessmentManager.finalizeResults(sessionId);
    }

    function testCannotFinalizeResultsTwice() public {
        // Submit evaluations and finalize
        vm.prank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator2);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator3);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Challenger);

        assessmentManager.finalizeResults(sessionId);

        // Try to finalize again
        vm.expectRevert("Already finalized");
        assessmentManager.finalizeResults(sessionId);
    }

    function testGetSessionEvaluators() public {
        vm.prank(evaluator1);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Creator);

        vm.prank(evaluator2);
        assessmentManager.submitEvaluation(sessionId, IAssessmentManager.Verdict.Challenger);

        address[] memory evaluators = assessmentManager.getSessionEvaluators(sessionId);

        assertEq(evaluators.length, 2);
        assertEq(evaluators[0], evaluator1);
        assertEq(evaluators[1], evaluator2);
    }
}
