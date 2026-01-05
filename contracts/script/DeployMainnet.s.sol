// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SessionFactory.sol";
import "../src/AssessmentManager.sol";
import "../src/CredibilityRegistry.sol";
import "../src/AchievementNFT.sol";

/// @title DeployMainnet
/// @notice Mainnet deployment script for Veridium contracts
/// @dev Uses real USDC address on Base mainnet
contract DeployMainnet is Script {
    // Base mainnet USDC address
    address constant USDC_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy AssessmentManager
        AssessmentManager assessmentManager = new AssessmentManager();
        console.log("AssessmentManager deployed at:", address(assessmentManager));

        // Deploy SessionFactory with real USDC
        SessionFactory factory = new SessionFactory(USDC_MAINNET, platformWallet);
        console.log("SessionFactory deployed at:", address(factory));

        // Deploy CredibilityRegistry
        CredibilityRegistry credibilityRegistry = new CredibilityRegistry();
        console.log("CredibilityRegistry deployed at:", address(credibilityRegistry));

        // Deploy AchievementNFT
        AchievementNFT achievementNFT = new AchievementNFT("Veridium Achievements", "VACH");
        console.log("AchievementNFT deployed at:", address(achievementNFT));

        // Authorize contracts to interact with each other
        credibilityRegistry.addAuthorizedUpdater(address(assessmentManager));
        achievementNFT.addAuthorizedMinter(address(credibilityRegistry));

        vm.stopBroadcast();
    }
}
