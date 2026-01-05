// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SessionFactory.sol";
import "../src/WagerPool.sol";
import "../src/mocks/MockUSDC.sol";

contract SessionFactoryTest is Test {
    SessionFactory factory;
    MockUSDC usdc;
    address platformWallet;
    address user1;
    address user2;

    function setUp() public {
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

    function testCreateSession() public {
        vm.startPrank(user1);

        uint256 wagerAmount = 50 * 10 ** 6; // 50 USDC
        uint256 evaluationPeriod = 3 days;

        uint256 sessionId = factory.createSession("Test Proposition", wagerAmount, evaluationPeriod);

        assertEq(sessionId, 1);
        assertEq(factory.getSessionCount(), 1);
        assertTrue(factory.getSessionPool(sessionId) != address(0));

        vm.stopPrank();
    }

    function testCannotCreateWithInvalidWager() public {
        vm.startPrank(user1);

        uint256 tooLow = 1 * 10 ** 6; // 1 USDC (below minimum)
        uint256 evaluationPeriod = 3 days;

        vm.expectRevert("Invalid wager amount");
        factory.createSession("Test", tooLow, evaluationPeriod);

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
}
