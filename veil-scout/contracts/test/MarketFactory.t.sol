// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { Season } from "../src/Season.sol";
import { Market } from "../src/Market.sol";
import { MarketFactory } from "../src/MarketFactory.sol";
import { CreditLedger } from "../src/CreditLedger.sol";
import { Leaderboard } from "../src/Leaderboard.sol";
import { ICreditLedger } from "../src/interfaces/ICreditLedger.sol";
import { ILeaderboard } from "../src/interfaces/ILeaderboard.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";
import { MarketData, MarketSpec } from "../src/types/MarketSpec.sol";
import { Unauthorized } from "../src/types/Errors.sol";

contract MarketFactoryTest is Test {
    bytes32 private constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");

    Season private season;
    CreditLedger private ledger;
    Leaderboard private leaderboard;
    Market private market;
    MarketFactory private factory;

    address private creator = address(0xC0FFEE);
    address private admin;

    function setUp() public {
        admin = address(this);
        vm.warp(10_000);

        season = new Season();
        season.createSeason(block.timestamp, block.timestamp + 60 days);

        ledger = new CreditLedger(ISeason(address(season)), address(0xA11CE));
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
        factory.grantRole(MARKET_CREATOR_ROLE, creator);
    }

    function testCreateMarketThroughFactory() public {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256("test"),
            metadataURI: "ipfs://test",
            seasonId: 0,
            tradingDeadline: block.timestamp + 1 days,
            resolutionDeadline: block.timestamp + 7 days,
            forceVoidDeadline: block.timestamp + 14 days,
            projectOwner: address(0xBEEF)
        });

        vm.prank(creator);
        uint256 marketId = factory.createMarket(spec);
        assertEq(marketId, 0);

        MarketData memory data = market.getMarket(0);
        assertEq(data.specHash, spec.specHash);
        assertEq(data.seasonId, 0);
    }

    function testFactoryEmitsEvent() public {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256("test"),
            metadataURI: "ipfs://test",
            seasonId: 0,
            tradingDeadline: block.timestamp + 1 days,
            resolutionDeadline: block.timestamp + 7 days,
            forceVoidDeadline: block.timestamp + 14 days,
            projectOwner: address(0xBEEF)
        });

        vm.prank(creator);
        vm.expectEmit(true, true, false, false);
        emit MarketFactory.FactoryMarketCreated(0, creator);
        factory.createMarket(spec);
    }

    function testSetMarket() public {
        address newMarket = address(0x1234);
        factory.setMarket(newMarket);
        assertEq(factory.market(), newMarket);
    }

    function testSetMarketRevertsForNonAdmin() public {
        vm.prank(address(0xABCD));
        vm.expectRevert(Unauthorized.selector);
        factory.setMarket(address(0x1234));
    }

    function testCreateMarketRevertsForUnauthorized() public {
        MarketSpec memory spec = MarketSpec({
            specHash: keccak256("test"),
            metadataURI: "ipfs://test",
            seasonId: 0,
            tradingDeadline: block.timestamp + 1 days,
            resolutionDeadline: block.timestamp + 7 days,
            forceVoidDeadline: block.timestamp + 14 days,
            projectOwner: address(0xBEEF)
        });

        vm.prank(address(0xABCD));
        vm.expectRevert(Unauthorized.selector);
        factory.createMarket(spec);
    }

    function testConstructorSetsMarket() public {
        MarketFactory f = new MarketFactory(address(0x9999));
        assertEq(f.market(), address(0x9999));
    }
}
