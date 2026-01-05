// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SessionFactory.sol";
import "../src/AssessmentManager.sol";

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

        vm.stopBroadcast();
    }
}
