// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";

import { CreditLedger } from "../src/CreditLedger.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { Side } from "../src/types/Enums.sol";
import { MarketSpec } from "../src/types/MarketSpec.sol";

contract MockData is Script {
    uint256 private constant DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 private constant DEFAULT_CLAIM_SIGNER_PRIVATE_KEY = 0xA11CE;

    uint256 private constant SCOUT_1_PK =
        0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 private constant SCOUT_2_PK =
        0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 private constant SCOUT_3_PK =
        0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 private constant SCOUT_4_PK =
        0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
    uint256 private constant SCOUT_5_PK =
        0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;

    bytes32 private constant SCOUT_1_ID = keccak256("scout_1");
    bytes32 private constant SCOUT_2_ID = keccak256("scout_2");
    bytes32 private constant SCOUT_3_ID = keccak256("scout_3");
    bytes32 private constant SCOUT_4_ID = keccak256("scout_4");
    bytes32 private constant SCOUT_5_ID = keccak256("scout_5");

    struct Deployment {
        CreditLedger creditLedger;
        Market market;
        MarketFactory marketFactory;
    }

    struct ScoutClaimData {
        address wallet;
        uint256 deadline;
        uint256 nonce;
        bytes signature;
    }

    function run() external {
        seed();
    }

    function seed() public {
        require(block.chainid == 31_337, "MockData is intended for local Anvil");

        Deployment memory deployment = _loadDeployment();
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", DEFAULT_ANVIL_PRIVATE_KEY);
        uint256 claimSignerPrivateKey =
            vm.envOr("CLAIM_SIGNER_PRIVATE_KEY", DEFAULT_CLAIM_SIGNER_PRIVATE_KEY);
        uint256 seasonId = vm.envOr("SEASON_ID", uint256(0));

        _ensureDemoRoles(deployerPrivateKey, deployment);
        _claimScouts(claimSignerPrivateKey, seasonId, deployment.creditLedger);

        uint256 market0 = _createMarket(
            deployerPrivateKey,
            deployment.marketFactory,
            seasonId,
            "ipfs://p0/mock/market-0-settled-yes",
            block.timestamp + 1 days,
            block.timestamp + 2 days,
            block.timestamp + 30 days,
            address(0x1000)
        );
        _takePosition(SCOUT_2_PK, deployment.market, market0, Side.YES, 1_000);
        _takePosition(SCOUT_3_PK, deployment.market, market0, Side.NO, 1_000);

        uint256 market1 = _createMarket(
            deployerPrivateKey,
            deployment.marketFactory,
            seasonId,
            "ipfs://p0/mock/market-1-trading",
            block.timestamp + 7 days,
            block.timestamp + 14 days,
            block.timestamp + 21 days,
            address(0x2000)
        );

        uint256 market2 = _createMarket(
            deployerPrivateKey,
            deployment.marketFactory,
            seasonId,
            "ipfs://p0/mock/market-2-voided",
            block.timestamp + 3 days,
            block.timestamp + 7 days,
            block.timestamp + 14 days,
            address(0x3000)
        );
        _takePosition(SCOUT_2_PK, deployment.market, market2, Side.YES, 500);
        vm.startBroadcast(deployerPrivateKey);
        deployment.market.voidMarket(market2, "ipfs://p0/mock/void-reason");
        vm.stopBroadcast();

        _writeMockData(
            seasonId,
            market0,
            market1,
            market2,
            "PENDING_SETTLEMENT",
            deployment.creditLedger,
            claimSignerPrivateKey
        );

        console2.log("P0 mock seed complete");
        console2.log("market_0 pending settlement:", market0);
        console2.log("market_1 trading:", market1);
        console2.log("market_2 voided:", market2);
        console2.log("Run settle() after seed() to advance Anvil time and settle market_0.");
    }

    function settle() external {
        require(block.chainid == 31_337, "MockData is intended for local Anvil");

        Deployment memory deployment = _loadDeployment();
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", DEFAULT_ANVIL_PRIVATE_KEY);
        uint256 claimSignerPrivateKey =
            vm.envOr("CLAIM_SIGNER_PRIVATE_KEY", DEFAULT_CLAIM_SIGNER_PRIVATE_KEY);
        uint256 seasonId = vm.envOr("SEASON_ID", uint256(0));
        uint256 market0 = vm.envOr("MARKET_0_ID", uint256(0));
        uint256 market1 = vm.envOr("MARKET_1_ID", uint256(1));
        uint256 market2 = vm.envOr("MARKET_2_ID", uint256(2));

        _increaseTime(2 days + 1);
        vm.startBroadcast(deployerPrivateKey);
        deployment.market.settle(market0, true);
        deployment.market.finalizePosition(market0, SCOUT_2_ID);
        deployment.market.finalizePosition(market0, SCOUT_3_ID);
        vm.stopBroadcast();

        _writeMockData(
            seasonId,
            market0,
            market1,
            market2,
            "SETTLED",
            deployment.creditLedger,
            claimSignerPrivateKey
        );

        console2.log("P0 mock settlement complete");
        console2.log("market_0 settled YES:", market0);
    }

    function _loadDeployment() private view returns (Deployment memory deployment) {
        string memory deploymentPath =
            vm.envOr("DEPLOYMENT_JSON", string.concat(vm.projectRoot(), "/deployment.json"));
        string memory json = vm.readFile(deploymentPath);
        deployment = Deployment({
            creditLedger: CreditLedger(vm.parseJsonAddress(json, ".creditLedger")),
            market: Market(vm.parseJsonAddress(json, ".market")),
            marketFactory: MarketFactory(vm.parseJsonAddress(json, ".marketFactory"))
        });
    }

    function _ensureDemoRoles(uint256 deployerPrivateKey, Deployment memory deployment) private {
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        deployment.marketFactory.grantRole(deployment.marketFactory.MARKET_CREATOR_ROLE(), deployer);
        deployment.market.grantRole(deployment.market.SETTLEMENT_ROLE(), deployer);
        vm.stopBroadcast();
    }

    function _claimScouts(
        uint256 claimSignerPrivateKey,
        uint256 seasonId,
        CreditLedger creditLedger
    ) private {
        _claimScout(SCOUT_1_PK, SCOUT_1_ID, claimSignerPrivateKey, seasonId, creditLedger);
        _claimScout(SCOUT_2_PK, SCOUT_2_ID, claimSignerPrivateKey, seasonId, creditLedger);
        _claimScout(SCOUT_3_PK, SCOUT_3_ID, claimSignerPrivateKey, seasonId, creditLedger);
        _claimScout(SCOUT_4_PK, SCOUT_4_ID, claimSignerPrivateKey, seasonId, creditLedger);
    }

    function _claimScout(
        uint256 scoutPrivateKey,
        bytes32 scoutId,
        uint256 claimSignerPrivateKey,
        uint256 seasonId,
        CreditLedger creditLedger
    ) private {
        address wallet = vm.addr(scoutPrivateKey);
        uint256 deadline = block.timestamp + 30 days;
        uint256 nonce = creditLedger.claimNonce(wallet);
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId, seasonId, wallet, block.chainid, address(creditLedger), nonce, deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(claimSignerPrivateKey, digest);

        vm.startBroadcast(scoutPrivateKey);
        creditLedger.claim(seasonId, scoutId, deadline, abi.encodePacked(r, s, v));
        vm.stopBroadcast();
    }

    function _createMarket(
        uint256 deployerPrivateKey,
        MarketFactory marketFactory,
        uint256 seasonId,
        string memory metadataURI,
        uint256 tradingDeadline,
        uint256 resolutionDeadline,
        uint256 forceVoidDeadline,
        address projectOwner
    ) private returns (uint256 marketId) {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256(abi.encodePacked(metadataURI)),
            metadataURI: metadataURI,
            seasonId: seasonId,
            tradingDeadline: tradingDeadline,
            resolutionDeadline: resolutionDeadline,
            forceVoidDeadline: forceVoidDeadline,
            projectOwner: projectOwner
        });

        vm.startBroadcast(deployerPrivateKey);
        marketId = marketFactory.createMarket(spec);
        vm.stopBroadcast();
    }

    function _takePosition(
        uint256 scoutPrivateKey,
        Market market,
        uint256 marketId,
        Side side,
        uint256 amount
    ) private {
        vm.startBroadcast(scoutPrivateKey);
        market.takePosition(marketId, side, amount);
        vm.stopBroadcast();
    }

    function _increaseTime(uint256 secondsToAdd) private {
        vm.rpc("evm_increaseTime", string.concat("[", vm.toString(secondsToAdd), "]"));
        vm.rpc("evm_mine", "[]");
        vm.warp(block.timestamp + secondsToAdd);
    }

    function _writeMockData(
        uint256 seasonId,
        uint256 market0,
        uint256 market1,
        uint256 market2,
        string memory market0Status,
        CreditLedger creditLedger,
        uint256 claimSignerPrivateKey
    ) private {
        ScoutClaimData memory scout5Claim = _scout5ClaimData(
            seasonId, creditLedger, claimSignerPrivateKey
        );
        string memory mockPath = string.concat(vm.projectRoot(), "/mock-data.json");
        vm.writeJson(
            _mockDataJson(
                seasonId, market0, market1, market2, market0Status, creditLedger, scout5Claim
            ),
            mockPath
        );
        console2.log("mock-data.json:", mockPath);
    }

    function _scout5ClaimData(
        uint256 seasonId,
        CreditLedger creditLedger,
        uint256 claimSignerPrivateKey
    ) private view returns (ScoutClaimData memory data) {
        data.wallet = vm.addr(SCOUT_5_PK);
        data.deadline = block.timestamp + 30 days;
        data.nonce = creditLedger.claimNonce(data.wallet);
        bytes32 digest = keccak256(
            abi.encodePacked(
                SCOUT_5_ID,
                seasonId,
                data.wallet,
                block.chainid,
                address(creditLedger),
                data.nonce,
                data.deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(claimSignerPrivateKey, digest);
        data.signature = abi.encodePacked(r, s, v);
    }

    function _mockDataJson(
        uint256 seasonId,
        uint256 market0,
        uint256 market1,
        uint256 market2,
        string memory market0Status,
        CreditLedger creditLedger,
        ScoutClaimData memory scout5Claim
    ) private view returns (string memory) {
        return string.concat(
            "{\n",
            _mockHeaderJson(seasonId),
            _scoutsJson(),
            ",\n",
            _scout5ClaimJson(seasonId, creditLedger, scout5Claim),
            ",\n",
            _marketsJson(market0, market1, market2, market0Status),
            "}\n"
        );
    }

    function _mockHeaderJson(uint256 seasonId) private view returns (string memory) {
        return string.concat(
            '  "chainId": ',
            vm.toString(block.chainid),
            ",\n",
            '  "seasonId": ',
            vm.toString(seasonId),
            ",\n",
            '  "claimSignerPrivateKey": "0x00000000000000000000000000000000000000000000000000000000000a11ce",\n'
        );
    }

    function _scoutsJson() private pure returns (string memory) {
        return string.concat(
            '  "scouts": {\n',
            _scoutJson("scout_1", SCOUT_1_ID, SCOUT_1_PK, true, "claimed and bound"),
            ",\n",
            _scoutJson("scout_2", SCOUT_2_ID, SCOUT_2_PK, true, "claimed, YES positions"),
            ",\n",
            _scoutJson("scout_3", SCOUT_3_ID, SCOUT_3_PK, true, "claimed, NO position"),
            ",\n",
            _scoutJson("scout_4", SCOUT_4_ID, SCOUT_4_PK, true, "claimed, no market action"),
            ",\n",
            _scoutJson("scout_5", SCOUT_5_ID, SCOUT_5_PK, false, "unclaimed judge account"),
            "\n",
            "  }"
        );
    }

    function _scout5ClaimJson(
        uint256 seasonId,
        CreditLedger creditLedger,
        ScoutClaimData memory claimData
    ) private pure returns (string memory) {
        return string.concat(
            '  "scout_5_claim": {\n',
            '    "seasonId": ',
            vm.toString(seasonId),
            ",\n",
            '    "scoutId": "',
            vm.toString(SCOUT_5_ID),
            '",\n',
            '    "wallet": "',
            vm.toString(claimData.wallet),
            '",\n',
            '    "deadline": ',
            vm.toString(claimData.deadline),
            ",\n",
            '    "nonce": ',
            vm.toString(claimData.nonce),
            ",\n",
            '    "signature": "',
            vm.toString(claimData.signature),
            '",\n',
            '    "preimageNote": "digest = keccak256(abi.encodePacked(scoutId, seasonId, wallet, chainId, creditLedgerAddress, nonce, deadline))",\n',
            '    "creditLedgerAddress": "',
            vm.toString(address(creditLedger)),
            '"\n',
            "  }"
        );
    }

    function _marketsJson(
        uint256 market0,
        uint256 market1,
        uint256 market2,
        string memory market0Status
    ) private pure returns (string memory) {
        return string.concat(
            '  "markets": {\n',
            '    "market_0": { "id": ',
            vm.toString(market0),
            ', "status": "',
            market0Status,
            '", "result": "YES", "purpose": "scout_2 can claim winnings after settlement" },\n',
            '    "market_1": { "id": ',
            vm.toString(market1),
            ', "status": "TRADING", "purpose": "judge can buy YES/NO" },\n',
            '    "market_2": { "id": ',
            vm.toString(market2),
            ', "status": "VOIDED", "purpose": "scout_2 can claim refund" }\n',
            "  }"
        );
    }

    function _scoutJson(
        string memory label,
        bytes32 scoutId,
        uint256 privateKey,
        bool claimed,
        string memory note
    ) private pure returns (string memory) {
        return string.concat(
            '    "',
            label,
            '": { "wallet": "',
            vm.toString(vm.addr(privateKey)),
            '", "privateKey": "',
            vm.toString(bytes32(privateKey)),
            '", "scoutId": "',
            vm.toString(scoutId),
            '", "claimed": ',
            claimed ? "true" : "false",
            ', "note": "',
            note,
            '" }'
        );
    }
}
