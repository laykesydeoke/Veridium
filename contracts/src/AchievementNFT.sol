// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAchievementNFT.sol";

/// @title AchievementNFT
/// @notice Soulbound NFTs for discourse achievements
/// @dev ERC-721 tokens that are non-transferable (soulbound)
contract AchievementNFT is IAchievementNFT, ERC721, Ownable, ReentrancyGuard {
    /// @notice Counter for token IDs
    uint256 private tokenIdCounter;

    /// @notice Mapping of token ID to achievement data
    mapping(uint256 => Achievement) private achievements;

    /// @notice Mapping of user to array of token IDs
    mapping(address => uint256[]) private userAchievements;

    /// @notice Mapping of achievement type to array of token IDs
    mapping(AchievementType => uint256[]) private achievementsByType;

    /// @notice Mapping to track if user has specific achievement
    mapping(address => mapping(AchievementType => bool)) private userHasAchievement;

    /// @notice Authorized minters (e.g., CredibilityRegistry)
    mapping(address => bool) public authorizedMinters;

    /// @notice Base URI for metadata
    string private baseTokenURI;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {
        // Owner is automatically authorized
        authorizedMinters[msg.sender] = true;
    }

    /// @notice Modifier to restrict access to authorized minters
    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender], "Not authorized");
        _;
    }

    /// @inheritdoc IAchievementNFT
    function mintAchievement(address recipient, AchievementType achievementType, string calldata metadataURI)
        external
        override
        onlyAuthorized
        nonReentrant
        returns (uint256 tokenId)
    {
        require(recipient != address(0), "Invalid recipient");
        require(!userHasAchievement[recipient][achievementType], "Already has achievement");

        tokenIdCounter++;
        tokenId = tokenIdCounter;

        _safeMint(recipient, tokenId);

        achievements[tokenId] = Achievement({
            tokenId: tokenId,
            achievementType: achievementType,
            recipient: recipient,
            mintedAt: block.timestamp,
            metadataURI: metadataURI,
            revoked: false
        });

        userAchievements[recipient].push(tokenId);
        achievementsByType[achievementType].push(tokenId);
        userHasAchievement[recipient][achievementType] = true;

        emit AchievementMinted(recipient, tokenId, achievementType);

        return tokenId;
    }

    /// @inheritdoc IAchievementNFT
    function batchMintAchievements(
        address[] calldata recipients,
        AchievementType[] calldata achievementTypes,
        string[] calldata metadataURIs
    ) external override onlyAuthorized nonReentrant returns (uint256[] memory tokenIds) {
        require(recipients.length == achievementTypes.length, "Length mismatch");
        require(recipients.length == metadataURIs.length, "Length mismatch");
        require(recipients.length > 0, "Empty arrays");

        tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(!userHasAchievement[recipients[i]][achievementTypes[i]], "Already has achievement");

            tokenIdCounter++;
            uint256 tokenId = tokenIdCounter;
            tokenIds[i] = tokenId;

            _safeMint(recipients[i], tokenId);

            achievements[tokenId] = Achievement({
                tokenId: tokenId,
                achievementType: achievementTypes[i],
                recipient: recipients[i],
                mintedAt: block.timestamp,
                metadataURI: metadataURIs[i],
                revoked: false
            });

            userAchievements[recipients[i]].push(tokenId);
            achievementsByType[achievementTypes[i]].push(tokenId);
            userHasAchievement[recipients[i]][achievementTypes[i]] = true;

            emit AchievementMinted(recipients[i], tokenId, achievementTypes[i]);
        }

        return tokenIds;
    }

    /// @inheritdoc IAchievementNFT
    function revokeAchievement(uint256 tokenId, string calldata reason) external override onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!achievements[tokenId].revoked, "Already revoked");

        achievements[tokenId].revoked = true;

        emit AchievementRevoked(tokenId, reason);
    }

    /// @inheritdoc IAchievementNFT
    function updateMetadata(uint256 tokenId, string calldata newURI) external override onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        achievements[tokenId].metadataURI = newURI;

        emit MetadataUpdated(tokenId, newURI);
    }

    /// @inheritdoc IAchievementNFT
    function getAchievement(uint256 tokenId) external view override returns (Achievement memory achievement) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return achievements[tokenId];
    }

    /// @inheritdoc IAchievementNFT
    function getUserAchievements(address user) external view override returns (Achievement[] memory userAchievementList) {
        uint256[] memory tokenIds = userAchievements[user];
        userAchievementList = new Achievement[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            userAchievementList[i] = achievements[tokenIds[i]];
        }

        return userAchievementList;
    }

    /// @inheritdoc IAchievementNFT
    function hasAchievement(address user, AchievementType achievementType)
        external
        view
        override
        returns (bool hasAch)
    {
        return userHasAchievement[user][achievementType];
    }

    /// @inheritdoc IAchievementNFT
    function getTotalAchievements() external view override returns (uint256 count) {
        return tokenIdCounter;
    }

    /// @inheritdoc IAchievementNFT
    function getAchievementsByType(AchievementType achievementType)
        external
        view
        override
        returns (uint256[] memory tokenIds)
    {
        return achievementsByType[achievementType];
    }

    /// @notice Override transfer functions to make tokens soulbound
    /// @dev Soulbound tokens cannot be transferred except by burning
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0))
        // Allow burning (to == address(0))
        // Block all other transfers
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: token is non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    /// @notice Get token URI for metadata
    /// @param tokenId The token ID
    /// @return URI for token metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return achievements[tokenId].metadataURI;
    }

    /// @notice Set base URI for tokens
    /// @param baseURI The base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        baseTokenURI = baseURI;
    }

    /// @notice Add authorized minter
    /// @param minter The address to authorize
    function addAuthorizedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter");
        authorizedMinters[minter] = true;
    }

    /// @notice Remove authorized minter
    /// @param minter The address to remove
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }

    /// @notice Get all token IDs owned by user
    /// @param user The user address
    /// @return tokenIds Array of token IDs
    function getUserTokenIds(address user) external view returns (uint256[] memory tokenIds) {
        return userAchievements[user];
    }
}
