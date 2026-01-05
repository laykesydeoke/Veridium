// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SessionFactory.sol";
import "../src/AssessmentManager.sol";
import "../src/mocks/MockUSDC.sol";

/// @title Deploy
/// @notice Deployment script for Veridium contracts
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockUSDC (only for testnet)
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // Deploy AssessmentManager
        AssessmentManager assessmentManager = new AssessmentManager();
        console.log("AssessmentManager deployed at:", address(assessmentManager));

        // Deploy SessionFactory
        SessionFactory factory = new SessionFactory(address(usdc), platformWallet);
        console.log("SessionFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
