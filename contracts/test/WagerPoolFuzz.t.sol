// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/WagerPool.sol";
import "../src/SessionFactory.sol";
import "../src/mocks/MockUSDC.sol";

contract WagerPoolFuzzTest is Test {
    SessionFactory factory;
    MockUSDC usdc;
    address platformWallet;
    address creator;
    address challenger;

    function setUp() public {
        platformWallet = makeAddr("platform");
        creator = makeAddr("creator");
        challenger = makeAddr("challenger");

        usdc = new MockUSDC();
        factory = new SessionFactory(address(usdc), platformWallet);

        // Mint large amounts for fuzzing
        usdc.mint(creator, type(uint128).max);
        usdc.mint(challenger, type(uint128).max);
    }

    /// @notice Fuzz test for creating sessions with various wager amounts
    function testFuzz_CreateSessionWithValidWagers(uint256 wagerAmount) public {
        // Bound to valid range: 5-1000 USDC
        wagerAmount = bound(wagerAmount, 5 * 10 ** 6, 1000 * 10 ** 6);

        vm.prank(creator);
        uint256 sessionId = factory.createSession("Fuzz Test", wagerAmount, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        assertEq(pool.wagerAmount(), wagerAmount);
        assertEq(pool.creator(), creator);
    }

    /// @notice Fuzz test for prize distribution with various wager amounts
    function testFuzz_PrizeDistribution(uint256 wagerAmount) public {
        wagerAmount = bound(wagerAmount, 5 * 10 ** 6, 1000 * 10 ** 6);

        // Create session
        vm.prank(creator);
        uint256 sessionId = factory.createSession("Fuzz Test", wagerAmount, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Both participants deposit
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Start evaluation and complete
        vm.prank(address(factory));
        pool.startEvaluation(3 days);

        vm.warp(block.timestamp + 3 days + 1);

        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);
        uint256 creatorBalanceBefore = usdc.balanceOf(creator);

        vm.prank(address(factory));
        pool.distributePrizes(creator);

        uint256 totalPool = wagerAmount * 2;
        uint256 platformFee = (totalPool * 300) / 10000;
        uint256 evaluatorRewards = (totalPool * 1000) / 10000;
        uint256 victorPrize = totalPool - platformFee - evaluatorRewards;

        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + victorPrize);
    }

    /// @notice Fuzz test for evaluation period durations
    function testFuzz_EvaluationPeriod(uint256 duration) public {
        // Bound to reasonable range: 1 hour to 30 days
        duration = bound(duration, 1 hours, 30 days);

        uint256 wagerAmount = 50 * 10 ** 6;

        vm.prank(creator);
        uint256 sessionId = factory.createSession("Fuzz Test", wagerAmount, duration);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Set up session to Active state
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Start evaluation
        vm.prank(address(factory));
        pool.startEvaluation(duration);

        assertEq(pool.evaluationEndTime(), block.timestamp + duration);

        // Try to distribute before time ends (should fail)
        vm.warp(block.timestamp + duration - 1);
        vm.prank(address(factory));
        vm.expectRevert();
        pool.distributePrizes(creator);

        // Try after time ends (should succeed)
        vm.warp(block.timestamp + 2);
        vm.prank(address(factory));
        pool.distributePrizes(creator);

        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Completed));
    }

    /// @notice Fuzz test for evaluator rewards sent to owner
    function testFuzz_EvaluatorRewardsToOwner(uint256 wagerAmount) public {
        wagerAmount = bound(wagerAmount, 5 * 10 ** 6, 1000 * 10 ** 6);

        // Create and complete session
        vm.prank(creator);
        uint256 sessionId = factory.createSession("Fuzz Test", wagerAmount, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        vm.prank(address(factory));
        pool.startEvaluation(3 days);

        vm.warp(block.timestamp + 3 days + 1);

        vm.prank(address(factory));
        pool.distributePrizes(creator);

        // Verify evaluator rewards sent to owner
        uint256 totalPool = wagerAmount * 2;
        uint256 expectedRewards = (totalPool * 1000) / 10000;

        assertEq(usdc.balanceOf(address(factory)), expectedRewards);
    }

    /// @notice Fuzz test that invalid wager amounts are rejected
    function testFuzz_RejectInvalidWagers(uint256 wagerAmount) public {
        // Test amounts outside valid range
        vm.assume(wagerAmount < 5 * 10 ** 6 || wagerAmount > 1000 * 10 ** 6);

        vm.prank(creator);
        vm.expectRevert();
        factory.createSession("Fuzz Test", wagerAmount, 3 days);
    }

    /// @notice Fuzz test for cancellation with refunds
    function testFuzz_CancellationRefunds(uint256 wagerAmount, bool bothDeposited) public {
        wagerAmount = bound(wagerAmount, 5 * 10 ** 6, 1000 * 10 ** 6);

        vm.prank(creator);
        uint256 sessionId = factory.createSession("Fuzz Test", wagerAmount, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Creator deposits
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);
        uint256 challengerBalanceBefore = usdc.balanceOf(challenger);

        // Conditionally have challenger deposit
        if (bothDeposited) {
            vm.startPrank(challenger);
            usdc.approve(address(pool), wagerAmount);
            pool.depositWager(challenger);
            vm.stopPrank();

            challengerBalanceBefore = usdc.balanceOf(challenger);
        }

        // Cancel session
        vm.prank(address(factory));
        pool.cancelSession();

        // Verify refunds
        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + wagerAmount);

        if (bothDeposited) {
            assertEq(usdc.balanceOf(challenger), challengerBalanceBefore + wagerAmount);
        }
    }
}
