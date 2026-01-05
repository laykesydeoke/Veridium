// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CredibilityRegistry.sol";

/// @title CredibilityRegistry Tests
/// @notice Comprehensive tests for CredibilityRegistry contract
contract CredibilityRegistryTest is Test {
    CredibilityRegistry registry;

    address owner;
    address user1;
    address user2;
    address updater;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        updater = makeAddr("updater");

        registry = new CredibilityRegistry();
        registry.addAuthorizedUpdater(updater);
    }

    function testInitialState() public view {
        assertEq(registry.getActiveUserCount(), 0);
        assertTrue(registry.authorizedUpdaters(owner));
        assertTrue(registry.authorizedUpdaters(updater));
    }

    function testUpdateCredibility() public {
        vm.prank(updater);
        registry.updateCredibility(user1, 50, 1, "First session");

        ICredibilityRegistry.CredibilityScore memory score = registry.getCredibility(user1);
        assertEq(score.totalScore, 50);
        assertTrue(score.isActive);
        assertEq(registry.getActiveUserCount(), 1);
    }

    function testUpdateCredibilityNegative() public {
        vm.startPrank(updater);
        registry.updateCredibility(user1, 100, 1, "Increase");
        registry.updateCredibility(user1, -30, 2, "Decrease");
        vm.stopPrank();

        ICredibilityRegistry.CredibilityScore memory score = registry.getCredibility(user1);
        assertEq(score.totalScore, 70);
    }

    function testCannotUpdateWithoutAuth() public {
        vm.prank(user1);
        vm.expectRevert("Not authorized");
        registry.updateCredibility(user2, 50, 1, "Test");
    }

    function testRecordSessionParticipation() public {
        vm.prank(updater);
        registry.recordSessionParticipation(user1, 1, true);

        ICredibilityRegistry.CredibilityScore memory score = registry.getCredibility(user1);
        assertEq(score.sessionsParticipated, 1);
        assertEq(score.sessionsWon, 1);
    }

    function testRecordSessionLoss() public {
        vm.prank(updater);
        registry.recordSessionParticipation(user1, 1, false);

        ICredibilityRegistry.CredibilityScore memory score = registry.getCredibility(user1);
        assertEq(score.sessionsParticipated, 1);
        assertEq(score.sessionsWon, 0);
    }

    function testRecordEvaluation() public {
        vm.prank(updater);
        registry.recordEvaluation(user1, 1, true);

        ICredibilityRegistry.CredibilityScore memory score = registry.getCredibility(user1);
        assertEq(score.evaluationsSubmitted, 1);
        assertEq(score.evaluationsCorrect, 1);
    }

    function testRecordIncorrectEvaluation() public {
        vm.prank(updater);
        registry.recordEvaluation(user1, 1, false);

        ICredibilityRegistry.CredibilityScore memory score = registry.getCredibility(user1);
        assertEq(score.evaluationsSubmitted, 1);
        assertEq(score.evaluationsCorrect, 0);
    }

    function testGetEvaluatorWeight() public {
        vm.prank(updater);
        registry.updateCredibility(user1, 150, 1, "Build credibility");

        uint256 weight = registry.getEvaluatorWeight(user1);
        assertEq(weight, 250); // BASE_WEIGHT (100) + 150
    }

    function testEvaluatorWeightCap() public {
        vm.prank(updater);
        registry.updateCredibility(user1, 2000, 1, "High credibility");

        uint256 weight = registry.getEvaluatorWeight(user1);
        assertEq(weight, 1000); // Capped at MAX_WEIGHT
    }

    function testIsEligibleEvaluator() public {
        assertFalse(registry.isEligibleEvaluator(user1));

        vm.prank(updater);
        registry.updateCredibility(user1, 50, 1, "Reach minimum");

        assertTrue(registry.isEligibleEvaluator(user1));
    }

    function testGetHistory() public {
        vm.startPrank(updater);
        registry.updateCredibility(user1, 50, 1, "First");
        registry.updateCredibility(user1, 30, 2, "Second");
        vm.stopPrank();

        ICredibilityRegistry.CredibilityHistory[] memory history = registry.getHistory(user1);
        assertEq(history.length, 2);
        assertEq(history[0].scoreChange, 50);
        assertEq(history[1].scoreChange, 30);
    }

    function testMultipleUsers() public {
        vm.startPrank(updater);
        registry.updateCredibility(user1, 100, 1, "User1");
        registry.updateCredibility(user2, 200, 2, "User2");
        vm.stopPrank();

        assertEq(registry.getActiveUserCount(), 2);
    }

    function testGetEvaluatorAccuracy() public {
        vm.startPrank(updater);
        registry.recordEvaluation(user1, 1, true);
        registry.recordEvaluation(user1, 2, true);
        registry.recordEvaluation(user1, 3, false);
        vm.stopPrank();

        uint256 accuracy = registry.getEvaluatorAccuracy(user1);
        assertEq(accuracy, 66); // 2/3 * 100 = 66
    }

    function testGetWinRate() public {
        vm.startPrank(updater);
        registry.recordSessionParticipation(user1, 1, true);
        registry.recordSessionParticipation(user1, 2, false);
        registry.recordSessionParticipation(user1, 3, true);
        vm.stopPrank();

        uint256 winRate = registry.getWinRate(user1);
        assertEq(winRate, 66); // 2/3 * 100 = 66
    }

    function testAddAuthorizedUpdater() public {
        address newUpdater = makeAddr("newUpdater");
        registry.addAuthorizedUpdater(newUpdater);
        assertTrue(registry.authorizedUpdaters(newUpdater));
    }

    function testRemoveAuthorizedUpdater() public {
        registry.removeAuthorizedUpdater(updater);
        assertFalse(registry.authorizedUpdaters(updater));
    }

    function testCannotAddZeroAddressUpdater() public {
        vm.expectRevert("Invalid updater");
        registry.addAuthorizedUpdater(address(0));
    }
}
