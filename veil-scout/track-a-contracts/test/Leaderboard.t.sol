// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { Leaderboard } from "../src/Leaderboard.sol";
import { Unauthorized } from "../src/types/Errors.sol";

contract LeaderboardTest is Test {
    bytes32 private constant MARKET_ROLE = keccak256("MARKET_ROLE");

    Leaderboard private leaderboard;
    address private marketActor = address(0xA11);

    function setUp() public {
        leaderboard = new Leaderboard();
        leaderboard.grantRole(MARKET_ROLE, marketActor);
    }

    function testUpdateScore() public {
        bytes32 scout = keccak256("scout-a");

        vm.prank(marketActor);
        leaderboard.updateScore(scout, 0, 100, 1);

        assertEq(leaderboard.getScore(scout, 0), 100);
    }

    function testUpdateScoreAccumulates() public {
        bytes32 scout = keccak256("scout-a");

        vm.startPrank(marketActor);
        leaderboard.updateScore(scout, 0, 100, 1);
        leaderboard.updateScore(scout, 0, 50, 2);
        vm.stopPrank();

        assertEq(leaderboard.getScore(scout, 0), 150);
    }

    function testUpdateScoreNegative() public {
        bytes32 scout = keccak256("scout-a");

        vm.startPrank(marketActor);
        leaderboard.updateScore(scout, 0, 100, 1);
        leaderboard.updateScore(scout, 0, -30, 2);
        vm.stopPrank();

        assertEq(leaderboard.getScore(scout, 0), 70);
    }

    function testUpdateScoreEmitsEvent() public {
        bytes32 scout = keccak256("scout-a");

        vm.prank(marketActor);
        vm.expectEmit(true, true, false, true);
        emit Leaderboard.ScoreUpdated(scout, 0, 100, 1);
        leaderboard.updateScore(scout, 0, 100, 1);
    }

    function testGetTopNSingleScout() public {
        bytes32 scout = keccak256("scout-a");

        vm.prank(marketActor);
        leaderboard.updateScore(scout, 0, 100, 1);

        (bytes32[] memory scouts, int256[] memory scores) = leaderboard.getTopN(0, 5);
        assertEq(scouts.length, 1);
        assertEq(scouts[0], scout);
        assertEq(scores[0], 100);
    }

    function testGetTopNSortsDescending() public {
        bytes32 scoutA = keccak256("scout-a");
        bytes32 scoutB = keccak256("scout-b");
        bytes32 scoutC = keccak256("scout-c");

        vm.startPrank(marketActor);
        leaderboard.updateScore(scoutA, 0, 50, 1);
        leaderboard.updateScore(scoutB, 0, 200, 1);
        leaderboard.updateScore(scoutC, 0, 100, 1);
        vm.stopPrank();

        (bytes32[] memory scouts, int256[] memory scores) = leaderboard.getTopN(0, 3);
        assertEq(scouts.length, 3);
        assertEq(scouts[0], scoutB);
        assertEq(scores[0], 200);
        assertEq(scouts[1], scoutC);
        assertEq(scores[1], 100);
        assertEq(scouts[2], scoutA);
        assertEq(scores[2], 50);
    }

    function testGetTopNCapsAtParticipantCount() public {
        bytes32 scoutA = keccak256("scout-a");

        vm.prank(marketActor);
        leaderboard.updateScore(scoutA, 0, 50, 1);

        (bytes32[] memory scouts, int256[] memory scores) = leaderboard.getTopN(0, 10);
        assertEq(scouts.length, 1);
        assertEq(scores.length, 1);
    }

    function testGetTopNReturnsEmptyForNoParticipants() public view {
        (bytes32[] memory scouts, int256[] memory scores) = leaderboard.getTopN(0, 5);
        assertEq(scouts.length, 0);
        assertEq(scores.length, 0);
    }

    function testGetTopNRespectsTopNParameter() public {
        bytes32 scoutA = keccak256("scout-a");
        bytes32 scoutB = keccak256("scout-b");
        bytes32 scoutC = keccak256("scout-c");

        vm.startPrank(marketActor);
        leaderboard.updateScore(scoutA, 0, 300, 1);
        leaderboard.updateScore(scoutB, 0, 200, 1);
        leaderboard.updateScore(scoutC, 0, 100, 1);
        vm.stopPrank();

        (bytes32[] memory scouts,) = leaderboard.getTopN(0, 2);
        assertEq(scouts.length, 2);
        assertEq(scouts[0], scoutA);
        assertEq(scouts[1], scoutB);
    }

    function testGetTopNAcrossMultipleSeasons() public {
        bytes32 scout = keccak256("scout-a");

        vm.startPrank(marketActor);
        leaderboard.updateScore(scout, 0, 100, 1);
        leaderboard.updateScore(scout, 1, 250, 1);
        vm.stopPrank();

        assertEq(leaderboard.getScore(scout, 0), 100);
        assertEq(leaderboard.getScore(scout, 1), 250);

        (, int256[] memory scores0) = leaderboard.getTopN(0, 1);
        assertEq(scores0[0], 100);

        (, int256[] memory scores1) = leaderboard.getTopN(1, 1);
        assertEq(scores1[0], 250);
    }

    function testGetSeasonParticipantCount() public {
        assertEq(leaderboard.getSeasonParticipantCount(0), 0);

        vm.prank(marketActor);
        leaderboard.updateScore(keccak256("a"), 0, 10, 1);
        assertEq(leaderboard.getSeasonParticipantCount(0), 1);

        vm.prank(marketActor);
        leaderboard.updateScore(keccak256("b"), 0, 20, 1);
        assertEq(leaderboard.getSeasonParticipantCount(0), 2);
    }

    function testUpdateScoreRevertsForNonMarket() public {
        vm.prank(address(0xABCD));
        vm.expectRevert(Unauthorized.selector);
        leaderboard.updateScore(keccak256("a"), 0, 10, 1);
    }

    function testGetTopNWithNegativeScores() public {
        bytes32 scoutA = keccak256("scout-a");
        bytes32 scoutB = keccak256("scout-b");

        vm.startPrank(marketActor);
        leaderboard.updateScore(scoutA, 0, -50, 1);
        leaderboard.updateScore(scoutB, 0, -10, 1);
        vm.stopPrank();

        (bytes32[] memory scouts, int256[] memory scores) = leaderboard.getTopN(0, 2);
        assertEq(scouts[0], scoutB);
        assertEq(scores[0], -10);
        assertEq(scouts[1], scoutA);
        assertEq(scores[1], -50);
    }
}
