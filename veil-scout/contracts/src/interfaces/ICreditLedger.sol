// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICreditLedger {
    function claim(uint256 seasonId, bytes32 scoutId, uint256 deadline, bytes calldata signature)
        external;

    function registerMarket(uint256 marketId, uint256 seasonId) external;

    function lockForTrade(bytes32 scoutId, uint256 seasonId, uint256 marketId, uint256 amount)
        external;

    function releaseToScout(bytes32 scoutId, uint256 seasonId, uint256 marketId, uint256 amount)
        external;

    function moveLockedToReserve(uint256 seasonId, uint256 marketId, uint256 amount) external;

    function freeBalanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);
    function scoutIdOf(address wallet) external view returns (bytes32);
    function marketLockedCredits(uint256 marketId) external view returns (uint256);
    function marketSeason(uint256 marketId) external view returns (uint256);
}
