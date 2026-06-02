// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { CreditLedger } from "../src/CreditLedger.sol";
import { ICreditLedger } from "../src/interfaces/ICreditLedger.sol";
import { ILeaderboard } from "../src/interfaces/ILeaderboard.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";
import { Leaderboard } from "../src/Leaderboard.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { Season } from "../src/Season.sol";
import { Side } from "../src/types/Enums.sol";
import { MarketSpec } from "../src/types/MarketSpec.sol";
import { NoClaimableCredits } from "../src/types/Errors.sol";

/// @title IntegrationTest
/// @notice End-to-end test: season creation → credit claims → market creation
///         → trading → settlement → claims → leaderboard → sweep.
contract IntegrationTest is Test {
    uint256 private constant SIGNER_PK = 0xA11CE;
    uint256 private constant ALICE_PK = 0xA1;
    uint256 private constant BOB_PK = 0xB0;

    bytes32 private constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 private constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");
    bytes32 private constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    Season private season;
    CreditLedger private ledger;
    Leaderboard private leaderboard;
    Market private market;
    MarketFactory private factory;

    address private signer;
    address private alice;
    address private bob;
    address private settler = address(0x5157);
    address private projectOwner = address(0xBEEF);

    bytes32 private aliceScout = keccak256("alice");
    bytes32 private bobScout = keccak256("bob");

    function setUp() public {
        vm.warp(10_000);
        signer = vm.addr(SIGNER_PK);
        alice = vm.addr(ALICE_PK);
        bob = vm.addr(BOB_PK);

        season = new Season();
        season.createSeason(block.timestamp, block.timestamp + 60 days);

        ledger = new CreditLedger(ISeason(address(season)), signer);
        leaderboard = new Leaderboard();
        market = new Market(
            ICreditLedger(address(ledger)),
            ILeaderboard(address(leaderboard)),
            ISeason(address(season))
        );
        factory = new MarketFactory(address(market));

        ledger.grantRole(ledger.MARKET_ROLE(), address(market));
        leaderboard.grantRole(leaderboard.MARKET_ROLE(), address(market));
        market.grantRole(market.MARKET_CREATOR_ROLE(), address(factory));
        market.grantRole(market.SETTLEMENT_ROLE(), settler);
        factory.grantRole(factory.MARKET_CREATOR_ROLE(), address(this));

        _claim(ALICE_PK, aliceScout);
        _claim(BOB_PK, bobScout);
    }

    function testFullSeasonLifecycle() public {
        // 1. Create market
        uint256 marketId = _createMarket();

        // 2. Alice buys YES, Bob buys NO
        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);

        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 500);

        assertEq(ledger.freeBalance(aliceScout, 0), 9_000);
        assertEq(ledger.freeBalance(bobScout, 0), 9_500);
        assertEq(ledger.marketLockedCredits(marketId), 1_500);

        // 3. Warp past resolution deadline and settle YES
        vm.warp(block.timestamp + 8 days);
        vm.prank(settler);
        market.settle(marketId, true);

        // 4. Alice claims winnings
        vm.prank(alice);
        market.claim(marketId);

        // Alice gets her 1_000 back + proportional share of Bob's 500
        // winningsPerShare = 500 * 1e18 / 1000 = 0.5e18
        // claimable = 1000 + (1000 * 0.5e18 / 1e18) = 1500
        assertEq(ledger.freeBalance(aliceScout, 0), 10_500);
        assertEq(leaderboard.getScore(aliceScout, 0), 500);

        // 5. Bob is the loser; finalize his position to record the negative score.
        market.finalizePosition(marketId, bobScout);
        assertEq(ledger.freeBalance(bobScout, 0), 9_500);
        assertEq(leaderboard.getScore(bobScout, 0), -500);

        // Bob cannot claim because claimableCredits == 0.
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(NoClaimableCredits.selector, marketId, bobScout));
        market.claim(marketId);

        // 6. Leaderboard ranking
        (bytes32[] memory topScouts, int256[] memory topScores) = leaderboard.getTopN(0, 2);
        assertEq(topScouts[0], aliceScout);
        assertEq(topScores[0], 500);
        assertEq(topScouts[1], bobScout);
        assertEq(topScores[1], -500);

        // 7. Credit conservation invariant across the season
        uint256 accounted = ledger.freeBalance(aliceScout, 0) + ledger.freeBalance(bobScout, 0)
            + ledger.marketLockedCredits(marketId) + ledger.seasonProtocolReserve(0);
        assertEq(accounted, ledger.totalMintedCredits(0));
    }

    function testVoidMarketLifecycle() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);

        vm.warp(block.timestamp + 15 days);
        market.forceVoid(marketId);

        vm.prank(alice);
        market.claim(marketId);

        assertEq(ledger.freeBalance(aliceScout, 0), 10_000);
        assertEq(leaderboard.getScore(aliceScout, 0), 0);
    }

    function testSweepExpiredRemainder() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);

        vm.warp(block.timestamp + 8 days);
        vm.prank(settler);
        market.settle(marketId, true);

        // Alice never claims
        vm.warp(block.timestamp + 8 days + 7 days + 1);
        market.sweepExpiredRemainder(marketId);

        assertEq(ledger.marketLockedCredits(marketId), 0);
        assertEq(ledger.seasonProtocolReserve(0), 1_000);

        uint256 accounted = ledger.freeBalance(aliceScout, 0) + ledger.freeBalance(bobScout, 0)
            + ledger.seasonProtocolReserve(0);
        assertEq(accounted, ledger.totalMintedCredits(0));
    }

    function testMultipleMarketsInOneSeason() public {
        uint256 m0 = _createMarket();
        uint256 m1 = _createMarket();

        vm.prank(alice);
        market.takePosition(m0, Side.YES, 1_000);

        vm.prank(bob);
        market.takePosition(m0, Side.NO, 500);

        vm.prank(alice);
        market.takePosition(m1, Side.NO, 500);

        vm.warp(block.timestamp + 8 days);
        vm.startPrank(settler);
        market.settle(m0, true);
        market.settle(m1, false);
        vm.stopPrank();

        vm.prank(alice);
        market.claim(m0);

        vm.prank(alice);
        market.claim(m1);

        // m0 YES win with opponent: +500
        // m1 NO win without opponent: scoreDelta 0 (no losing stakes to redistribute)
        assertEq(leaderboard.getScore(aliceScout, 0), 500);
    }

    function _createMarket() private returns (uint256 marketId) {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256(abi.encodePacked(market.nextMarketId())),
            metadataURI: "ipfs://test",
            seasonId: 0,
            tradingDeadline: block.timestamp + 1 days,
            resolutionDeadline: block.timestamp + 7 days,
            forceVoidDeadline: block.timestamp + 14 days,
            projectOwner: projectOwner
        });
        marketId = factory.createMarket(spec);
    }

    function _claim(uint256 userPk, bytes32 scoutId) private {
        uint256 deadline = block.timestamp + 1 days;
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId,
                uint256(0),
                vm.addr(userPk),
                block.chainid,
                address(ledger),
                ledger.claimNonce(vm.addr(userPk)),
                deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);

        vm.prank(vm.addr(userPk));
        ledger.claim(0, scoutId, deadline, abi.encodePacked(r, s, v));
    }
}
