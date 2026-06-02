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
import { MarketData, MarketSpec } from "../src/types/MarketSpec.sol";
import {
    AlreadySettled,
    AlreadyVoided,
    CannotSweepYet,
    ClaimWindowExpired,
    ExceedsMaxStake,
    ForceVoidTooEarly,
    NoClaimableCredits,
    NoPosition,
    NoRemainderToSweep,
    PositionAlreadyFinalized,
    ProjectOwnerCannotTrade,
    SettlementTooEarly,
    SingleSideOnly,
    TradingClosed,
    Unauthorized,
    WinningsAlreadyClaimed
} from "../src/types/Errors.sol";

contract MarketTest is Test {
    uint256 private constant SIGNER_PK = 0xA11CE;
    uint256 private constant ALICE_PK = 0xA1;
    uint256 private constant BOB_PK = 0xB0;
    uint256 private constant CHARLIE_PK = 0xC0;
    uint256 private constant DANA_PK = 0xDA;

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
    address private charlie;
    address private dana;
    address private creator = address(0xC0FFEE);
    address private settler = address(0x5157);
    address private projectOwner = address(0xBEEF);

    bytes32 private aliceScout = keccak256("alice");
    bytes32 private bobScout = keccak256("bob");
    bytes32 private charlieScout = keccak256("charlie");
    bytes32 private danaScout = keccak256("dana");

    function setUp() public {
        vm.warp(10_000);
        signer = vm.addr(SIGNER_PK);
        alice = vm.addr(ALICE_PK);
        bob = vm.addr(BOB_PK);
        charlie = vm.addr(CHARLIE_PK);
        dana = vm.addr(DANA_PK);

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

        ledger.grantRole(MARKET_ROLE, address(market));
        leaderboard.grantRole(MARKET_ROLE, address(market));
        market.grantRole(MARKET_CREATOR_ROLE, address(factory));
        market.grantRole(SETTLEMENT_ROLE, settler);
        factory.grantRole(MARKET_CREATOR_ROLE, creator);

        _claim(ALICE_PK, aliceScout);
        _claim(BOB_PK, bobScout);
        _claim(CHARLIE_PK, charlieScout);
        _claim(DANA_PK, danaScout);
    }

    function testWinningSideClaimsProportionalPayout() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);

        market.finalizePosition(marketId, aliceScout);
        market.finalizePosition(marketId, bobScout);

        vm.prank(alice);
        market.claim(marketId);

        assertEq(ledger.freeBalance(aliceScout, 0), 11_000, "alice payout");
        assertEq(leaderboard.scores(aliceScout, 0), 1_000, "alice score");
        assertEq(leaderboard.scores(bobScout, 0), -1_000, "bob score");
        assertEq(ledger.marketLockedCredits(marketId), 0, "market emptied");
    }

    function testMultiWinnerPayoutsAreProportional() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.YES, 2_000);
        vm.prank(charlie);
        market.takePosition(marketId, Side.NO, 2_000);
        vm.prank(dana);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);

        market.finalizePosition(marketId, aliceScout);
        market.finalizePosition(marketId, bobScout);

        vm.prank(alice);
        market.claim(marketId);
        vm.prank(bob);
        market.claim(marketId);

        assertEq(ledger.freeBalance(aliceScout, 0), 11_000, "alice 1x profit");
        assertEq(ledger.freeBalance(bobScout, 0), 12_000, "bob 2x profit");
        assertEq(leaderboard.scores(aliceScout, 0), 1_000, "alice score");
        assertEq(leaderboard.scores(bobScout, 0), 2_000, "bob score");
        assertEq(ledger.marketLockedCredits(marketId), 0, "winners drain payout pool");
    }

    function testVoidRefundsWithoutScoreDelta() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);

        market.voidMarket(marketId, "bad spec");
        market.finalizePosition(marketId, aliceScout);

        vm.prank(alice);
        market.claim(marketId);

        assertEq(ledger.freeBalance(aliceScout, 0), 10_000, "refund");
        assertEq(leaderboard.scores(aliceScout, 0), 0, "void no score");
    }

    function testNoWinnerMovesLockedCreditsToReserve() public {
        uint256 marketId = _createMarket();

        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);

        market.finalizePosition(marketId, bobScout);
        assertEq(leaderboard.scores(bobScout, 0), -1_000, "loser score");
        assertEq(ledger.seasonProtocolReserve(0), 1_000, "reserve");
        assertEq(ledger.marketLockedCredits(marketId), 0, "locked reserve");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(NoClaimableCredits.selector, marketId, bobScout));
        market.claim(marketId);
    }

    function testTakePositionRevertsAfterTradingDeadline() public {
        uint256 marketId = _createMarket();
        MarketData memory data = market.getMarket(marketId);
        vm.warp(data.tradingDeadline);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(TradingClosed.selector, marketId));
        market.takePosition(marketId, Side.YES, 1);
    }

    function testTakePositionRejectsProjectOwner() public {
        uint256 marketId = _createMarket();

        vm.prank(projectOwner);
        vm.expectRevert(
            abi.encodeWithSelector(ProjectOwnerCannotTrade.selector, marketId, projectOwner)
        );
        market.takePosition(marketId, Side.YES, 1);
    }

    function testTakePositionRejectsOppositeSide() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SingleSideOnly.selector, marketId, aliceScout));
        market.takePosition(marketId, Side.NO, 1);
    }

    function testTakePositionRejectsStakeOverCap() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 2_000);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ExceedsMaxStake.selector, marketId, 2_001, 2_000));
        market.takePosition(marketId, Side.YES, 1);
    }

    function testTakePositionRejectsUnboundWallet() public {
        uint256 marketId = _createMarket();

        vm.prank(address(0xBAD));
        vm.expectRevert(Unauthorized.selector);
        market.takePosition(marketId, Side.YES, 1);
    }

    function testSettleRevertsBeforeResolutionDeadline() public {
        uint256 marketId = _createMarket();
        MarketData memory data = market.getMarket(marketId);

        vm.prank(settler);
        vm.expectRevert(
            abi.encodeWithSelector(
                SettlementTooEarly.selector, marketId, block.timestamp, data.resolutionDeadline
            )
        );
        market.settle(marketId, true);
    }

    function testSettleRevertsWhenAlreadySettled() public {
        uint256 marketId = _createMarket();
        _settlePassed(marketId);

        vm.prank(settler);
        vm.expectRevert(abi.encodeWithSelector(AlreadySettled.selector, marketId));
        market.settle(marketId, true);
    }

    function testSettleRevertsWhenVoided() public {
        uint256 marketId = _createMarket();
        market.voidMarket(marketId, "bad spec");

        vm.prank(settler);
        vm.expectRevert(abi.encodeWithSelector(AlreadyVoided.selector, marketId));
        market.settle(marketId, true);
    }

    function testVoidMarketRevertsWhenAlreadySettled() public {
        uint256 marketId = _createMarket();
        _settlePassed(marketId);

        vm.expectRevert(abi.encodeWithSelector(AlreadySettled.selector, marketId));
        market.voidMarket(marketId, "bad spec");
    }

    function testForceVoidRevertsBeforeDeadline() public {
        uint256 marketId = _createMarket();
        MarketData memory data = market.getMarket(marketId);

        vm.expectRevert(
            abi.encodeWithSelector(
                ForceVoidTooEarly.selector, marketId, block.timestamp, data.forceVoidDeadline
            )
        );
        market.forceVoid(marketId);
    }

    function testFinalizePositionRevertsBeforeTerminalStatus() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);

        vm.expectRevert(abi.encodeWithSelector(TradingClosed.selector, marketId));
        market.finalizePosition(marketId, aliceScout);
    }

    function testFinalizePositionRevertsWhenAlreadyFinalized() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);
        market.finalizePosition(marketId, aliceScout);

        vm.expectRevert(
            abi.encodeWithSelector(PositionAlreadyFinalized.selector, marketId, aliceScout)
        );
        market.finalizePosition(marketId, aliceScout);
    }

    function testFinalizePositionRevertsWithoutPosition() public {
        uint256 marketId = _createMarket();
        _settlePassed(marketId);

        vm.expectRevert(abi.encodeWithSelector(NoPosition.selector, marketId, aliceScout));
        market.finalizePosition(marketId, aliceScout);
    }

    function testClaimRevertsWhenAlreadyClaimed() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);

        vm.prank(alice);
        market.claim(marketId);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(WinningsAlreadyClaimed.selector, marketId, aliceScout)
        );
        market.claim(marketId);
    }

    function testClaimRevertsAfterClaimDeadline() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);
        market.finalizePosition(marketId, aliceScout);

        uint256 claimDeadline = market.getMarket(marketId).claimDeadline;
        vm.warp(claimDeadline + 1);

        vm.expectRevert(
            abi.encodeWithSelector(
                ClaimWindowExpired.selector, marketId, block.timestamp, claimDeadline
            )
        );
        vm.prank(alice);
        market.claim(marketId);
    }

    function testClaimRevertsWhenNoClaimableCredits() public {
        uint256 marketId = _createMarket();

        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(NoClaimableCredits.selector, marketId, bobScout));
        market.claim(marketId);
    }

    function testSweepRevertsBeforeClaimDeadline() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);
        uint256 claimDeadline = market.getMarket(marketId).claimDeadline;

        vm.expectRevert(
            abi.encodeWithSelector(
                CannotSweepYet.selector, marketId, block.timestamp, claimDeadline
            )
        );
        market.sweepExpiredRemainder(marketId);
    }

    function testSweepRevertsWhenNoRemainderExists() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);
        vm.prank(alice);
        market.claim(marketId);

        vm.warp(market.getMarket(marketId).claimDeadline + 1);
        vm.expectRevert(abi.encodeWithSelector(NoRemainderToSweep.selector, marketId));
        market.sweepExpiredRemainder(marketId);
    }

    function testSweepRevertsWhenMarketStillTrading() public {
        uint256 marketId = _createMarket();

        vm.expectRevert(
            abi.encodeWithSelector(CannotSweepYet.selector, marketId, block.timestamp, 0)
        );
        market.sweepExpiredRemainder(marketId);
    }

    function testSweepMovesExpiredRemainderToReserve() public {
        uint256 marketId = _createMarket();

        vm.prank(alice);
        market.takePosition(marketId, Side.YES, 1_000);
        vm.prank(bob);
        market.takePosition(marketId, Side.NO, 1_000);

        _settlePassed(marketId);
        market.finalizePosition(marketId, aliceScout);
        vm.warp(market.getMarket(marketId).claimDeadline + 1);

        uint256 claimDeadline = market.getMarket(marketId).claimDeadline;
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ClaimWindowExpired.selector, marketId, block.timestamp, claimDeadline
            )
        );
        market.claim(marketId);

        market.sweepExpiredRemainder(marketId);
        assertEq(ledger.seasonProtocolReserve(0), 2_000, "expired swept");
    }

    function _createMarket() private returns (uint256 marketId) {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256("market-spec"),
            metadataURI: "ipfs://market",
            seasonId: 0,
            tradingDeadline: block.timestamp + 3 days,
            resolutionDeadline: block.timestamp + 7 days,
            forceVoidDeadline: block.timestamp + 14 days,
            projectOwner: projectOwner
        });

        vm.prank(creator);
        return factory.createMarket(spec);
    }

    function _settlePassed(uint256 marketId) private {
        MarketData memory data = market.getMarket(marketId);
        vm.warp(data.resolutionDeadline);
        vm.prank(settler);
        market.settle(marketId, true);
    }

    function _claim(uint256 userPk, bytes32 scoutId) private {
        address user = vm.addr(userPk);
        uint256 deadline = block.timestamp + 1 days;
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId,
                uint256(0),
                user,
                block.chainid,
                address(ledger),
                ledger.claimNonce(user),
                deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);

        vm.prank(user);
        ledger.claim(0, scoutId, deadline, abi.encodePacked(r, s, v));
    }
}
