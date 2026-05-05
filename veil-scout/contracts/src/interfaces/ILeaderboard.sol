// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILeaderboard {
    function updateScore(bytes32 scoutId, uint256 seasonId, int256 delta, uint256 marketId) external;

    function getScore(bytes32 scoutId, uint256 seasonId) external view returns (int256);
}
