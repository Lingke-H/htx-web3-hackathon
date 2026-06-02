// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketSpec } from "../types/MarketSpec.sol";

/// @title IMarket
/// @notice Interface for the core Market contract.
interface IMarket {
    /// @notice Create a new prediction market.
    /// @param spec The market specification.
    /// @param creator The address that initiated creation (typically MarketFactory).
    /// @return marketId The ID of the newly created market.
    function createMarket(MarketSpec calldata spec, address creator)
        external
        returns (uint256 marketId);
}
