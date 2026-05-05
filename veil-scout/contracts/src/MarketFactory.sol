// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IMarket } from "./interfaces/IMarket.sol";
import { MarketSpec } from "./types/MarketSpec.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";

contract MarketFactory is AccessManaged {
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");

    address public market;

    event MarketAddressUpdated(address indexed market);
    event FactoryMarketCreated(uint256 indexed marketId, address indexed creator);

    constructor(address market_) {
        market = market_;
        emit MarketAddressUpdated(market_);
    }

    function setMarket(address market_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        market = market_;
        emit MarketAddressUpdated(market_);
    }

    function createMarket(MarketSpec calldata spec)
        external
        onlyRole(MARKET_CREATOR_ROLE)
        returns (uint256 marketId)
    {
        marketId = IMarket(market).createMarket(spec, msg.sender);
        emit FactoryMarketCreated(marketId, msg.sender);
    }
}
