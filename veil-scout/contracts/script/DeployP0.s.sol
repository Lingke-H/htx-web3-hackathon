// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";

import { CreditLedger } from "../src/CreditLedger.sol";
import { Leaderboard } from "../src/Leaderboard.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { Season } from "../src/Season.sol";
import { ICreditLedger } from "../src/interfaces/ICreditLedger.sol";
import { ILeaderboard } from "../src/interfaces/ILeaderboard.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";

contract DeployP0 is Script {
    uint256 private constant DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 private constant DEFAULT_CLAIM_SIGNER_PRIVATE_KEY = 0xA11CE;

    struct DeploymentOutput {
        address deployer;
        address claimSigner;
        address season;
        address creditLedger;
        address leaderboard;
        address market;
        address marketFactory;
        uint256 seasonStart;
        uint256 seasonEnd;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", DEFAULT_ANVIL_PRIVATE_KEY);
        uint256 claimSignerPrivateKey =
            vm.envOr("CLAIM_SIGNER_PRIVATE_KEY", DEFAULT_CLAIM_SIGNER_PRIVATE_KEY);
        DeploymentOutput memory output;
        output.claimSigner = vm.addr(claimSignerPrivateKey);
        output.deployer = vm.addr(deployerPrivateKey);
        output.seasonStart = vm.envOr("SEASON_START", block.timestamp);
        output.seasonEnd = vm.envOr("SEASON_END", output.seasonStart + 60 days);

        vm.startBroadcast(deployerPrivateKey);

        Season season = new Season();
        CreditLedger creditLedger = new CreditLedger(ISeason(address(season)), output.claimSigner);
        Leaderboard leaderboard = new Leaderboard();
        Market market = new Market(
            ICreditLedger(address(creditLedger)),
            ILeaderboard(address(leaderboard)),
            ISeason(address(season))
        );
        MarketFactory marketFactory = new MarketFactory(address(market));

        creditLedger.grantRole(creditLedger.MARKET_ROLE(), address(market));
        leaderboard.grantRole(leaderboard.MARKET_ROLE(), address(market));
        market.grantRole(market.MARKET_CREATOR_ROLE(), address(marketFactory));

        // Operational bootstrapping for mock data and early demos.
        market.grantRole(market.SETTLEMENT_ROLE(), output.deployer);
        marketFactory.grantRole(marketFactory.MARKET_CREATOR_ROLE(), output.deployer);

        season.createSeason(output.seasonStart, output.seasonEnd);

        vm.stopBroadcast();

        output.season = address(season);
        output.creditLedger = address(creditLedger);
        output.leaderboard = address(leaderboard);
        output.market = address(market);
        output.marketFactory = address(marketFactory);

        string memory path = string.concat(vm.projectRoot(), "/deployment.json");
        string memory json = _deploymentJson(output);
        vm.writeJson(json, path);

        console2.log("P0 deployed");
        console2.log("deployment.json:", path);
        console2.log("season:", address(season));
        console2.log("creditLedger:", address(creditLedger));
        console2.log("leaderboard:", address(leaderboard));
        console2.log("market:", address(market));
        console2.log("marketFactory:", address(marketFactory));
    }

    function _deploymentJson(DeploymentOutput memory output) private view returns (string memory) {
        return string.concat(
            "{\n",
            _metadataJson(output),
            _contractsJson(output),
            _seasonJson(output),
            _rolesJson(),
            "}\n"
        );
    }

    function _metadataJson(DeploymentOutput memory output) private view returns (string memory) {
        return string.concat(
            '  "chainId": ',
            vm.toString(block.chainid),
            ",\n",
            '  "deployer": "',
            vm.toString(output.deployer),
            '",\n',
            '  "claimSigner": "',
            vm.toString(output.claimSigner),
            '",\n'
        );
    }

    function _contractsJson(DeploymentOutput memory output) private pure returns (string memory) {
        return string.concat(
            '  "season": "',
            vm.toString(output.season),
            '",\n',
            '  "creditLedger": "',
            vm.toString(output.creditLedger),
            '",\n',
            '  "leaderboard": "',
            vm.toString(output.leaderboard),
            '",\n',
            '  "market": "',
            vm.toString(output.market),
            '",\n',
            '  "marketFactory": "',
            vm.toString(output.marketFactory),
            '",\n'
        );
    }

    function _seasonJson(DeploymentOutput memory output) private pure returns (string memory) {
        return string.concat(
            '  "seasonConfig": {\n',
            '    "seasonId": 0,\n',
            '    "startTime": ',
            vm.toString(output.seasonStart),
            ",\n",
            '    "endTime": ',
            vm.toString(output.seasonEnd),
            "\n",
            "  },\n"
        );
    }

    function _rolesJson() private pure returns (string memory) {
        bytes32 marketRole = keccak256("MARKET_ROLE");
        bytes32 marketCreatorRole = keccak256("MARKET_CREATOR_ROLE");
        bytes32 settlementRole = keccak256("SETTLEMENT_ROLE");
        bytes32 defaultAdminRole = bytes32(0);

        return string.concat(
            '  "roles": {\n',
            '    "MARKET_ROLE": "',
            vm.toString(marketRole),
            '",\n',
            '    "MARKET_CREATOR_ROLE": "',
            vm.toString(marketCreatorRole),
            '",\n',
            '    "SETTLEMENT_ROLE": "',
            vm.toString(settlementRole),
            '",\n',
            '    "DEFAULT_ADMIN_ROLE": "',
            vm.toString(defaultAdminRole),
            '"\n',
            "  }\n"
        );
    }
}
