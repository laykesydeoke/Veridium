// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AchievementNFT.sol";

/// @title AchievementNFT Tests
/// @notice Comprehensive tests for soulbound achievement NFTs
contract AchievementNFTTest is Test {
    AchievementNFT nft;

    address owner;
    address user1;
    address user2;
    address minter;

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        minter = makeAddr("minter");

        nft = new AchievementNFT("Veridium Achievements", "VACH");
        nft.addAuthorizedMinter(minter);
    }

    function testInitialState() public view {
        assertEq(nft.name(), "Veridium Achievements");
        assertEq(nft.symbol(), "VACH");
        assertEq(nft.getTotalAchievements(), 0);
        assertTrue(nft.authorizedMinters(owner));
        assertTrue(nft.authorizedMinters(minter));
    }

    function testMintAchievement() public {
        vm.prank(minter);
        uint256 tokenId = nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), user1);
        assertEq(nft.getTotalAchievements(), 1);
    }

    function testCannotMintWithoutAuth() public {
        vm.prank(user1);
        vm.expectRevert("Not authorized");
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );
    }

    function testCannotMintDuplicateAchievement() public {
        vm.startPrank(minter);
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        vm.expectRevert("Already has achievement");
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest2"
        );
        vm.stopPrank();
    }

    function testBatchMintAchievements() public {
        address[] memory recipients = new address[](2);
        recipients[0] = user1;
        recipients[1] = user2;

        IAchievementNFT.AchievementType[] memory types = new IAchievementNFT.AchievementType[](2);
        types[0] = IAchievementNFT.AchievementType.FirstSession;
        types[1] = IAchievementNFT.AchievementType.FirstWin;

        string[] memory uris = new string[](2);
        uris[0] = "ipfs://QmTest1";
        uris[1] = "ipfs://QmTest2";

        vm.prank(minter);
        uint256[] memory tokenIds = nft.batchMintAchievements(recipients, types, uris);

        assertEq(tokenIds.length, 2);
        assertEq(nft.ownerOf(tokenIds[0]), user1);
        assertEq(nft.ownerOf(tokenIds[1]), user2);
    }

    function testGetAchievement() public {
        vm.prank(minter);
        uint256 tokenId = nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        IAchievementNFT.Achievement memory achievement = nft.getAchievement(tokenId);
        assertEq(achievement.tokenId, tokenId);
        assertEq(uint8(achievement.achievementType), uint8(IAchievementNFT.AchievementType.FirstSession));
        assertEq(achievement.recipient, user1);
        assertEq(achievement.metadataURI, "ipfs://QmTest1");
        assertFalse(achievement.revoked);
    }

    function testGetUserAchievements() public {
        vm.startPrank(minter);
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstWin,
            "ipfs://QmTest2"
        );
        vm.stopPrank();

        IAchievementNFT.Achievement[] memory achievements = nft.getUserAchievements(user1);
        assertEq(achievements.length, 2);
    }

    function testHasAchievement() public {
        assertFalse(nft.hasAchievement(user1, IAchievementNFT.AchievementType.FirstSession));

        vm.prank(minter);
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        assertTrue(nft.hasAchievement(user1, IAchievementNFT.AchievementType.FirstSession));
    }

    function testSoulboundTokenCannotBeTransferred() public {
        vm.prank(minter);
        uint256 tokenId = nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        vm.prank(user1);
        vm.expectRevert("Soulbound: token is non-transferable");
        nft.transferFrom(user1, user2, tokenId);
    }

    function testRevokeAchievement() public {
        vm.prank(minter);
        uint256 tokenId = nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        nft.revokeAchievement(tokenId, "Fraud detected");

        IAchievementNFT.Achievement memory achievement = nft.getAchievement(tokenId);
        assertTrue(achievement.revoked);
    }

    function testUpdateMetadata() public {
        vm.prank(minter);
        uint256 tokenId = nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        nft.updateMetadata(tokenId, "ipfs://QmTest2");

        IAchievementNFT.Achievement memory achievement = nft.getAchievement(tokenId);
        assertEq(achievement.metadataURI, "ipfs://QmTest2");
    }

    function testTokenURI() public {
        vm.prank(minter);
        uint256 tokenId = nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );

        assertEq(nft.tokenURI(tokenId), "ipfs://QmTest1");
    }

    function testGetAchievementsByType() public {
        vm.startPrank(minter);
        nft.mintAchievement(
            user1,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest1"
        );
        nft.mintAchievement(
            user2,
            IAchievementNFT.AchievementType.FirstSession,
            "ipfs://QmTest2"
        );
        vm.stopPrank();

        uint256[] memory tokenIds = nft.getAchievementsByType(IAchievementNFT.AchievementType.FirstSession);
        assertEq(tokenIds.length, 2);
    }

    function testAddAuthorizedMinter() public {
        address newMinter = makeAddr("newMinter");
        nft.addAuthorizedMinter(newMinter);
        assertTrue(nft.authorizedMinters(newMinter));
    }

    function testRemoveAuthorizedMinter() public {
        nft.removeAuthorizedMinter(minter);
        assertFalse(nft.authorizedMinters(minter));
    }
}
