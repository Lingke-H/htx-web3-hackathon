// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { CreditLedger } from "../src/CreditLedger.sol";
import { ISeason } from "../src/interfaces/ISeason.sol";
import { Season } from "../src/Season.sol";

/// @title CreditLedgerInvariantTest
/// @notice Invariant: for any season, totalMintedCredits must equal the sum of
///         all free balances + all market-locked credits + protocol reserve.
contract CreditLedgerInvariantTest is Test {
    uint256 private constant SIGNER_PK = 0xA11CE;

    bytes32 private constant MARKET_ROLE = keccak256("MARKET_ROLE");

    Season private season;
    CreditLedger private ledger;
    address private marketActor = address(0xA11);

    function setUp() public {
        vm.warp(1_000);
        address signer = vm.addr(SIGNER_PK);

        season = new Season();
        season.createSeason(block.timestamp, block.timestamp + 30 days);
        ledger = new CreditLedger(ISeason(address(season)), signer);
        ledger.grantRole(MARKET_ROLE, marketActor);
    }

    function invariant_creditConservationPerSeason() public view {
        uint256 seasonId = 0;
        uint256 totalMinted = ledger.totalMintedCredits(seasonId);
        if (totalMinted == 0) return;

        uint256 totalFree = ledger.freeBalance(keccak256("scout-a"), seasonId)
            + ledger.freeBalance(keccak256("scout-b"), seasonId)
            + ledger.freeBalance(keccak256("scout-c"), seasonId);

        uint256 totalLocked = ledger.marketLockedCredits(0) + ledger.marketLockedCredits(1)
            + ledger.marketLockedCredits(2);

        uint256 reserve = ledger.seasonProtocolReserve(seasonId);

        assertEq(totalFree + totalLocked + reserve, totalMinted, "credit conservation violated");
    }
}
