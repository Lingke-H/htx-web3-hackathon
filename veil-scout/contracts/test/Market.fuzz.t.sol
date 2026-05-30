// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { Season } from "../src/Season.sol";
import { CreditLedger } from "../src/CreditLedger.sol";
import { Leaderboard } from "../src/Leaderboard.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { ICreditLedger } from "../src/interfaces/ICreditLedger.sol";
import { ILeaderboard } from "../src/interfaces/ILeaderboard.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";
import { Side } from "../src/types/Enums.sol";
import { MarketSpec } from "../src/types/MarketSpec.sol";

/// @title MarketFuzzTest
/// @notice Fuzz tests for market math and edge cases.
contract MarketFuzzTest is Test {
    uint256 private constant SIGNER_PK = 0xA11CE;

    Season private season;
    CreditLedger private ledger;
    Leaderboard private leaderboard;
    Market private market;
    MarketFactory private factory;

    address private signer;
    address private projectOwner = address(0xBEEF);

    function setUp() public {
        vm.warp(10_000);
        signer = vm.addr(SIGNER_PK);

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
        factory.grantRole(factory.MARKET_CREATOR_ROLE(), address(this));
    }

    /// @notice Fuzz: odds must always be within [MIN_ODDS_BPS, MAX_ODDS_BPS].
    function testFuzz_YesOddsAlwaysClamped(uint256 yesStake, uint256 noStake) public {
        uint256 marketId = _createMarket();

        // Bound stakes to per-scout cap so a single scout can take the position.
        yesStake = bound(yesStake, 0, market.MAX_STAKE_PER_MARKET());
        noStake = bound(noStake, 0, market.MAX_STAKE_PER_MARKET());

        if (yesStake > 0) {
            address yesScout = _claimNewScout("yes");
            vm.prank(yesScout);
            market.takePosition(marketId, Side.YES, yesStake);
        }
        if (noStake > 0) {
            address noScout = _claimNewScout("no");
            vm.prank(noScout);
            market.takePosition(marketId, Side.NO, noStake);
        }

        uint256 odds = market.getYesOdds(marketId);
        assertGe(odds, market.MIN_ODDS_BPS(), "odds below min");
        assertLe(odds, market.MAX_ODDS_BPS(), "odds above max");
    }

    /// @notice Fuzz: when total stake is zero, odds should be exactly 50%.
    function testFuzz_ZeroStakeReturnsFiftyPercent() public {
        uint256 marketId = _createMarket();
        uint256 odds = market.getYesOdds(marketId);
        assertEq(odds, market.PRICE_BASIS() / 2, "empty market odds must be 50%");
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

    function _claimNewScout(string memory salt) private returns (address wallet) {
        uint256 pk = uint256(keccak256(abi.encodePacked(salt, block.timestamp)));
        wallet = vm.addr(pk);
        bytes32 scoutId = keccak256(abi.encodePacked(salt));
        uint256 deadline = block.timestamp + 1 days;
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId, uint256(0), wallet, block.chainid, address(ledger), ledger.claimNonce(wallet), deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);

        vm.prank(wallet);
        ledger.claim(0, scoutId, deadline, abi.encodePacked(r, s, v));
    }
}
