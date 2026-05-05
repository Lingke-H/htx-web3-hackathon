// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { CreditLedger } from "../src/CreditLedger.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";
import { Season } from "../src/Season.sol";
import {
    CreditsAlreadyClaimed,
    InsufficientBalance,
    InsufficientLockedCredits,
    InvalidSignature,
    MarketAlreadyRegistered,
    ScoutIdAlreadyBound,
    WalletAlreadyBound
} from "../src/types/Errors.sol";

contract CreditLedgerTest is Test {
    uint256 private constant SIGNER_PK = 0xA11CE;
    uint256 private constant USER_A_PK = 0xB0B;
    uint256 private constant USER_B_PK = 0xCAFE;

    bytes32 private constant MARKET_ROLE = keccak256("MARKET_ROLE");

    Season private season;
    CreditLedger private ledger;

    address private signer;
    address private userA;
    address private userB;
    address private marketActor = address(0xA11);

    event CreditsClaimed(
        bytes32 indexed scoutId, address indexed wallet, uint256 indexed seasonId, uint256 amount
    );
    event WalletBound(address indexed wallet, bytes32 indexed scoutId);

    function setUp() public {
        vm.warp(1_000);
        signer = vm.addr(SIGNER_PK);
        userA = vm.addr(USER_A_PK);
        userB = vm.addr(USER_B_PK);

        season = new Season();
        season.createSeason(block.timestamp, block.timestamp + 30 days);
        ledger = new CreditLedger(ISeason(address(season)), signer);
        ledger.grantRole(MARKET_ROLE, marketActor);
    }

    function testClaimBindsWalletAndMintsCredits() public {
        bytes32 scoutId = keccak256("scout-a");
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signature = _signature(USER_A_PK, scoutId, 0, deadline);

        vm.expectEmit(true, true, false, true);
        emit WalletBound(userA, scoutId);
        vm.expectEmit(true, true, true, true);
        emit CreditsClaimed(scoutId, userA, 0, 10_000);

        vm.prank(userA);
        ledger.claim(0, scoutId, deadline, signature);

        assertEq(ledger.scoutIdOf(userA), scoutId, "wallet bound");
        assertEq(ledger.walletOfScoutId(scoutId), userA, "scout bound");
        assertEq(ledger.freeBalance(scoutId, 0), 10_000, "credits minted");
        assertEq(ledger.totalMintedCredits(0), 10_000, "total minted");
    }

    function testCannotClaimSameSeasonTwice() public {
        bytes32 scoutId = keccak256("scout-a");
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signature = _signature(USER_A_PK, scoutId, 0, deadline);

        vm.prank(userA);
        ledger.claim(0, scoutId, deadline, signature);

        bytes memory secondSignature = _signature(USER_A_PK, scoutId, 0, deadline);
        vm.prank(userA);
        vm.expectRevert(abi.encodeWithSelector(CreditsAlreadyClaimed.selector, scoutId, 0));
        ledger.claim(0, scoutId, deadline, secondSignature);
    }

    function testCannotBindWalletToDifferentScout() public {
        bytes32 scoutA = keccak256("scout-a");
        bytes32 scoutB = keccak256("scout-b");
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signatureA = _signature(USER_A_PK, scoutA, 0, deadline);

        vm.prank(userA);
        ledger.claim(0, scoutA, deadline, signatureA);

        bytes memory signatureB = _signature(USER_A_PK, scoutB, 0, deadline);
        vm.prank(userA);
        vm.expectRevert(abi.encodeWithSelector(WalletAlreadyBound.selector, userA));
        ledger.claim(0, scoutB, deadline, signatureB);
    }

    function testCannotBindScoutToDifferentWallet() public {
        bytes32 scoutId = keccak256("scout-a");
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signatureA = _signature(USER_A_PK, scoutId, 0, deadline);

        vm.prank(userA);
        ledger.claim(0, scoutId, deadline, signatureA);

        season.createSeason(block.timestamp, block.timestamp + 60 days);
        bytes memory signatureB = _signature(USER_B_PK, scoutId, 1, deadline);
        vm.prank(userB);
        vm.expectRevert(abi.encodeWithSelector(ScoutIdAlreadyBound.selector, scoutId));
        ledger.claim(1, scoutId, deadline, signatureB);
    }

    function testLockForTradeRevertsWhenBalanceIsInsufficient() public {
        bytes32 scoutId = keccak256("scout-a");
        _registerMarket(1, 0);

        vm.prank(marketActor);
        vm.expectRevert(abi.encodeWithSelector(InsufficientBalance.selector, scoutId, 0, 0, 1));
        ledger.lockForTrade(scoutId, 0, 1, 1);
    }

    function testReleaseToScoutRevertsWhenAmountExceedsLockedCredits() public {
        bytes32 scoutId = keccak256("scout-a");
        _registerMarket(1, 0);

        vm.prank(marketActor);
        vm.expectRevert(abi.encodeWithSelector(InsufficientLockedCredits.selector, 1, 0, 1));
        ledger.releaseToScout(scoutId, 0, 1, 1);
    }

    function testMoveLockedToReserveRevertsWhenAmountExceedsLockedCredits() public {
        _registerMarket(1, 0);

        vm.prank(marketActor);
        vm.expectRevert(abi.encodeWithSelector(InsufficientLockedCredits.selector, 1, 0, 1));
        ledger.moveLockedToReserve(0, 1, 1);
    }

    function testRegisterMarketRevertsWhenMarketAlreadyRegistered() public {
        _registerMarket(1, 0);

        vm.prank(marketActor);
        vm.expectRevert(abi.encodeWithSelector(MarketAlreadyRegistered.selector, 1));
        ledger.registerMarket(1, 0);
    }

    function testRegisterMarketRevertsWhenSeasonIsNotActive() public {
        season.createSeason(block.timestamp + 1 days, block.timestamp + 30 days);

        vm.prank(marketActor);
        vm.expectRevert(InvalidSignature.selector);
        ledger.registerMarket(1, 1);
    }

    function testSeasonCreditConservationInvariant() public {
        bytes32 scoutA = keccak256("scout-a");
        bytes32 scoutB = keccak256("scout-b");
        _claim(USER_A_PK, scoutA, 0);
        _claim(USER_B_PK, scoutB, 0);
        _registerMarket(1, 0);

        vm.startPrank(marketActor);
        ledger.lockForTrade(scoutA, 0, 1, 1_000);
        ledger.lockForTrade(scoutB, 0, 1, 2_000);
        ledger.releaseToScout(scoutA, 0, 1, 500);
        ledger.moveLockedToReserve(0, 1, 700);
        vm.stopPrank();

        uint256 accounted = ledger.freeBalance(scoutA, 0) + ledger.freeBalance(scoutB, 0)
            + ledger.marketLockedCredits(1) + ledger.seasonProtocolReserve(0);
        assertEq(accounted, ledger.totalMintedCredits(0), "credits conserved");
    }

    function _registerMarket(uint256 marketId, uint256 seasonId) private {
        vm.prank(marketActor);
        ledger.registerMarket(marketId, seasonId);
    }

    function _claim(uint256 userPk, bytes32 scoutId, uint256 seasonId) private {
        uint256 deadline = block.timestamp + 1 days;
        bytes memory signature = _signature(userPk, scoutId, seasonId, deadline);

        vm.prank(vm.addr(userPk));
        ledger.claim(seasonId, scoutId, deadline, signature);
    }

    function _signature(uint256 userPk, bytes32 scoutId, uint256 seasonId, uint256 deadline)
        private
        view
        returns (bytes memory)
    {
        address user = vm.addr(userPk);
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId,
                seasonId,
                user,
                block.chainid,
                address(ledger),
                ledger.claimNonce(user),
                deadline
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, digest);
        return abi.encodePacked(r, s, v);
    }
}
