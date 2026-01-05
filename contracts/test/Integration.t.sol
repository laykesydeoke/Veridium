// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SessionFactory.sol";
import "../src/WagerPool.sol";
import "../src/mocks/MockUSDC.sol";

/// @title Integration Tests
/// @notice End-to-end tests for complete session workflows
contract IntegrationTest is Test {
    SessionFactory factory;
    MockUSDC usdc;
    address owner;
    address platformWallet;
    address creator;
    address challenger;
    address evaluator1;
    address evaluator2;
    address evaluator3;

    uint256 constant WAGER_AMOUNT = 100 * 10 ** 6; // 100 USDC
    uint256 constant EVALUATION_PERIOD = 7 days;

    function setUp() public {
        owner = address(this);
        platformWallet = makeAddr("platform");
        creator = makeAddr("creator");
        challenger = makeAddr("challenger");
        evaluator1 = makeAddr("evaluator1");
        evaluator2 = makeAddr("evaluator2");
        evaluator3 = makeAddr("evaluator3");

        // Deploy contracts
        usdc = new MockUSDC();
        factory = new SessionFactory(address(usdc), platformWallet);

        // Mint USDC to participants
        usdc.mint(creator, 10000 * 10 ** 6);
        usdc.mint(challenger, 10000 * 10 ** 6);
    }

    /// @notice Test complete successful session flow with creator winning
    function test_FullSessionFlow_CreatorWins() public {
        // 1. Creator creates session
        vm.prank(creator);
        uint256 sessionId = factory.createSession(
            "AI will achieve AGI by 2030",
            WAGER_AMOUNT,
            EVALUATION_PERIOD
        );

        assertEq(sessionId, 1);
        assertEq(factory.getSessionCount(), 1);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // 2. Creator deposits wager
        vm.startPrank(creator);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(creator);
        vm.stopPrank();

        assertEq(pool.getPrizePool(), WAGER_AMOUNT);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Pending));

        // 3. Challenger deposits wager
        vm.startPrank(challenger);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(challenger);
        vm.stopPrank();

        assertEq(pool.getPrizePool(), WAGER_AMOUNT * 2);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Active));

        // 4. Backend starts evaluation period
        vm.prank(owner);
        pool.startEvaluationPeriod(EVALUATION_PERIOD);

        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Evaluating));
        assertEq(pool.evaluationEndTime(), block.timestamp + EVALUATION_PERIOD);

        // 5. Fast forward past evaluation period
        vm.warp(block.timestamp + EVALUATION_PERIOD + 1);

        // 6. Distribute prizes (creator wins)
        uint256 creatorBalanceBefore = usdc.balanceOf(creator);
        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);

        vm.prank(owner);
        pool.distributePrizes(creator);

        uint256 totalPool = WAGER_AMOUNT * 2;
        uint256 platformFee = (totalPool * 300) / 10000; // 3%
        uint256 evaluatorRewards = (totalPool * 1000) / 10000; // 10%
        uint256 victorPrize = totalPool - platformFee - evaluatorRewards;

        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + victorPrize);
        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Completed));

        // 7. Distribute evaluator rewards
        address[] memory evaluators = new address[](3);
        evaluators[0] = evaluator1;
        evaluators[1] = evaluator2;
        evaluators[2] = evaluator3;

        vm.prank(owner);
        pool.distributeEvaluatorRewards(evaluators);

        uint256 rewardPerEvaluator = evaluatorRewards / 3;

        assertApproxEqAbs(usdc.balanceOf(evaluator1), rewardPerEvaluator, 3);
        assertApproxEqAbs(usdc.balanceOf(evaluator2), rewardPerEvaluator, 3);
        assertApproxEqAbs(usdc.balanceOf(evaluator3), rewardPerEvaluator, 3);
    }

    /// @notice Test complete successful session flow with challenger winning
    function test_FullSessionFlow_ChallengerWins() public {
        // Create and setup session
        vm.prank(creator);
        uint256 sessionId = factory.createSession(
            "Bitcoin will reach $1M by 2025",
            WAGER_AMOUNT,
            EVALUATION_PERIOD
        );

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Both deposit
        vm.startPrank(creator);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(challenger);
        vm.stopPrank();

        // Start evaluation
        vm.prank(owner);
        pool.startEvaluationPeriod(EVALUATION_PERIOD);

        vm.warp(block.timestamp + EVALUATION_PERIOD + 1);

        // Challenger wins
        uint256 challengerBalanceBefore = usdc.balanceOf(challenger);
        uint256 platformBalanceBefore = usdc.balanceOf(platformWallet);

        vm.prank(owner);
        pool.distributePrizes(challenger);

        uint256 totalPool = WAGER_AMOUNT * 2;
        uint256 platformFee = (totalPool * 300) / 10000;
        uint256 evaluatorRewards = (totalPool * 1000) / 10000;
        uint256 victorPrize = totalPool - platformFee - evaluatorRewards;

        assertEq(usdc.balanceOf(challenger), challengerBalanceBefore + victorPrize);
        assertEq(usdc.balanceOf(platformWallet), platformBalanceBefore + platformFee);
    }

    /// @notice Test session cancellation flow
    function test_FullSessionFlow_Cancellation() public {
        // Create session
        vm.prank(creator);
        uint256 sessionId = factory.createSession(
            "The metaverse will replace physical offices",
            WAGER_AMOUNT,
            EVALUATION_PERIOD
        );

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Only creator deposits
        vm.startPrank(creator);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(creator);
        vm.stopPrank();

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);

        // Session gets cancelled (no challenger joined)
        vm.prank(owner);
        pool.cancelSession();

        // Creator gets full refund
        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + WAGER_AMOUNT);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Cancelled));
    }

    /// @notice Test multiple concurrent sessions
    function test_MultipleConcurrentSessions() public {
        address user3 = makeAddr("user3");
        address user4 = makeAddr("user4");

        usdc.mint(user3, 1000 * 10 ** 6);
        usdc.mint(user4, 1000 * 10 ** 6);

        // Create 3 different sessions
        vm.prank(creator);
        uint256 session1 = factory.createSession("Proposition 1", 50 * 10 ** 6, 3 days);

        vm.prank(user3);
        uint256 session2 = factory.createSession("Proposition 2", 75 * 10 ** 6, 5 days);

        vm.prank(user4);
        uint256 session3 = factory.createSession("Proposition 3", 100 * 10 ** 6, 7 days);

        assertEq(factory.getSessionCount(), 3);
        assertTrue(factory.getSessionPool(session1) != factory.getSessionPool(session2));
        assertTrue(factory.getSessionPool(session2) != factory.getSessionPool(session3));

        // Each session operates independently
        WagerPool pool1 = WagerPool(factory.getSessionPool(session1));
        WagerPool pool2 = WagerPool(factory.getSessionPool(session2));
        WagerPool pool3 = WagerPool(factory.getSessionPool(session3));

        assertEq(pool1.wagerAmount(), 50 * 10 ** 6);
        assertEq(pool2.wagerAmount(), 75 * 10 ** 6);
        assertEq(pool3.wagerAmount(), 100 * 10 ** 6);

        assertEq(pool1.creator(), creator);
        assertEq(pool2.creator(), user3);
        assertEq(pool3.creator(), user4);
    }

    /// @notice Test platform wallet update affects new sessions
    function test_PlatformWalletUpdate() public {
        address newPlatformWallet = makeAddr("newPlatform");

        // Create session with original platform wallet
        vm.prank(creator);
        uint256 session1 = factory.createSession("Before update", 50 * 10 ** 6, 3 days);

        WagerPool pool1 = WagerPool(factory.getSessionPool(session1));
        assertEq(pool1.platformWallet(), platformWallet);

        // Update platform wallet
        factory.updatePlatformWallet(newPlatformWallet);

        // Create session with new platform wallet
        vm.prank(creator);
        uint256 session2 = factory.createSession("After update", 50 * 10 ** 6, 3 days);

        WagerPool pool2 = WagerPool(factory.getSessionPool(session2));
        assertEq(pool2.platformWallet(), newPlatformWallet);

        // Old session still uses old platform wallet
        assertEq(pool1.platformWallet(), platformWallet);
    }

    /// @notice Test session with minimum wager amount
    function test_MinimumWagerSession() public {
        uint256 minWager = 5 * 10 ** 6; // 5 USDC

        vm.prank(creator);
        uint256 sessionId = factory.createSession("Minimum wager test", minWager, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Complete full flow with minimum wager
        vm.startPrank(creator);
        usdc.approve(address(pool), minWager);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), minWager);
        pool.depositWager(challenger);
        vm.stopPrank();

        vm.prank(owner);
        pool.startEvaluationPeriod(3 days);

        vm.warp(block.timestamp + 3 days + 1);

        vm.prank(owner);
        pool.distributePrizes(creator);

        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Completed));
    }

    /// @notice Test session with maximum wager amount
    function test_MaximumWagerSession() public {
        uint256 maxWager = 1000 * 10 ** 6; // 1000 USDC

        vm.prank(creator);
        uint256 sessionId = factory.createSession("Maximum wager test", maxWager, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Complete full flow with maximum wager
        vm.startPrank(creator);
        usdc.approve(address(pool), maxWager);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), maxWager);
        pool.depositWager(challenger);
        vm.stopPrank();

        vm.prank(owner);
        pool.startEvaluationPeriod(3 days);

        vm.warp(block.timestamp + 3 days + 1);

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);

        vm.prank(owner);
        pool.distributePrizes(creator);

        // Verify large amounts are handled correctly
        uint256 totalPool = maxWager * 2;
        uint256 platformFee = (totalPool * 300) / 10000;
        uint256 evaluatorRewards = (totalPool * 1000) / 10000;
        uint256 victorPrize = totalPool - platformFee - evaluatorRewards;

        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + victorPrize);
    }

    /// @notice Test cancellation after both participants deposited
    function test_CancellationWithBothDeposits() public {
        vm.prank(creator);
        uint256 sessionId = factory.createSession("Cancellation test", WAGER_AMOUNT, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        // Both deposit
        vm.startPrank(creator);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(creator);
        vm.stopPrank();

        vm.startPrank(challenger);
        usdc.approve(address(pool), WAGER_AMOUNT);
        pool.depositWager(challenger);
        vm.stopPrank();

        uint256 creatorBalanceBefore = usdc.balanceOf(creator);
        uint256 challengerBalanceBefore = usdc.balanceOf(challenger);

        // Cancel session
        vm.prank(owner);
        pool.cancelSession();

        // Both get refunds
        assertEq(usdc.balanceOf(creator), creatorBalanceBefore + WAGER_AMOUNT);
        assertEq(usdc.balanceOf(challenger), challengerBalanceBefore + WAGER_AMOUNT);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Cancelled));
    }
}
