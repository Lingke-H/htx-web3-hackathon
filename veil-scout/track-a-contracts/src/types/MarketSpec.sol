// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Result, Side, Status } from "./Enums.sol";

struct MarketSpec {
    bytes32 specHash;
    string metadataURI;
    uint256 seasonId;
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
    address projectOwner;
}

struct MarketData {
    bytes32 specHash;
    string metadataURI;
    uint256 seasonId;
    uint256 tradingDeadline;
    uint256 resolutionDeadline;
    uint256 forceVoidDeadline;
    uint256 claimDeadline;
    address projectOwner;
    uint256 yesStake;
    uint256 noStake;
    uint256 winningsPerShare;
    Status status;
    Result result;
}

struct Position {
    Side side;
    uint256 yesStake;
    uint256 noStake;
    bool finalized;
    bool claimed;
    uint256 claimableCredits;
    int256 scoreDelta;
}

struct SeasonInfo {
    uint256 startTime;
    uint256 endTime;
    bool isActive;
}
