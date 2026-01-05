// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SessionFactory.sol";
import "../src/AssessmentManager.sol";
import "../src/WagerPool.sol";

/// @title IntegrateAssessment
/// @notice Script to register sessions with AssessmentManager
/// @dev Used for connecting existing sessions to the assessment system
contract IntegrateAssessment is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address assessmentAddress = vm.envAddress("ASSESSMENT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        SessionFactory factory = SessionFactory(factoryAddress);
        AssessmentManager assessment = AssessmentManager(assessmentAddress);

        // Example: Register session 1
        uint256 sessionId = 1;
        address poolAddress = factory.getSessionPool(sessionId);

        if (poolAddress != address(0)) {
            assessment.registerSession(sessionId, poolAddress);
            console.log("Registered session", sessionId, "with pool", poolAddress);
        }

        vm.stopBroadcast();
    }
}
