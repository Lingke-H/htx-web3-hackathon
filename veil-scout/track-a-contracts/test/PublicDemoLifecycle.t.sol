// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { SeedPublicDemo } from "../script/SeedPublicDemo.s.sol";
import { CreditLedger } from "../src/CreditLedger.sol";
import { IncubationVault } from "../src/IncubationVault.sol";
import { Leaderboard } from "../src/Leaderboard.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { Season } from "../src/Season.sol";
import { ICreditLedger } from "../src/interfaces/ICreditLedger.sol";
import { ILeaderboard } from "../src/interfaces/ILeaderboard.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";
import { Side } from "../src/types/Enums.sol";
import { MarketSpec } from "../src/types/MarketSpec.sol";

contract PublicDemoLifecycleTest is Test {
    uint256 private constant SIGNER_PK = 0xA11CE;
    uint256 private constant SCOUT_A_PK = 0xA11;
    uint256 private constant SCOUT_B_PK = 0xB0B;
    bytes32 private constant SCOUT_A_ID = keccak256("veil-scout-public-a");
    bytes32 private constant SCOUT_B_ID = keccak256("veil-scout-public-b");

    Season private season;
    CreditLedger private ledger;
    Leaderboard private leaderboard;
    Market private market;
    MarketFactory private factory;
    IncubationVault private vault;

    function setUp() public {
        vm.warp(1_800_000_000);
        season = new Season();
        season.createSeason(block.timestamp, block.timestamp + 60 days);
        ledger = new CreditLedger(ISeason(address(season)), vm.addr(SIGNER_PK));
        leaderboard = new Leaderboard();
        market = new Market(
            ICreditLedger(address(ledger)),
            ILeaderboard(address(leaderboard)),
            ISeason(address(season))
        );
        factory = new MarketFactory(address(market));
        vault = new IncubationVault();

        ledger.grantRole(ledger.MARKET_ROLE(), address(market));
        leaderboard.grantRole(leaderboard.MARKET_ROLE(), address(market));
        market.grantRole(market.MARKET_CREATOR_ROLE(), address(factory));
        market.grantRole(market.SETTLEMENT_ROLE(), address(this));
        factory.grantRole(factory.MARKET_CREATOR_ROLE(), address(this));
        _claim(SCOUT_A_PK, SCOUT_A_ID);
        _claim(SCOUT_B_PK, SCOUT_B_ID);
    }

    function testPublicDemoConstantsMatchEvidencePlan() public {
        SeedPublicDemo script = new SeedPublicDemo();
        assertEq(script.yesStake(), 350);
        assertEq(script.noStake(), 250);
        assertEq(script.expectedYesOddsBps(), 5_833);
        assertEq(script.tradingDuration(), 20 minutes);
        assertEq(script.resolutionDuration(), 30 minutes);
        assertEq(script.forceVoidDuration(), 24 hours);
    }

    function testPublicDemoLifecycleProducesOddsReputationAndRoleGatedRelease() public {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256("veil-scout-public-proof-v1"),
            metadataURI: "https://github.com/Lingke-H/htx-web3-hackathon",
            seasonId: 0,
            tradingDeadline: block.timestamp + 20 minutes,
            resolutionDeadline: block.timestamp + 30 minutes,
            forceVoidDeadline: block.timestamp + 24 hours,
            projectOwner: address(0x1000)
        });
        uint256 marketId = factory.createMarket(spec);

        vm.prank(vm.addr(SCOUT_A_PK));
        market.takePosition(marketId, Side.YES, 350);
        vm.prank(vm.addr(SCOUT_B_PK));
        market.takePosition(marketId, Side.NO, 250);
        assertEq(market.getYesOdds(marketId), 5_833);

        uint256 vaultId =
            vault.createVault(address(0x1000), address(0x5150), 12_000, "public-proof");
        vault.recordMilestone(vaultId, "Repository delivery", 4_000, "evidence://m0");
        vault.recordMilestone(vaultId, "Public testnet proof", 4_000, "evidence://m1");
        vault.recordMilestone(vaultId, "Post-event retention", 4_000, "evidence://m2");

        vm.prank(address(0xBAD));
        vm.expectRevert();
        vault.releaseMilestone(vaultId, 0, "unauthorized");

        vm.warp(block.timestamp + 30 minutes + 1);
        market.settle(marketId, true);
        market.finalizePosition(marketId, SCOUT_A_ID);
        market.finalizePosition(marketId, SCOUT_B_ID);
        assertEq(leaderboard.getScore(SCOUT_A_ID, 0), 249);
        assertEq(leaderboard.getScore(SCOUT_B_ID, 0), -250);

        vault.releaseMilestone(vaultId, 0, "verified repository delivery");
        assertTrue(vault.getMilestone(vaultId, 0).released);
        assertEq(vault.remainingBudget(vaultId), 8_000);
        vm.expectRevert();
        vault.releaseMilestone(vaultId, 0, "duplicate");
    }

    function testPublicSeedSourceDoesNotContainKnownAnvilPrivateKeys() public view {
        string memory source = vm.readFile("script/SeedPublicDemo.s.sol");
        assertFalse(_contains(source, "ac0974bec39a17e36ba4a6b4d238ff944"));
        assertFalse(_contains(source, "59c6995e998f97a5a0044966f0945389d"));
        assertTrue(_contains(source, "vm.envUint(\"SCOUT_A_PRIVATE_KEY\")"));
        assertTrue(_contains(source, "vm.envUint(\"SCOUT_B_PRIVATE_KEY\")"));
    }

    function _claim(uint256 privateKey, bytes32 scoutId) private {
        address wallet = vm.addr(privateKey);
        uint256 deadline = block.timestamp + 1 days;
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId,
                uint256(0),
                wallet,
                block.chainid,
                address(ledger),
                ledger.claimNonce(wallet),
                deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);
        vm.prank(wallet);
        ledger.claim(0, scoutId, deadline, abi.encodePacked(r, s, v));
    }

    function _contains(string memory text, string memory needle) private pure returns (bool) {
        bytes memory haystack = bytes(text);
        bytes memory target = bytes(needle);
        if (target.length > haystack.length) return false;
        for (uint256 i = 0; i <= haystack.length - target.length; i++) {
            bool matches = true;
            for (uint256 j = 0; j < target.length; j++) {
                if (haystack[i + j] != target[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) return true;
        }
        return false;
    }
}
