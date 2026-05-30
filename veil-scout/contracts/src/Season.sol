// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SeasonInfo } from "./types/MarketSpec.sol";
import {
    InvalidSeason,
    InvalidSeasonWindow,
    SeasonAlreadyEnded,
    SeasonNotActive
} from "./types/Errors.sol";
import { ISeason } from "./interfaces/ISeason.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";

/// @title Season
/// @notice Manages the lifecycle of prediction seasons.
/// @dev A season defines a time-bounded window during which scouts can claim credits
///      and trade on markets. Seasons are created and ended by an admin.
contract Season is ISeason, AccessManaged {
    /// @notice seasonId => season metadata and state.
    mapping(uint256 seasonId => SeasonInfo info) public seasons;

    /// @notice The most recently created season ID.
    uint256 public currentSeasonId;

    /// @notice Counter for the next season to be created.
    uint256 private _nextSeasonId;

    event SeasonCreated(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
    event SeasonEnded(uint256 indexed seasonId);

    /// @notice Create a new season with the given time window.
    /// @param startTime The timestamp when the season becomes active.
    /// @param endTime The timestamp when the season expires.
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

    /// @notice End a season prematurely, preventing further activity.
    /// @param seasonId The season to end.
    function endSeason(uint256 seasonId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        SeasonInfo storage season = seasons[seasonId];
        if (season.endTime == 0) revert InvalidSeason(seasonId);
        if (!season.isActive) revert SeasonAlreadyEnded(seasonId);

        season.isActive = false;
        emit SeasonEnded(seasonId);
    }

    /// @notice Check whether a season is currently active.
    /// @param seasonId The season to query.
    /// @return True if the season exists, is active, and the current time is within its window.
    function isSeasonActive(uint256 seasonId) external view returns (bool) {
        SeasonInfo storage season = seasons[seasonId];
        return
            season.isActive && season.startTime <= block.timestamp
                && block.timestamp <= season.endTime;
    }

    /// @notice Retrieve the details of a season.
    /// @param seasonId The season to query.
    /// @return startTime The season start timestamp.
    /// @return endTime The season end timestamp.
    /// @return isActive Whether the season is still active.
    function getSeason(uint256 seasonId)
        external
        view
        returns (uint256 startTime, uint256 endTime, bool isActive)
    {
        SeasonInfo storage season = seasons[seasonId];
        if (season.endTime == 0) revert InvalidSeason(seasonId);
        return (season.startTime, season.endTime, season.isActive);
    }

    /// @notice Revert if the specified season is not currently active.
    /// @param seasonId The season to validate.
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
