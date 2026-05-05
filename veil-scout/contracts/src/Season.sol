// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SeasonInfo } from "./types/MarketSpec.sol";
import {
    InvalidSeason,
    InvalidSeasonWindow,
    SeasonAlreadyEnded,
    SeasonNotActive
} from "./types/Errors.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";

contract Season is AccessManaged {
    mapping(uint256 seasonId => SeasonInfo info) public seasons;

    uint256 public currentSeasonId;
    uint256 private _nextSeasonId;

    event SeasonCreated(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
    event SeasonEnded(uint256 indexed seasonId);

    function createSeason(uint256 startTime, uint256 endTime)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (startTime >= endTime || endTime <= block.timestamp) {
            revert InvalidSeasonWindow(startTime, endTime);
        }

        uint256 seasonId = _nextSeasonId++;
        seasons[seasonId] = SeasonInfo({ startTime: startTime, endTime: endTime, isActive: true });
        currentSeasonId = seasonId;

        emit SeasonCreated(seasonId, startTime, endTime);
    }

    function endSeason(uint256 seasonId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        SeasonInfo storage season = seasons[seasonId];
        if (season.endTime == 0) revert InvalidSeason(seasonId);
        if (!season.isActive) revert SeasonAlreadyEnded(seasonId);

        season.isActive = false;
        emit SeasonEnded(seasonId);
    }

    function isSeasonActive(uint256 seasonId) external view returns (bool) {
        SeasonInfo storage season = seasons[seasonId];
        return
            season.isActive && season.startTime <= block.timestamp
                && block.timestamp <= season.endTime;
    }

    function getSeason(uint256 seasonId)
        external
        view
        returns (uint256 startTime, uint256 endTime, bool isActive)
    {
        SeasonInfo storage season = seasons[seasonId];
        if (season.endTime == 0) revert InvalidSeason(seasonId);
        return (season.startTime, season.endTime, season.isActive);
    }

    function requireActiveSeason(uint256 seasonId) external view {
        SeasonInfo storage season = seasons[seasonId];
        if (
            !season.isActive || season.startTime > block.timestamp
                || block.timestamp > season.endTime
        ) {
            revert SeasonNotActive(seasonId);
        }
    }
}
