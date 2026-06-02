// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ILeaderboard
/// @notice Interface for the Leaderboard contract.
interface ILeaderboard {
    /// @notice Update a scout's score for a given season.
    function updateScore(bytes32 scoutId, uint256 seasonId, int256 delta, uint256 marketId) external;

    /// @notice Get a scout's total score for a season.
    function getScore(bytes32 scoutId, uint256 seasonId) external view returns (int256);

    /// @notice Return the top N scouts for a season, sorted by score descending.
    function getTopN(uint256 seasonId, uint256 topN)
        external
        view
        returns (bytes32[] memory rankedScouts, int256[] memory rankedScores);
}
