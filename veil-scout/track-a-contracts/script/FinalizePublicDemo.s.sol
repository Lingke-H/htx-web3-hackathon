// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";

import { Leaderboard } from "../src/Leaderboard.sol";
import { Market } from "../src/Market.sol";

/// @notice Settles only after the real deadline and persists both public Scout scores.
contract FinalizePublicDemo is Script {
    uint256 private constant BASE_SEPOLIA_CHAIN_ID = 84_532;

    function run() external {
        require(block.chainid == BASE_SEPOLIA_CHAIN_ID, "FinalizePublicDemo requires Base Sepolia");
        uint256 settlementPrivateKey = vm.envUint("PRIVATE_KEY");
        bool verificationPassed = vm.envBool("VERIFICATION_PASSED");
        string memory deploymentJson = vm.readFile(
            vm.envOr("DEPLOYMENT_JSON", string.concat(vm.projectRoot(), "/deployment.json"))
        );
        string memory demoJson = vm.readFile(
            vm.envOr("PUBLIC_DEMO_JSON", string.concat(vm.projectRoot(), "/public-demo.json"))
        );
        Market market = Market(vm.parseJsonAddress(deploymentJson, ".market"));
        Leaderboard leaderboard = Leaderboard(vm.parseJsonAddress(deploymentJson, ".leaderboard"));
        uint256 marketId = vm.parseJsonUint(demoJson, ".marketId");
        uint256 seasonId = vm.parseJsonUint(demoJson, ".seasonId");
        bytes32 scoutAId = vm.parseJsonBytes32(demoJson, ".scoutAId");
        bytes32 scoutBId = vm.parseJsonBytes32(demoJson, ".scoutBId");

        vm.startBroadcast(settlementPrivateKey);
        market.settle(marketId, verificationPassed);
        market.finalizePosition(marketId, scoutAId);
        market.finalizePosition(marketId, scoutBId);
        vm.stopBroadcast();

        console2.log("Public market finalized:", marketId);
        console2.log("Scout A score:", leaderboard.getScore(scoutAId, seasonId));
        console2.log("Scout B score:", leaderboard.getScore(scoutBId, seasonId));
    }
}
