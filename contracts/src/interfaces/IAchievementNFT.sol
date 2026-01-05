// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAchievementNFT
/// @notice Interface for soulbound achievement NFTs
/// @dev ERC-721 compatible with transfer restrictions (soulbound)
interface IAchievementNFT {
    /// @notice Achievement types
    enum AchievementType {
        FirstSession, // Participated in first session
        FirstWin, // Won first session
        FirstEvaluation, // Submitted first evaluation
        TenSessions, // Participated in 10 sessions
        FiftySessions, // Participated in 50 sessions
        HighAccuracy, // 80%+ evaluation accuracy
        Legendary, // 100+ total credibility
        Champion // 10+ wins
    }

    /// @notice Achievement metadata
    struct Achievement {
        uint256 tokenId; // NFT token ID
        AchievementType achievementType; // Type of achievement
        address recipient; // Achievement holder
        uint256 mintedAt; // When achievement was minted
        string metadataURI; // IPFS URI for metadata
        bool revoked; // Whether achievement was revoked
    }

    /// @notice Emitted when achievement is minted
    /// @param recipient The recipient address
    /// @param tokenId The token ID
    /// @param achievementType The achievement type
    event AchievementMinted(address indexed recipient, uint256 indexed tokenId, AchievementType achievementType);

    /// @notice Emitted when achievement is revoked
    /// @param tokenId The token ID
    /// @param reason The revocation reason
    event AchievementRevoked(uint256 indexed tokenId, string reason);

    /// @notice Emitted when metadata is updated
    /// @param tokenId The token ID
    /// @param newURI The new metadata URI
    event MetadataUpdated(uint256 indexed tokenId, string newURI);

    /// @notice Mint achievement NFT to recipient
    /// @param recipient The recipient address
    /// @param achievementType The achievement type
    /// @param metadataURI The IPFS metadata URI
    /// @return tokenId The minted token ID
    function mintAchievement(address recipient, AchievementType achievementType, string calldata metadataURI)
        external
        returns (uint256 tokenId);

    /// @notice Batch mint achievements
    /// @param recipients Array of recipient addresses
    /// @param achievementTypes Array of achievement types
    /// @param metadataURIs Array of metadata URIs
    /// @return tokenIds Array of minted token IDs
    function batchMintAchievements(
        address[] calldata recipients,
        AchievementType[] calldata achievementTypes,
        string[] calldata metadataURIs
    ) external returns (uint256[] memory tokenIds);

    /// @notice Revoke achievement (admin only)
    /// @param tokenId The token ID to revoke
    /// @param reason The revocation reason
    function revokeAchievement(uint256 tokenId, string calldata reason) external;

    /// @notice Update achievement metadata
    /// @param tokenId The token ID
    /// @param newURI The new metadata URI
    function updateMetadata(uint256 tokenId, string calldata newURI) external;

    /// @notice Get achievement details
    /// @param tokenId The token ID
    /// @return achievement The achievement struct
    function getAchievement(uint256 tokenId) external view returns (Achievement memory achievement);

    /// @notice Get all achievements for a user
    /// @param user The user address
    /// @return achievements Array of achievement structs
    function getUserAchievements(address user) external view returns (Achievement[] memory achievements);

    /// @notice Check if user has specific achievement
    /// @param user The user address
    /// @param achievementType The achievement type
    /// @return hasAchievement True if user has the achievement
    function hasAchievement(address user, AchievementType achievementType)
        external
        view
        returns (bool hasAchievement);

    /// @notice Get total achievements minted
    /// @return count Total achievement count
    function getTotalAchievements() external view returns (uint256 count);

    /// @notice Get achievements by type
    /// @param achievementType The achievement type
    /// @return tokenIds Array of token IDs
    function getAchievementsByType(AchievementType achievementType)
        external
        view
        returns (uint256[] memory tokenIds);
}
