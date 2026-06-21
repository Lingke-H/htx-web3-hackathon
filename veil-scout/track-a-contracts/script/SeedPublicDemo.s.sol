// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";

import { CreditLedger } from "../src/CreditLedger.sol";
import { IncubationVault } from "../src/IncubationVault.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { Side } from "../src/types/Enums.sol";
import { MarketSpec } from "../src/types/MarketSpec.sol";

/// @notice Seeds the auditable Base Sepolia proof with two real EOAs and no embedded keys.
contract SeedPublicDemo is Script {
    uint256 private constant YES_STAKE = 350;
    uint256 private constant NO_STAKE = 250;
    uint256 private constant TRADING_DURATION = 20 minutes;
    uint256 private constant RESOLUTION_DURATION = 30 minutes;
    uint256 private constant FORCE_VOID_DURATION = 24 hours;
    uint256 private constant BASE_SEPOLIA_CHAIN_ID = 84_532;
    uint256 private constant MILESTONE_AMOUNT = 4_000;
    bytes32 private constant SCOUT_A_ID = keccak256("veil-scout-public-a");
    bytes32 private constant SCOUT_B_ID = keccak256("veil-scout-public-b");

    struct Deployment {
        CreditLedger creditLedger;
        Market market;
        MarketFactory marketFactory;
        IncubationVault incubationVault;
    }

    struct SeedInputs {
        uint256 deployerPrivateKey;
        uint256 claimSignerPrivateKey;
        uint256 scoutAPrivateKey;
        uint256 scoutBPrivateKey;
        uint256 seasonId;
        uint256 claimDeadline;
        uint256 tradingDeadline;
        uint256 resolutionDeadline;
        uint256 forceVoidDeadline;
        address projectOwner;
        address sponsor;
        string metadataURI;
    }

    function run() external returns (uint256 marketId, uint256 vaultId) {
        require(block.chainid == BASE_SEPOLIA_CHAIN_ID, "SeedPublicDemo requires Base Sepolia");
        SeedInputs memory inputs = _seedInputs();
        Deployment memory deployment = _loadDeployment();
        require(
            deployment.creditLedger.claimSigner() == vm.addr(inputs.claimSignerPrivateKey),
            "claim signer key does not match deployment"
        );
        require(deployment.market.nextMarketId() == 0, "public market already seeded");
        require(deployment.incubationVault.nextVaultId() == 0, "public vault already seeded");

        uint256 scoutFundingWei = vm.envOr("SCOUT_FUNDING_WEI", uint256(0.0001 ether));
        _fundScouts(
            inputs.deployerPrivateKey,
            vm.addr(inputs.scoutAPrivateKey),
            vm.addr(inputs.scoutBPrivateKey),
            scoutFundingWei
        );
        _claim(
            deployment.creditLedger,
            inputs.scoutAPrivateKey,
            inputs.claimSignerPrivateKey,
            inputs.seasonId,
            SCOUT_A_ID,
            inputs.claimDeadline
        );
        _claim(
            deployment.creditLedger,
            inputs.scoutBPrivateKey,
            inputs.claimSignerPrivateKey,
            inputs.seasonId,
            SCOUT_B_ID,
            inputs.claimDeadline
        );
        (marketId, vaultId) = _createMarketAndVault(deployment, inputs);

        vm.startBroadcast(inputs.scoutAPrivateKey);
        deployment.market.takePosition(marketId, Side.YES, YES_STAKE);
        vm.stopBroadcast();
        vm.startBroadcast(inputs.scoutBPrivateKey);
        deployment.market.takePosition(marketId, Side.NO, NO_STAKE);
        vm.stopBroadcast();

        _writeOutput(deployment, inputs, marketId, vaultId);
        console2.log("Public demo seeded on Base Sepolia");
        console2.log("marketId:", marketId);
        console2.log("vaultId:", vaultId);
        console2.log("YES odds bps:", deployment.market.getYesOdds(marketId));
    }

    function yesStake() external pure returns (uint256) {
        return YES_STAKE;
    }

    function noStake() external pure returns (uint256) {
        return NO_STAKE;
    }

    function expectedYesOddsBps() external pure returns (uint256) {
        return YES_STAKE * 10_000 / (YES_STAKE + NO_STAKE);
    }

    function tradingDuration() external pure returns (uint256) {
        return TRADING_DURATION;
    }

    function resolutionDuration() external pure returns (uint256) {
        return RESOLUTION_DURATION;
    }

    function forceVoidDuration() external pure returns (uint256) {
        return FORCE_VOID_DURATION;
    }

    function _seedInputs() private view returns (SeedInputs memory inputs) {
        inputs.deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        inputs.claimSignerPrivateKey = vm.envUint("CLAIM_SIGNER_PRIVATE_KEY");
        inputs.scoutAPrivateKey = vm.envUint("SCOUT_A_PRIVATE_KEY");
        inputs.scoutBPrivateKey = vm.envUint("SCOUT_B_PRIVATE_KEY");
        require(
            inputs.scoutAPrivateKey != inputs.scoutBPrivateKey,
            "public scouts must use distinct keys"
        );
        inputs.seasonId = vm.envOr("SEASON_ID", uint256(0));
        inputs.claimDeadline = block.timestamp + 1 days;
        inputs.tradingDeadline = block.timestamp + TRADING_DURATION;
        inputs.resolutionDeadline = block.timestamp + RESOLUTION_DURATION;
        inputs.forceVoidDeadline = block.timestamp + FORCE_VOID_DURATION;
        inputs.projectOwner = vm.envOr("PUBLIC_PROJECT_OWNER", address(0x1000));
        inputs.sponsor = vm.envOr("PUBLIC_SPONSOR", address(0x5150));
        inputs.metadataURI = vm.envOr(
            "PUBLIC_MARKET_METADATA_URI", string("https://github.com/Lingke-H/htx-web3-hackathon")
        );
    }

    function _createMarketAndVault(Deployment memory deployment, SeedInputs memory inputs)
        private
        returns (uint256 marketId, uint256 vaultId)
    {
        vm.startBroadcast(inputs.deployerPrivateKey);
        marketId = deployment.marketFactory
            .createMarket(
                MarketSpec({
                    specHash: keccak256(bytes(inputs.metadataURI)),
                    metadataURI: inputs.metadataURI,
                    seasonId: inputs.seasonId,
                    tradingDeadline: inputs.tradingDeadline,
                    resolutionDeadline: inputs.resolutionDeadline,
                    forceVoidDeadline: inputs.forceVoidDeadline,
                    projectOwner: inputs.projectOwner
                })
            );
        vaultId = deployment.incubationVault
            .createVault(
                inputs.projectOwner,
                inputs.sponsor,
                MILESTONE_AMOUNT * 3,
                "evidence://veil-scout/public-proof"
            );
        deployment.incubationVault
            .recordMilestone(
                vaultId, "Repository delivery", MILESTONE_AMOUNT, "evidence://milestone/0"
            );
        deployment.incubationVault
            .recordMilestone(
                vaultId, "Base Sepolia public proof", MILESTONE_AMOUNT, "evidence://milestone/1"
            );
        deployment.incubationVault
            .recordMilestone(
                vaultId, "Post-event retention", MILESTONE_AMOUNT, "evidence://milestone/2"
            );
        vm.stopBroadcast();
    }

    function _loadDeployment() private view returns (Deployment memory deployment) {
        string memory path =
            vm.envOr("DEPLOYMENT_JSON", string.concat(vm.projectRoot(), "/deployment.json"));
        string memory json = vm.readFile(path);
        deployment = Deployment({
            creditLedger: CreditLedger(vm.parseJsonAddress(json, ".creditLedger")),
            market: Market(vm.parseJsonAddress(json, ".market")),
            marketFactory: MarketFactory(vm.parseJsonAddress(json, ".marketFactory")),
            incubationVault: IncubationVault(vm.parseJsonAddress(json, ".incubationVault"))
        });
    }

    function _fundScouts(uint256 deployerPrivateKey, address scoutA, address scoutB, uint256 amount)
        private
    {
        vm.startBroadcast(deployerPrivateKey);
        (bool fundedA,) = payable(scoutA).call{ value: amount }("");
        (bool fundedB,) = payable(scoutB).call{ value: amount }("");
        require(fundedA && fundedB, "failed to fund public scouts");
        vm.stopBroadcast();
    }

    function _claim(
        CreditLedger ledger,
        uint256 scoutPrivateKey,
        uint256 claimSignerPrivateKey,
        uint256 seasonId,
        bytes32 scoutId,
        uint256 deadline
    ) private {
        address wallet = vm.addr(scoutPrivateKey);
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId,
                seasonId,
                wallet,
                block.chainid,
                address(ledger),
                ledger.claimNonce(wallet),
                deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(claimSignerPrivateKey, digest);
        vm.startBroadcast(scoutPrivateKey);
        ledger.claim(seasonId, scoutId, deadline, abi.encodePacked(r, s, v));
        vm.stopBroadcast();
    }

    function _writeOutput(
        Deployment memory deployment,
        SeedInputs memory inputs,
        uint256 marketId,
        uint256 vaultId
    ) private {
        string memory outputPath = vm.envOr(
            "PUBLIC_DEMO_JSON", string.concat(vm.projectRoot(), "/public-demo.json")
        );
        string memory objectKey = "publicDemo";
        vm.serializeUint(objectKey, "chainId", block.chainid);
        vm.serializeUint(objectKey, "seasonId", inputs.seasonId);
        vm.serializeUint(objectKey, "marketId", marketId);
        vm.serializeUint(objectKey, "vaultId", vaultId);
        vm.serializeAddress(objectKey, "market", address(deployment.market));
        vm.serializeAddress(objectKey, "leaderboard", address(deployment.market.leaderboard()));
        vm.serializeAddress(objectKey, "incubationVault", address(deployment.incubationVault));
        vm.serializeAddress(objectKey, "scoutA", vm.addr(inputs.scoutAPrivateKey));
        vm.serializeAddress(objectKey, "scoutB", vm.addr(inputs.scoutBPrivateKey));
        vm.serializeBytes32(objectKey, "scoutAId", SCOUT_A_ID);
        vm.serializeBytes32(objectKey, "scoutBId", SCOUT_B_ID);
        vm.serializeUint(objectKey, "yesStake", YES_STAKE);
        vm.serializeUint(objectKey, "noStake", NO_STAKE);
        vm.serializeUint(objectKey, "yesOddsBps", YES_STAKE * 10_000 / (YES_STAKE + NO_STAKE));
        vm.serializeUint(objectKey, "tradingDeadline", inputs.tradingDeadline);
        vm.serializeUint(objectKey, "resolutionDeadline", inputs.resolutionDeadline);
        string memory json =
            vm.serializeUint(objectKey, "forceVoidDeadline", inputs.forceVoidDeadline);
        vm.writeJson(json, outputPath);
    }
}
