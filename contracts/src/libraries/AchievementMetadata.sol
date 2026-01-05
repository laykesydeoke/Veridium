// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IAchievementNFT.sol";

/// @title AchievementMetadata
/// @notice Helper library for generating achievement metadata URIs
library AchievementMetadata {
    /// @notice Get achievement name
    /// @param achievementType The achievement type
    /// @return name The achievement name
    function getAchievementName(IAchievementNFT.AchievementType achievementType)
        internal
        pure
        returns (string memory name)
    {
        if (achievementType == IAchievementNFT.AchievementType.FirstSession) {
            return "First Session";
        } else if (achievementType == IAchievementNFT.AchievementType.FirstWin) {
            return "First Victory";
        } else if (achievementType == IAchievementNFT.AchievementType.FirstEvaluation) {
            return "First Evaluation";
        } else if (achievementType == IAchievementNFT.AchievementType.TenSessions) {
            return "Discourse Veteran";
        } else if (achievementType == IAchievementNFT.AchievementType.FiftySessions) {
            return "Discourse Master";
        } else if (achievementType == IAchievementNFT.AchievementType.HighAccuracy) {
            return "Truth Seeker";
        } else if (achievementType == IAchievementNFT.AchievementType.Legendary) {
            return "Legendary";
        } else if (achievementType == IAchievementNFT.AchievementType.Champion) {
            return "Champion";
        }
        return "Unknown";
    }

    /// @notice Get achievement description
    /// @param achievementType The achievement type
    /// @return description The achievement description
    function getAchievementDescription(IAchievementNFT.AchievementType achievementType)
        internal
        pure
        returns (string memory description)
    {
        if (achievementType == IAchievementNFT.AchievementType.FirstSession) {
            return "Participated in first discourse session";
        } else if (achievementType == IAchievementNFT.AchievementType.FirstWin) {
            return "Won first discourse battle";
        } else if (achievementType == IAchievementNFT.AchievementType.FirstEvaluation) {
            return "Submitted first session evaluation";
        } else if (achievementType == IAchievementNFT.AchievementType.TenSessions) {
            return "Participated in 10 discourse sessions";
        } else if (achievementType == IAchievementNFT.AchievementType.FiftySessions) {
            return "Participated in 50 discourse sessions";
        } else if (achievementType == IAchievementNFT.AchievementType.HighAccuracy) {
            return "Achieved 80%+ evaluation accuracy";
        } else if (achievementType == IAchievementNFT.AchievementType.Legendary) {
            return "Reached 100+ credibility score";
        } else if (achievementType == IAchievementNFT.AchievementType.Champion) {
            return "Won 10+ discourse battles";
        }
        return "Unknown achievement";
    }

    /// @notice Get achievement rarity
    /// @param achievementType The achievement type
    /// @return rarity The rarity level (1-5)
    function getAchievementRarity(IAchievementNFT.AchievementType achievementType)
        internal
        pure
        returns (uint8 rarity)
    {
        if (achievementType == IAchievementNFT.AchievementType.FirstSession ||
            achievementType == IAchievementNFT.AchievementType.FirstEvaluation) {
            return 1; // Common
        } else if (achievementType == IAchievementNFT.AchievementType.FirstWin ||
                   achievementType == IAchievementNFT.AchievementType.TenSessions) {
            return 2; // Uncommon
        } else if (achievementType == IAchievementNFT.AchievementType.HighAccuracy ||
                   achievementType == IAchievementNFT.AchievementType.Champion) {
            return 3; // Rare
        } else if (achievementType == IAchievementNFT.AchievementType.FiftySessions) {
            return 4; // Epic
        } else if (achievementType == IAchievementNFT.AchievementType.Legendary) {
            return 5; // Legendary
        }
        return 0;
    }

    /// @notice Build IPFS metadata URI (placeholder)
    /// @param achievementType The achievement type
    /// @return uri The IPFS URI
    function buildMetadataURI(IAchievementNFT.AchievementType achievementType)
        internal
        pure
        returns (string memory uri)
    {
        // Placeholder - in production this would generate proper IPFS URIs
        string memory name = getAchievementName(achievementType);
        return string(abi.encodePacked("ipfs://QmPlaceholder/", name));
    }
}
