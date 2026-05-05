// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISeason {
    function isSeasonActive(uint256 seasonId) external view returns (bool);

    function getSeason(uint256 seasonId)
        external
        view
        returns (uint256 startTime, uint256 endTime, bool isActive);
}
