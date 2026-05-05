// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessManaged } from "./utils/AccessManaged.sol";

contract Leaderboard is AccessManaged {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");

    mapping(bytes32 scoutId => mapping(uint256 seasonId => int256 score)) public scores;

    event ScoreUpdated(
        bytes32 indexed scoutId, uint256 indexed seasonId, int256 newScore, uint256 indexed marketId
    );

    function updateScore(bytes32 scoutId, uint256 seasonId, int256 delta, uint256 marketId)
        external
        onlyRole(MARKET_ROLE)
    {
        int256 newScore = scores[scoutId][seasonId] + delta;
        scores[scoutId][seasonId] = newScore;
        emit ScoreUpdated(scoutId, seasonId, newScore, marketId);
    }

    function getScore(bytes32 scoutId, uint256 seasonId) external view returns (int256) {
        return scores[scoutId][seasonId];
    }
}
