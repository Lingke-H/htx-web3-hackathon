// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IMarket } from "./interfaces/IMarket.sol";
import { MarketSpec } from "./types/MarketSpec.sol";
import { InvalidMarketSpec } from "./types/Errors.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";

/// @title MarketFactory
/// @notice Thin entry point for creating new prediction markets.
/// @dev Validates the caller has MARKET_CREATOR_ROLE and delegates market creation
///      to the canonical Market contract. Holds no persistent market state itself.
contract MarketFactory is AccessManaged {
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");

    /// @notice The canonical Market contract address used to instantiate markets.
    address public market;

    event MarketAddressUpdated(address indexed market);
    event FactoryMarketCreated(uint256 indexed marketId, address indexed creator);

    /// @param market_ The address of the Market implementation contract.
    constructor(address market_) {
        if (market_ == address(0)) revert InvalidMarketSpec();
        market = market_;
        emit MarketAddressUpdated(market_);
    }

    /// @notice Update the canonical Market contract address.
    /// @param market_ The new Market contract address.
    function setMarket(address market_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (market_ == address(0)) revert InvalidMarketSpec();
        market = market_;
        emit MarketAddressUpdated(market_);
    }

    /// @notice Create a new market by forwarding the spec to the Market contract.
    /// @param spec The market specification including deadlines, season, and metadata.
    /// @return marketId The ID of the newly created market.
    function createMarket(MarketSpec calldata spec)
        external
        onlyRole(MARKET_CREATOR_ROLE)
        returns (uint256 marketId)
    {
        marketId = IMarket(market).createMarket(spec, msg.sender);
        emit FactoryMarketCreated(marketId, msg.sender);
    }
}
