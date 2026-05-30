// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { Season } from "../src/Season.sol";
import {
    InvalidSeason,
    InvalidSeasonWindow,
    SeasonAlreadyEnded,
    SeasonNotActive,
    Unauthorized
} from "../src/types/Errors.sol";

contract SeasonTest is Test {
    Season private season;

    function setUp() public {
        vm.warp(1_000);
        season = new Season();
    }

    function testCreateSeason() public {
        uint256 start = block.timestamp + 1 days;
        uint256 end = block.timestamp + 30 days;

        vm.expectEmit(true, false, false, true);
        emit Season.SeasonCreated(0, start, end);
        season.createSeason(start, end);

        (uint256 s, uint256 e, bool active) = season.getSeason(0);
        assertEq(s, start);
        assertEq(e, end);
        assertTrue(active);
        assertEq(season.currentSeasonId(), 0);
    }

    function testCreateSeasonRevertsWhenStartAfterEnd() public {
        uint256 start = block.timestamp + 30 days;
        uint256 end = block.timestamp + 1 days;

        vm.expectRevert(abi.encodeWithSelector(InvalidSeasonWindow.selector, start, end));
        season.createSeason(start, end);
    }

    function testCreateSeasonRevertsWhenEndInPast() public {
        uint256 start = block.timestamp - 500;
        uint256 end = block.timestamp - 100;

        vm.expectRevert(abi.encodeWithSelector(InvalidSeasonWindow.selector, start, end));
        season.createSeason(start, end);
    }

    function testIsSeasonActive() public {
        uint256 start = block.timestamp + 1 days;
        uint256 end = block.timestamp + 30 days;
        season.createSeason(start, end);

        assertFalse(season.isSeasonActive(0));

        vm.warp(start + 1);
        assertTrue(season.isSeasonActive(0));

        vm.warp(end + 1);
        assertFalse(season.isSeasonActive(0));
    }

    function testEndSeason() public {
        uint256 start = block.timestamp + 1;
        uint256 end = block.timestamp + 30 days;
        season.createSeason(start, end);

        vm.warp(start + 1);
        assertTrue(season.isSeasonActive(0));

        vm.expectEmit(true, false, false, false);
        emit Season.SeasonEnded(0);
        season.endSeason(0);

        assertFalse(season.isSeasonActive(0));
    }

    function testEndSeasonRevertsWhenAlreadyEnded() public {
        uint256 start = block.timestamp + 1;
        uint256 end = block.timestamp + 30 days;
        season.createSeason(start, end);
        season.endSeason(0);

        vm.expectRevert(abi.encodeWithSelector(SeasonAlreadyEnded.selector, 0));
        season.endSeason(0);
    }

    function testEndSeasonRevertsWhenInvalidSeason() public {
        vm.expectRevert(abi.encodeWithSelector(InvalidSeason.selector, 0));
        season.endSeason(0);
    }

    function testGetSeasonRevertsWhenInvalid() public {
        vm.expectRevert(abi.encodeWithSelector(InvalidSeason.selector, 0));
        season.getSeason(0);
    }

    function testRequireActiveSeasonRevertsWhenInactive() public {
        season.createSeason(block.timestamp + 1 days, block.timestamp + 30 days);

        vm.expectRevert(abi.encodeWithSelector(SeasonNotActive.selector, 0));
        season.requireActiveSeason(0);
    }

    function testMultipleSeasonsIncrementId() public {
        season.createSeason(block.timestamp + 1, block.timestamp + 10 days);
        season.createSeason(block.timestamp + 11 days, block.timestamp + 20 days);

        assertEq(season.currentSeasonId(), 1);
        (uint256 s0,,) = season.getSeason(0);
        (uint256 s1,,) = season.getSeason(1);
        assertEq(s0, block.timestamp + 1);
        assertEq(s1, block.timestamp + 11 days);
    }

    function testOnlyAdminCanCreateSeason() public {
        address nonAdmin = address(0xABCD);
        vm.prank(nonAdmin);
        vm.expectRevert(Unauthorized.selector);
        season.createSeason(block.timestamp + 1, block.timestamp + 10 days);
    }
}
