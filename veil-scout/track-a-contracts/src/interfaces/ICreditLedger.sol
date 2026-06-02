// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICreditLedger
/// @notice Interface for the non-transferable credit ledger.
interface ICreditLedger {
    /// @notice Claim season credits using an off-chain signature.
    function claim(uint256 seasonId, bytes32 scoutId, uint256 deadline, bytes calldata signature)
        external;

    /// @notice Register a market against a season (callable only by Market).
    function registerMarket(uint256 marketId, uint256 seasonId) external;

    /// @notice Atomically lock free credits into a market.
    function lockForTrade(bytes32 scoutId, uint256 seasonId, uint256 marketId, uint256 amount)
        external;

    /// @notice Release locked credits back to a scout.
    function releaseToScout(bytes32 scoutId, uint256 seasonId, uint256 marketId, uint256 amount)
        external;

    /// @notice Move locked credits to the protocol reserve.
    function moveLockedToReserve(uint256 seasonId, uint256 marketId, uint256 amount) external;

    /// @notice Get a scout's free balance for a season.
    function freeBalanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256);

    /// @notice Get the scoutId bound to a wallet.
    function scoutIdOf(address wallet) external view returns (bytes32);

    /// @notice Get locked credits for a market.
    function marketLockedCredits(uint256 marketId) external view returns (uint256);

    /// @notice Get the season a market belongs to.
    function marketSeason(uint256 marketId) external view returns (uint256);
}
