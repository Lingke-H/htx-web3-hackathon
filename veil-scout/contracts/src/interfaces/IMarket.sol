// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MarketSpec } from "../types/MarketSpec.sol";

interface IMarket {
    function createMarket(MarketSpec calldata spec, address creator)
        external
        returns (uint256 marketId);
}
