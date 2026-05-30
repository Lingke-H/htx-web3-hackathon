// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISeason
/// @notice Interface for season lifecycle management.
interface ISeason {
    /// @notice Check whether a season is currently active.
    function isSeasonActive(uint256 seasonId) external view returns (bool);

    /// @notice Retrieve season timing and state.
    /// @return startTime The season start timestamp.
    /// @return endTime The season end timestamp.
    /// @return isActive Whether the season is still active.
    function getSeason(uint256 seasonId)
        external
        view
        returns (uint256 startTime, uint256 endTime, bool isActive);
}
