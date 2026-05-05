// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error InvalidSeason(uint256 seasonId);
error SeasonNotActive(uint256 seasonId);
error SeasonAlreadyEnded(uint256 seasonId);
error InvalidSeasonWindow(uint256 startTime, uint256 endTime);

error CreditsAlreadyClaimed(bytes32 scoutId, uint256 seasonId);
error InvalidSignature();
error SignatureExpired(uint256 current, uint256 deadline);
error WalletAlreadyBound(address wallet);
error ScoutIdAlreadyBound(bytes32 scoutId);
error ClaimSignerZero();
error InsufficientBalance(bytes32 scoutId, uint256 seasonId, uint256 balance, uint256 amount);
error MarketAlreadyRegistered(uint256 marketId);
error MarketNotRegistered(uint256 marketId);
error InvalidMarketSeason(uint256 marketId, uint256 expected, uint256 actual);
error InsufficientLockedCredits(uint256 marketId, uint256 locked, uint256 amount);

error MarketNotFound(uint256 marketId);
error InvalidMarketSpec();
error TradingClosed(uint256 marketId);
error ProjectOwnerCannotTrade(uint256 marketId, address owner);
error SingleSideOnly(uint256 marketId, bytes32 scoutId);
error ExceedsMaxStake(uint256 marketId, uint256 amount, uint256 maxAllowed);
error SettlementTooEarly(uint256 marketId, uint256 current, uint256 deadline);
error ForceVoidTooEarly(uint256 marketId, uint256 current, uint256 deadline);
error AlreadySettled(uint256 marketId);
error AlreadyVoided(uint256 marketId);
error PositionAlreadyFinalized(uint256 marketId, bytes32 scoutId);
error WinningsAlreadyClaimed(uint256 marketId, bytes32 scoutId);
error NotFinalized(uint256 marketId, bytes32 scoutId);
error NoPosition(uint256 marketId, bytes32 scoutId);
error NoClaimableCredits(uint256 marketId, bytes32 scoutId);
error ClaimWindowExpired(uint256 marketId, uint256 current, uint256 deadline);
error CannotSweepYet(uint256 marketId, uint256 current, uint256 deadline);
error NoRemainderToSweep(uint256 marketId);
error InvalidAmount();

error Unauthorized();
