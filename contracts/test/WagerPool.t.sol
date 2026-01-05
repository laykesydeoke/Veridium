// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/WagerPool.sol";
import "../src/mocks/MockUSDC.sol";

contract WagerPoolTest is Test {
    WagerPool pool;
    MockUSDC usdc;
    address owner;
    address creator;
    address challenger;
    address platformWallet;
    address evaluator1;
    address evaluator2;

    uint256 wagerAmount = 50 * 10 ** 6; // 50 USDC
    uint256 evaluationPeriod = 7 days;

    event WagerDeposited(address indexed participant, uint256 amount);
    event SessionStatusChanged(IWagerPool.SessionStatus indexed newStatus);
    event PrizesDistributed(address indexed victor, uint256 prizeAmount);
    event EvaluatorRewarded(address indexed evaluator, uint256 amount);
    event SessionCancelled();

    function setUp() public {
        owner = makeAddr("owner");
        creator = makeAddr("creator");
        challenger = makeAddr("challenger");
        platformWallet = makeAddr("platform");
        evaluator1 = makeAddr("evaluator1");
        evaluator2 = makeAddr("evaluator2");

        // Deploy contracts
        usdc = new MockUSDC();

        vm.prank(owner);
        pool = new WagerPool(1, creator, wagerAmount, address(usdc), platformWallet);

        // Mint USDC to participants
        usdc.mint(creator, 1000 * 10 ** 6);
        usdc.mint(challenger, 1000 * 10 ** 6);
    }

    // ============ Basic Deposit Tests ============

    function testDepositWagerCreator() public {
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);

        vm.expectEmit(true, false, false, true);
        emit WagerDeposited(creator, wagerAmount);

        pool.depositWager(creator);
        vm.stopPrank();

        assertEq(pool.getPrizePool(), wagerAmount);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Pending));
    }

    function testDepositWagerBothParticipants() public {
        // Creator deposits
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        // Challenger deposits
        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);

        vm.expectEmit(true, false, false, true);
        emit SessionStatusChanged(IWagerPool.SessionStatus.Active);

        pool.depositWager(challenger);
        vm.stopPrank();

        assertEq(pool.getPrizePool(), wagerAmount * 2);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Active));
        assertEq(pool.challenger(), challenger);
    }

    function testCannotDepositWithoutApproval() public {
        vm.startPrank(creator);
        vm.expectRevert();
        pool.depositWager(creator);
        vm.stopPrank();
    }

    function testCannotDepositWhenNotPending() public {
        // Set up both participants
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Try to deposit again (status is now Active)
        address thirdParty = makeAddr("third");
        usdc.mint(thirdParty, wagerAmount);

        vm.startPrank(thirdParty);
        usdc.approve(address(pool), wagerAmount);
        vm.expectRevert();
        pool.depositWager(thirdParty);
        vm.stopPrank();
    }

    function testCannotDepositInsufficientBalance() public {
        address poorUser = makeAddr("poor");
        usdc.mint(poorUser, wagerAmount - 1);

        vm.startPrank(poorUser);
        usdc.approve(address(pool), wagerAmount);
        vm.expectRevert();
        pool.depositWager(poorUser);
        vm.stopPrank();
    }

    // ============ Evaluation Period Tests ============

    function testStartEvaluationPeriod() public {
        // Set up session
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Start evaluation
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit SessionStatusChanged(IWagerPool.SessionStatus.Evaluating);

        pool.startEvaluation(evaluationPeriod);

        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Evaluating));
        assertEq(pool.evaluationEndTime(), block.timestamp + evaluationPeriod);
    }

    function testCannotStartEvaluationWhenNotActive() public {
        vm.prank(owner);
        vm.expectRevert();
        pool.startEvaluation(evaluationPeriod);
    }

    function testCannotStartEvaluationUnauthorized() public {
        // Set up session
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Try to start evaluation as non-owner
        vm.prank(creator);
        vm.expectRevert();
        pool.startEvaluation(evaluationPeriod);
    }

    // ============ Prize Distribution Tests ============

    function testDistributePrizesCreatorWins() public {
        _setupCompletedSession();

        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);
        uint256 creatorBalanceBefore = usdc.balanceOf(creator);

        vm.prank(owner);
        pool.distributePrizes(creator);

        uint256 totalPool = wagerAmount * 2;
        uint256 platformFee = (totalPool * 300) / 10000; // 3%
        uint256 evaluatorRewards = (totalPool * 1000) / 10000; // 10%
        uint256 victorPrize = totalPool - platformFee - evaluatorRewards;

        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + victorPrize);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Completed));
    }

    function testDistributePrizesChallengerWins() public {
        _setupCompletedSession();

        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);
        uint256 challengerBalanceBefore = usdc.balanceOf(challenger);

        vm.prank(owner);
        pool.distributePrizes(challenger);

        uint256 totalPool = wagerAmount * 2;
        uint256 platformFee = (totalPool * 300) / 10000; // 3%
        uint256 evaluatorRewards = (totalPool * 1000) / 10000; // 10%
        uint256 victorPrize = totalPool - platformFee - evaluatorRewards;

        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
        assertEq(usdc.balanceOf(challenger), challengerBalanceBefore + victorPrize);
    }

    function testCannotDistributePrizesWhenNotEvaluating() public {
        vm.prank(owner);
        vm.expectRevert();
        pool.distributePrizes(creator);
    }

    function testCannotDistributePrizesBeforeEvaluationEnds() public {
        _setupCompletedSession();

        // Try to distribute before time passes
        vm.warp(block.timestamp + evaluationPeriod - 1);

        vm.prank(owner);
        vm.expectRevert();
        pool.distributePrizes(creator);
    }

    function testCannotDistributePrizesUnauthorized() public {
        _setupCompletedSession();

        vm.prank(creator);
        vm.expectRevert();
        pool.distributePrizes(creator);
    }

    function testCannotDistributePrizesToInvalidVictor() public {
        _setupCompletedSession();

        address randomUser = makeAddr("random");

        vm.prank(owner);
        vm.expectRevert();
        pool.distributePrizes(randomUser);
    }

    // ============ Evaluator Rewards Tests ============



    // ============ Cancellation Tests ============

    function testCancelSession() public {
        // Only creator deposits
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);

        vm.prank(owner);
        vm.expectEmit(false, false, false, false);
        emit SessionCancelled();

        pool.cancelSession();

        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Cancelled));
        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + wagerAmount);
    }

    function testCancelSessionBothParticipants() public {
        // Both participants deposit
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);
        uint256 challengerBalanceBefore = usdc.balanceOf(challenger);

        vm.prank(owner);
        pool.cancelSession();

        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + wagerAmount);
        assertEq(usdc.balanceOf(challenger), challengerBalanceBefore + wagerAmount);
    }

    function testCannotCancelCompletedSession() public {
        _setupCompletedSession();

        vm.prank(owner);
        pool.distributePrizes(creator);

        vm.prank(owner);
        vm.expectRevert();
        pool.cancelSession();
    }

    // ============ Helper Functions ============

    function _setupCompletedSession() internal {
        // Both participants deposit
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Start evaluation
        vm.prank(owner);
        pool.startEvaluation(evaluationPeriod);

        // Fast forward past evaluation period
        vm.warp(block.timestamp + evaluationPeriod + 1);
    }
}
