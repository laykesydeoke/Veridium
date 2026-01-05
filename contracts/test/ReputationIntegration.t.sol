// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/CredibilityRegistry.sol";
import "../src/AchievementNFT.sol";
import "../src/libraries/AchievementUnlocker.sol";

/// @title Reputation Integration Tests
/// @notice Tests for CredibilityRegistry and AchievementNFT integration
contract ReputationIntegrationTest is Test {
    CredibilityRegistry credibilityRegistry;
    AchievementNFT achievementNFT;

    address owner;
    address user1;
    address user2;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        credibilityRegistry = new CredibilityRegistry();
        achievementNFT = new AchievementNFT("Veridium Achievements", "VACH");

        // Set up authorizations
        achievementNFT.addAuthorizedMinter(address(credibilityRegistry));
        credibilityRegistry.addAuthorizedUpdater(owner);
    }

    function testCredibilityAffectsEvaluatorWeight() public {
        // Initial weight should be BASE_WEIGHT (100)
        assertEq(credibilityRegistry.getEvaluatorWeight(user1), 100);

        // Add credibility
        credibilityRegistry.updateCredibility(user1, 200, 1, "Participation");

        // Weight should increase
        assertEq(credibilityRegistry.getEvaluatorWeight(user1), 300); // 100 + 200
    }

    function testAchievementUnlockingFirstSession() public {
        // User doesn't qualify initially
        assertFalse(AchievementUnlocker.qualifiesForFirstSession(credibilityRegistry, user1));

        // Record session participation
        credibilityRegistry.recordSessionParticipation(user1, 1, false);

        // Now qualifies
        assertTrue(AchievementUnlocker.qualifiesForFirstSession(credibilityRegistry, user1));
    }

    function testAchievementUnlockingFirstWin() public {
        assertFalse(AchievementUnlocker.qualifiesForFirstWin(credibilityRegistry, user1));

        credibilityRegistry.recordSessionParticipation(user1, 1, true);

        assertTrue(AchievementUnlocker.qualifiesForFirstWin(credibilityRegistry, user1));
    }

    function testMultipleAchievementUnlocking() public {
        // Simulate user journey
        credibilityRegistry.recordSessionParticipation(user1, 1, true);
        credibilityRegistry.recordEvaluation(user1, 2, true);
        credibilityRegistry.updateCredibility(user1, 100, 1, "Reward");

        // Check multiple achievements
        assertTrue(AchievementUnlocker.qualifiesForFirstSession(credibilityRegistry, user1));
        assertTrue(AchievementUnlocker.qualifiesForFirstWin(credibilityRegistry, user1));
        assertTrue(AchievementUnlocker.qualifiesForFirstEvaluation(credibilityRegistry, user1));
        assertTrue(AchievementUnlocker.qualifiesForLegendary(credibilityRegistry, user1));
    }

    function testMintAchievementAfterQualifying() public {
        // User qualifies for FirstSession
        credibilityRegistry.recordSessionParticipation(user1, 1, false);

        // Mint achievement
        uint256 tokenId = achievementNFT.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest"
        );

        assertEq(achievementNFT.ownerOf(tokenId), user1);
        assertTrue(achievementNFT.hasAchievement(user1, IAchievementNFT.AchievementType.FirstSession));
    }

    function testHighAccuracyAchievement() public {
        // Submit 10 correct evaluations
        for (uint256 i = 1; i <= 10; i++) {
            credibilityRegistry.recordEvaluation(user1, i, true);
        }

        // Check accuracy
        assertEq(credibilityRegistry.getEvaluatorAccuracy(user1), 100);

        // Should qualify for HighAccuracy
        assertTrue(AchievementUnlocker.qualifiesForHighAccuracy(credibilityRegistry, user1));
    }

    function testChampionAchievement() public {
        // Win 10 sessions
        for (uint256 i = 1; i <= 10; i++) {
            credibilityRegistry.recordSessionParticipation(user1, i, true);
        }

        assertTrue(AchievementUnlocker.qualifiesForChampion(credibilityRegistry, user1));
    }

    function testEvaluatorEligibility() public {
        // Initially not eligible (< 50 credibility)
        assertFalse(credibilityRegistry.isEligibleEvaluator(user1));

        // Add minimum credibility
        credibilityRegistry.updateCredibility(user1, 50, 1, "Reach minimum");

        // Now eligible
        assertTrue(credibilityRegistry.isEligibleEvaluator(user1));
    }

    function testCredibilityHistory() public {
        credibilityRegistry.updateCredibility(user1, 50, 1, "First");
        credibilityRegistry.updateCredibility(user1, 30, 2, "Second");
        credibilityRegistry.updateCredibility(user1, -20, 3, "Penalty");

        ICredibilityRegistry.CredibilityHistory[] memory history = credibilityRegistry.getHistory(user1);

        assertEq(history.length, 3);
        assertEq(history[0].scoreChange, 50);
        assertEq(history[1].scoreChange, 30);
        assertEq(history[2].scoreChange, -20);
    }

    function testBatchAchievementMinting() public {
        // Prepare batch data
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        IAchievementNFT.AchievementType[] memory types = new IAchievementNFT.AchievementType[](2);
        types[0] = IAchievementNFT.AchievementType.FirstSession;
        types[1] = IAchievementNFT.AchievementType.FirstWin;

        string[] memory uris = new string[](2);
        uris[0] = "ipfs://Qm1";
        uris[1] = "ipfs://Qm2";

        // Batch mint
        uint256[] memory tokenIds = achievementNFT.batchMintAchievements(recipients, types, uris);

        assertEq(tokenIds.length, 2);
        assertEq(achievementNFT.ownerOf(tokenIds[0]), user1);
        assertEq(achievementNFT.ownerOf(tokenIds[1]), user2);
    }
}
