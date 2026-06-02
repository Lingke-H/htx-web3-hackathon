// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ILeaderboard } from "./interfaces/ILeaderboard.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";

/// @title Leaderboard
/// @notice Records scout scores per season and provides ranked queries.
/// @dev Scores are updated exclusively by the Market contract. Ranking is computed
///      on-chain via insertion sort during view calls; suitable for modest participant counts.
contract Leaderboard is ILeaderboard, AccessManaged {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");

    /// @notice score[scoutId][seasonId] => total score
    mapping(bytes32 scoutId => mapping(uint256 seasonId => int256 score)) public scores;

    /// @notice Tracks whether a scout has already been registered for a season.
    mapping(bytes32 scoutId => mapping(uint256 seasonId => bool registered)) private _registered;

    /// @notice Ordered list of scoutIds that have participated in a season.
    mapping(uint256 seasonId => bytes32[] scoutIds) public seasonScouts;

    event ScoreUpdated(
        bytes32 indexed scoutId, uint256 indexed seasonId, int256 newScore, uint256 indexed marketId
    );

    /// @notice Update a scout's score for a given season and market.
    /// @param scoutId The unique scout identifier.
    /// @param seasonId The season in which the score changes.
    /// @param delta The amount to add (positive or negative).
    /// @param marketId The market that triggered the score update.
    function updateScore(bytes32 scoutId, uint256 seasonId, int256 delta, uint256 marketId)
        external
        onlyRole(MARKET_ROLE)
    {
        int256 newScore = scores[scoutId][seasonId] + delta;
        scores[scoutId][seasonId] = newScore;

        if (!_registered[scoutId][seasonId]) {
            _registered[scoutId][seasonId] = true;
            seasonScouts[seasonId].push(scoutId);
        }

        emit ScoreUpdated(scoutId, seasonId, newScore, marketId);
    }

    /// @notice Get a scout's total score for a season.
    /// @param scoutId The scout to query.
    /// @param seasonId The season to query.
    /// @return The scout's accumulated score.
    function getScore(bytes32 scoutId, uint256 seasonId) external view returns (int256) {
        return scores[scoutId][seasonId];
    }

    /// @notice Return the top N scouts for a season, sorted by score descending.
    /// @param seasonId The season to rank.
    /// @param topN The maximum number of results to return.
    /// @return rankedScouts Array of scout IDs.
    /// @return rankedScores Array of corresponding scores.
    function getTopN(uint256 seasonId, uint256 topN)
        external
        view
        returns (bytes32[] memory rankedScouts, int256[] memory rankedScores)
    {
        bytes32[] storage all = seasonScouts[seasonId];
        uint256 len = all.length;
        if (len == 0) {
            return (new bytes32[](0), new int256[](0));
        }

        // Cap topN to participant count.
        if (topN > len) topN = len;

        // Copy scores into a transient array for sorting.
        int256[] memory tempScores = new int256[](len);
        bytes32[] memory tempScouts = new bytes32[](len);
        for (uint256 i = 0; i < len; i++) {
            tempScouts[i] = all[i];
            tempScores[i] = scores[all[i]][seasonId];
        }

        // Selection sort (descending) — acceptable for modest N in a view function.
        for (uint256 i = 0; i < topN; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < len; j++) {
                if (tempScores[j] > tempScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                (tempScores[i], tempScores[maxIdx]) = (tempScores[maxIdx], tempScores[i]);
                (tempScouts[i], tempScouts[maxIdx]) = (tempScouts[maxIdx], tempScouts[i]);
            }
        }

        rankedScouts = new bytes32[](topN);
        rankedScores = new int256[](topN);
        for (uint256 i = 0; i < topN; i++) {
            rankedScouts[i] = tempScouts[i];
            rankedScores[i] = tempScores[i];
        }
    }

    /// @notice Return the total number of unique scouts that have participated in a season.
    /// @param seasonId The season to query.
    function getSeasonParticipantCount(uint256 seasonId) external view returns (uint256) {
        return seasonScouts[seasonId].length;
    }
}
