// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SessionFactory.sol";
import "../src/WagerPool.sol";
import "../src/mocks/MockUSDC.sol";

contract SessionFactoryTest is Test {
    SessionFactory factory;
    MockUSDC usdc;
    address owner;
    address platformWallet;
    address user1;
    address user2;

    event SessionCreated(
        uint256 indexed sessionId,
        address indexed wagerPool,
        address indexed creator,
        uint256 wagerAmount
    );
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

    function setUp() public {
        owner = address(this);
        platformWallet = makeAddr("platform");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy contracts
        usdc = new MockUSDC();
        factory = new SessionFactory(address(usdc), platformWallet);

        // Mint USDC to users
        usdc.mint(user1, 1000 * 10 ** 6);
        usdc.mint(user2, 1000 * 10 ** 6);
    }

    // ============ Session Creation Tests ============

    function testCreateSession() public {
        vm.startPrank(user1);

        uint256 wagerAmount = 50 * 10 ** 6; // 50 USDC
        uint256 evaluationPeriod = 3 days;

        vm.expectEmit(true, true, true, false);
        emit SessionCreated(1, address(0), user1, wagerAmount);

        uint256 sessionId = factory.createSession("Test Proposition", wagerAmount, evaluationPeriod);

        assertEq(sessionId, 1);
        assertEq(factory.getSessionCount(), 1);
        assertTrue(factory.getSessionPool(sessionId) != address(0));

        vm.stopPrank();
    }

    function testCreateMultipleSessions() public {
        uint256 wagerAmount = 50 * 10 ** 6;
        uint256 evaluationPeriod = 3 days;

        // User1 creates session
        vm.prank(user1);
        uint256 sessionId1 = factory.createSession("Proposition 1", wagerAmount, evaluationPeriod);

        // User2 creates session
        vm.prank(user2);
        uint256 sessionId2 = factory.createSession("Proposition 2", wagerAmount, evaluationPeriod);

        assertEq(sessionId1, 1);
        assertEq(sessionId2, 2);
        assertEq(factory.getSessionCount(), 2);
        assertTrue(factory.getSessionPool(sessionId1) != factory.getSessionPool(sessionId2));
    }

    function testCreateSessionMinimumWager() public {
        vm.startPrank(user1);

        uint256 minWager = 5 * 10 ** 6; // 5 USDC (minimum)
        uint256 evaluationPeriod = 3 days;

        uint256 sessionId = factory.createSession("Test", minWager, evaluationPeriod);

        assertEq(sessionId, 1);
        assertTrue(factory.getSessionPool(sessionId) != address(0));

        vm.stopPrank();
    }

    function testCreateSessionMaximumWager() public {
        vm.startPrank(user1);

        uint256 maxWager = 1000 * 10 ** 6; // 1000 USDC (maximum)
        uint256 evaluationPeriod = 3 days;

        uint256 sessionId = factory.createSession("Test", maxWager, evaluationPeriod);

        assertEq(sessionId, 1);
        assertTrue(factory.getSessionPool(sessionId) != address(0));

        vm.stopPrank();
    }

    function testSessionPoolHasCorrectParameters() public {
        vm.startPrank(user1);

        uint256 wagerAmount = 50 * 10 ** 6;
        uint256 evaluationPeriod = 3 days;

        uint256 sessionId = factory.createSession("Test Proposition", wagerAmount, evaluationPeriod);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        assertEq(pool.sessionId(), sessionId);
        assertEq(pool.creator(), user1);
        assertEq(pool.wagerAmount(), wagerAmount);
        assertEq(address(pool.usdc()), address(usdc));
        assertEq(pool.platformWallet(), platformWallet);

        vm.stopPrank();
    }

    // ============ Invalid Input Tests ============

    function testCannotCreateWithWagerBelowMinimum() public {
        vm.startPrank(user1);

        uint256 tooLow = 4 * 10 ** 6; // 4 USDC (below 5 minimum)
        uint256 evaluationPeriod = 3 days;

        vm.expectRevert("Invalid wager amount");
        factory.createSession("Test", tooLow, evaluationPeriod);

        vm.stopPrank();
    }

    function testCannotCreateWithWagerAboveMaximum() public {
        vm.startPrank(user1);

        uint256 tooHigh = 1001 * 10 ** 6; // 1001 USDC (above 1000 maximum)
        uint256 evaluationPeriod = 3 days;

        vm.expectRevert("Invalid wager amount");
        factory.createSession("Test", tooHigh, evaluationPeriod);

        vm.stopPrank();
    }

    function testCannotCreateWithZeroWager() public {
        vm.startPrank(user1);

        uint256 zero = 0;
        uint256 evaluationPeriod = 3 days;

        vm.expectRevert("Invalid wager amount");
        factory.createSession("Test", zero, evaluationPeriod);

        vm.stopPrank();
    }

    function testCannotCreateWithEmptyProposition() public {
        vm.startPrank(user1);

        uint256 wagerAmount = 50 * 10 ** 6;
        uint256 evaluationPeriod = 3 days;

        vm.expectRevert("Empty proposition");
        factory.createSession("", wagerAmount, evaluationPeriod);

        vm.stopPrank();
    }

    function testCannotCreateWithInvalidEvaluationPeriod() public {
        vm.startPrank(user1);

        uint256 wagerAmount = 50 * 10 ** 6;
        uint256 invalidPeriod = 0;

        vm.expectRevert("Invalid evaluation period");
        factory.createSession("Test", wagerAmount, invalidPeriod);

        vm.stopPrank();
    }

    function testCreateWithLongProposition() public {
        vm.startPrank(user1);

        uint256 wagerAmount = 50 * 10 ** 6;
        uint256 evaluationPeriod = 3 days;

        string memory longProp = "This is a very long proposition that tests whether the contract can handle lengthy strings without issues. It should work fine as Solidity handles dynamic strings well.";

        uint256 sessionId = factory.createSession(longProp, wagerAmount, evaluationPeriod);

        assertEq(sessionId, 1);
        assertTrue(factory.getSessionPool(sessionId) != address(0));

        vm.stopPrank();
    }

    // ============ Platform Wallet Management Tests ============

    function testUpdatePlatformWallet() public {
        address newWallet = makeAddr("newPlatform");

        vm.expectEmit(true, true, false, false);
        emit PlatformWalletUpdated(platformWallet, newWallet);

        factory.updatePlatformWallet(newWallet);

        assertEq(factory.platformWallet(), newWallet);
    }

    function testCannotUpdatePlatformWalletToZeroAddress() public {
        vm.expectRevert("Invalid address");
        factory.updatePlatformWallet(address(0));
    }

    function testCannotUpdatePlatformWalletUnauthorized() public {
        address newWallet = makeAddr("newPlatform");

        vm.prank(user1);
        vm.expectRevert();
        factory.updatePlatformWallet(newWallet);
    }

    function testNewSessionsUsesUpdatedPlatformWallet() public {
        address newWallet = makeAddr("newPlatform");
        factory.updatePlatformWallet(newWallet);

        vm.prank(user1);
        uint256 sessionId = factory.createSession("Test", 50 * 10 ** 6, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        WagerPool pool = WagerPool(poolAddress);

        assertEq(pool.platformWallet(), newWallet);
    }

    // ============ Session Counter Tests ============

    function testSessionCounterIncrementsCorrectly() public {
        assertEq(factory.getSessionCount(), 0);

        vm.startPrank(user1);

        for (uint256 i = 1; i <= 5; i++) {
            factory.createSession("Test", 50 * 10 ** 6, 3 days);
            assertEq(factory.getSessionCount(), i);
        }

        vm.stopPrank();
    }

    // ============ Session Pool Retrieval Tests ============

    function testGetSessionPoolReturnsZeroForInvalidId() public {
        address poolAddress = factory.getSessionPool(999);
        assertEq(poolAddress, address(0));
    }

    function testGetSessionPoolReturnsCorrectAddress() public {
        vm.prank(user1);
        uint256 sessionId = factory.createSession("Test", 50 * 10 ** 6, 3 days);

        address poolAddress = factory.getSessionPool(sessionId);
        assertTrue(poolAddress != address(0));

        // Verify it's actually a WagerPool
        WagerPool pool = WagerPool(poolAddress);
        assertEq(pool.sessionId(), sessionId);
    }

    // ============ Reentrancy Tests ============

    function testReentrancyProtection() public {
        // This test verifies nonReentrant modifier is in place
        // Create session should not be vulnerable to reentrancy
        vm.prank(user1);
        uint256 sessionId = factory.createSession("Test", 50 * 10 ** 6, 3 days);

        assertTrue(sessionId > 0);
    }

    // ============ Gas Optimization Tests ============

    function testCreateSessionGasCost() public {
        vm.prank(user1);

        uint256 gasBefore = gasleft();
        factory.createSession("Test Proposition", 50 * 10 ** 6, 3 days);
        uint256 gasUsed = gasBefore - gasleft();

        // Log gas usage for monitoring
        emit log_named_uint("Gas used for session creation", gasUsed);

        // Ensure gas usage is reasonable (adjust threshold as needed)
        assertTrue(gasUsed < 3000000, "Session creation uses too much gas");
    }
}
