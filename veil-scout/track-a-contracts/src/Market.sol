// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ICreditLedger } from "./interfaces/ICreditLedger.sol";
import { ILeaderboard } from "./interfaces/ILeaderboard.sol";
import { IMarket } from "./interfaces/IMarket.sol";
import { ISeason } from "./interfaces/ISeason.sol";
import { Result, Side, Status } from "./types/Enums.sol";
import { MarketData, MarketSpec, Position } from "./types/MarketSpec.sol";
import {
    AlreadySettled,
    AlreadyVoided,
    CannotSweepYet,
    ClaimWindowExpired,
    ExceedsMaxStake,
    ForceVoidTooEarly,
    InvalidAmount,
    InvalidMarketSpec,
    MarketNotFound,
    NoClaimableCredits,
    NoPosition,
    NoRemainderToSweep,
    PositionAlreadyFinalized,
    ProjectOwnerCannotTrade,
    SettlementTooEarly,
    SingleSideOnly,
    TradingClosed,
    Unauthorized,
    WinningsAlreadyClaimed
} from "./types/Errors.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";
import { ReentrancyGuard } from "./utils/ReentrancyGuard.sol";

/// @title Market
/// @notice Core prediction market logic: market creation, trading, settlement, claims, and sweeping.
/// @dev Integrates tightly with CreditLedger (funds), Leaderboard (scores), and Season (timing).
///      Enforces single-side positions, project-owner trading bans, and per-market stake caps.
contract Market is IMarket, AccessManaged, ReentrancyGuard {
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    /// @notice Maximum credits a scout can stake in a single market.
    uint256 public constant MAX_STAKE_PER_MARKET = 2_000;

    /// @notice Basis points denominator for odds calculations.
    uint256 public constant PRICE_BASIS = 10_000;

    /// @notice Minimum odds in basis points (5%).
    uint256 public constant MIN_ODDS_BPS = 500;

    /// @notice Maximum odds in basis points (95%).
    uint256 public constant MAX_ODDS_BPS = 9_500;

    /// @notice Scaling factor for proportional payout math.
    uint256 public constant PAYOUT_SCALE = 1e18;

    /// @notice Duration after settlement/void during which winners can claim.
    uint256 public constant CLAIM_WINDOW = 7 days;

    /// @notice The next market ID to be assigned.
    uint256 public nextMarketId;

    /// @notice marketId => market state.
    mapping(uint256 marketId => MarketData marketData) public markets;

    /// @notice marketId => scoutId => position details.
    mapping(uint256 marketId => mapping(bytes32 scoutId => Position position)) public positions;

    /// @notice Immutable reference to the CreditLedger contract.
    ICreditLedger public immutable creditLedger;

    /// @notice Immutable reference to the Leaderboard contract.
    ILeaderboard public immutable leaderboard;

    /// @notice Immutable reference to the Season contract.
    ISeason public immutable season;

    event MarketCreated(
        uint256 indexed marketId,
        uint256 indexed seasonId,
        address indexed creator,
        address projectOwner,
        bytes32 specHash,
        string metadataURI,
        uint256 tradingDeadline,
        uint256 resolutionDeadline,
        uint256 forceVoidDeadline
    );

    event PositionTaken(
        uint256 indexed marketId, bytes32 indexed scoutId, Side side, uint256 amount
    );

    event MarketSettled(
        uint256 indexed marketId,
        bool passed,
        uint256 totalLosingStakes,
        uint256 totalWinningStakes,
        uint256 claimDeadline
    );

    event PositionFinalized(
        uint256 indexed marketId,
        bytes32 indexed scoutId,
        uint256 claimableCredits,
        int256 scoreDelta
    );

    event WinningsClaimed(uint256 indexed marketId, bytes32 indexed scoutId, uint256 amount);
    event MarketVoided(uint256 indexed marketId, string reasonURI, uint256 claimDeadline);
    event Refunded(uint256 indexed marketId, bytes32 indexed scoutId, uint256 amount);
    event NoWinnerReserve(uint256 indexed marketId, uint256 amount);
    event ExpiredRemainderSwept(uint256 indexed marketId, uint256 amount);

    /// @param creditLedger_ The CreditLedger contract address.
    /// @param leaderboard_ The Leaderboard contract address.
    /// @param season_ The Season contract address.
    constructor(ICreditLedger creditLedger_, ILeaderboard leaderboard_, ISeason season_) {
        creditLedger = creditLedger_;
        leaderboard = leaderboard_;
        season = season_;
    }

    /// @notice Create a new prediction market.
    /// @param spec The market specification including deadlines and metadata.
    /// @param creator The address that initiated the market creation (via Factory).
    /// @return marketId The ID of the newly created market.
    function createMarket(MarketSpec calldata spec, address creator)
        external
        onlyRole(MARKET_CREATOR_ROLE)
        returns (uint256 marketId)
    {
        _validateMarketSpec(spec);

        marketId = nextMarketId++;
        markets[marketId] = MarketData({
            specHash: spec.specHash,
            metadataURI: spec.metadataURI,
            seasonId: spec.seasonId,
            tradingDeadline: spec.tradingDeadline,
            resolutionDeadline: spec.resolutionDeadline,
            forceVoidDeadline: spec.forceVoidDeadline,
            claimDeadline: 0,
            projectOwner: spec.projectOwner,
            yesStake: 0,
            noStake: 0,
            winningsPerShare: 0,
            status: Status.TRADING,
            result: Result.NONE
        });

        emit MarketCreated(
            marketId,
            spec.seasonId,
            creator,
            spec.projectOwner,
            spec.specHash,
            spec.metadataURI,
            spec.tradingDeadline,
            spec.resolutionDeadline,
            spec.forceVoidDeadline
        );

        creditLedger.registerMarket(marketId, spec.seasonId);
    }

    /// @notice Take a position (YES or NO) in a market by staking credits.
    /// @param marketId The market to trade on.
    /// @param side The side to take (YES or NO).
    /// @param amount The amount of credits to stake.
    function takePosition(uint256 marketId, Side side, uint256 amount) external nonReentrant {
        MarketData storage market = _market(marketId);
        if (amount == 0 || side == Side.NONE) revert InvalidAmount();
        if (!canTrade(marketId)) revert TradingClosed(marketId);
        if (msg.sender == market.projectOwner) {
            revert ProjectOwnerCannotTrade(marketId, market.projectOwner);
        }

        bytes32 scoutId = creditLedger.scoutIdOf(msg.sender);
        if (scoutId == bytes32(0)) revert Unauthorized();

        Position storage position = positions[marketId][scoutId];
        if (position.side != Side.NONE && position.side != side) {
            revert SingleSideOnly(marketId, scoutId);
        }

        uint256 currentStake = position.yesStake + position.noStake;
        uint256 newStake = currentStake + amount;
        if (newStake > MAX_STAKE_PER_MARKET) {
            revert ExceedsMaxStake(marketId, newStake, MAX_STAKE_PER_MARKET);
        }

        position.side = side;
        if (side == Side.YES) {
            position.yesStake += amount;
            market.yesStake += amount;
        } else {
            position.noStake += amount;
            market.noStake += amount;
        }

        creditLedger.lockForTrade(scoutId, market.seasonId, marketId, amount);
        emit PositionTaken(marketId, scoutId, side, amount);
    }

    /// @notice Settle a market after its resolution deadline has passed.
    /// @param marketId The market to settle.
    /// @param passed True if the milestone was achieved (YES wins), false otherwise (NO wins).
    function settle(uint256 marketId, bool passed) external onlyRole(SETTLEMENT_ROLE) {
        MarketData storage market = _market(marketId);
        _requireTradingStatus(marketId, market);
        if (block.timestamp < market.resolutionDeadline) {
            revert SettlementTooEarly(marketId, block.timestamp, market.resolutionDeadline);
        }

        market.status = Status.SETTLED;
        market.result = passed ? Result.YES : Result.NO;
        market.claimDeadline = block.timestamp + CLAIM_WINDOW;

        uint256 losingStakes = passed ? market.noStake : market.yesStake;
        uint256 winningStakes = passed ? market.yesStake : market.noStake;

        if (winningStakes < 1) {
            if (losingStakes > 0) {
                emit NoWinnerReserve(marketId, losingStakes);
                creditLedger.moveLockedToReserve(market.seasonId, marketId, losingStakes);
            }
        } else {
            market.winningsPerShare = losingStakes * PAYOUT_SCALE / winningStakes;
        }

        emit MarketSettled(marketId, passed, losingStakes, winningStakes, market.claimDeadline);
    }

    /// @notice Void a market administratively (e.g., milestone abandoned).
    /// @param marketId The market to void.
    /// @param reasonURI URI pointing to the void rationale.
    function voidMarket(uint256 marketId, string calldata reasonURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        MarketData storage market = _market(marketId);
        _voidMarket(marketId, market, reasonURI);
    }

    /// @notice Force-void a market if the forceVoidDeadline has passed without settlement.
    /// @param marketId The market to force-void.
    function forceVoid(uint256 marketId) external {
        MarketData storage market = _market(marketId);
        if (block.timestamp < market.forceVoidDeadline) {
            revert ForceVoidTooEarly(marketId, block.timestamp, market.forceVoidDeadline);
        }
        _voidMarket(marketId, market, "forceVoid");
    }

    /// @notice Finalize a scout's position to compute claimable credits and score delta.
    /// @param marketId The market to finalize.
    /// @param scoutId The scout whose position should be finalized.
    function finalizePosition(uint256 marketId, bytes32 scoutId) public {
        _finalizePosition(marketId, scoutId);
        MarketData storage market = _market(marketId);
        Position storage position = positions[marketId][scoutId];
        leaderboard.updateScore(scoutId, market.seasonId, position.scoreDelta, marketId);
    }

    function _finalizePosition(uint256 marketId, bytes32 scoutId) internal {
        MarketData storage market = _market(marketId);
        Position storage position = positions[marketId][scoutId];
        if (position.finalized) revert PositionAlreadyFinalized(marketId, scoutId);

        uint256 totalStake = position.yesStake + position.noStake;
        if (totalStake == 0) revert NoPosition(marketId, scoutId);

        if (market.status == Status.SETTLED) {
            bool isWinner = (market.result == Result.YES && position.yesStake > 0)
                || (market.result == Result.NO && position.noStake > 0);

            if (isWinner) {
                uint256 winningStake =
                    market.result == Result.YES ? position.yesStake : position.noStake;
                position.claimableCredits =
                    winningStake + (winningStake * market.winningsPerShare / PAYOUT_SCALE);
            }
            // Per-position stake caps keep both values far below int256 max.
            // forge-lint: disable-next-line(unsafe-typecast)
            position.scoreDelta = int256(position.claimableCredits) - int256(totalStake);
        } else if (market.status == Status.VOIDED) {
            position.claimableCredits = totalStake;
            position.scoreDelta = 0;
        } else {
            revert TradingClosed(marketId);
        }

        position.finalized = true;
        emit PositionFinalized(marketId, scoutId, position.claimableCredits, position.scoreDelta);
    }

    /// @notice Claim winnings (or refunds for voided markets) for a finalized position.
    /// @param marketId The market to claim from.
    function claim(uint256 marketId) external nonReentrant {
        MarketData storage market = _market(marketId);
        bytes32 scoutId = creditLedger.scoutIdOf(msg.sender);
        if (scoutId == bytes32(0)) revert Unauthorized();

        Position storage position = positions[marketId][scoutId];
        bool wasNotFinalized = !position.finalized;
        if (wasNotFinalized) _finalizePosition(marketId, scoutId);
        if (position.claimed) revert WinningsAlreadyClaimed(marketId, scoutId);
        if (position.claimableCredits == 0) revert NoClaimableCredits(marketId, scoutId);
        if (block.timestamp > market.claimDeadline) {
            revert ClaimWindowExpired(marketId, block.timestamp, market.claimDeadline);
        }

        position.claimed = true;
        uint256 amount = position.claimableCredits;
        creditLedger.releaseToScout(scoutId, market.seasonId, marketId, amount);
        if (wasNotFinalized) {
            leaderboard.updateScore(scoutId, market.seasonId, position.scoreDelta, marketId);
        }

        if (market.status == Status.VOIDED) emit Refunded(marketId, scoutId, amount);
        else emit WinningsClaimed(marketId, scoutId, amount);
    }

    /// @notice Sweep expired, unclaimed credits to the protocol reserve after the claim window.
    /// @param marketId The market to sweep.
    function sweepExpiredRemainder(uint256 marketId) external {
        MarketData storage market = _market(marketId);
        if (market.status != Status.SETTLED && market.status != Status.VOIDED) {
            revert CannotSweepYet(marketId, block.timestamp, market.claimDeadline);
        }
        if (block.timestamp <= market.claimDeadline) {
            revert CannotSweepYet(marketId, block.timestamp, market.claimDeadline);
        }

        uint256 remainder = creditLedger.marketLockedCredits(marketId);
        if (remainder == 0) revert NoRemainderToSweep(marketId);
        emit ExpiredRemainderSwept(marketId, remainder);
        creditLedger.moveLockedToReserve(market.seasonId, marketId, remainder);
    }

    /// @notice Get the current YES odds in basis points for a market.
    /// @param marketId The market to query.
    /// @return yesPriceBps YES odds in basis points, clamped to [MIN_ODDS_BPS, MAX_ODDS_BPS].
    function getYesOdds(uint256 marketId) external view returns (uint256 yesPriceBps) {
        MarketData storage market = _market(marketId);
        uint256 totalStake = market.yesStake + market.noStake;
        if (totalStake == 0) return PRICE_BASIS / 2;

        yesPriceBps = market.yesStake * PRICE_BASIS / totalStake;
        if (yesPriceBps < MIN_ODDS_BPS) return MIN_ODDS_BPS;
        if (yesPriceBps > MAX_ODDS_BPS) return MAX_ODDS_BPS;
    }

    /// @notice Check whether a market is open for trading.
    /// @param marketId The market to query.
    function canTrade(uint256 marketId) public view returns (bool) {
        MarketData storage market = _market(marketId);
        return market.status == Status.TRADING && block.timestamp < market.tradingDeadline;
    }

    /// @notice Check whether a market is eligible for settlement.
    /// @param marketId The market to query.
    function canSettle(uint256 marketId) external view returns (bool) {
        MarketData storage market = _market(marketId);
        return market.status == Status.TRADING && block.timestamp >= market.resolutionDeadline;
    }

    /// @notice Check whether a market is in the claimable window.
    /// @param marketId The market to query.
    function canClaim(uint256 marketId) external view returns (bool) {
        MarketData storage market = _market(marketId);
        return (market.status == Status.SETTLED || market.status == Status.VOIDED)
            && block.timestamp <= market.claimDeadline;
    }

    /// @notice Check whether a market's expired remainder can be swept.
    /// @param marketId The market to query.
    function canSweep(uint256 marketId) external view returns (bool) {
        MarketData storage market = _market(marketId);
        return (market.status == Status.SETTLED || market.status == Status.VOIDED)
            && block.timestamp > market.claimDeadline;
    }

    /// @notice Retrieve a scout's position in a market.
    /// @param marketId The market to query.
    /// @param scoutId The scout to query.
    function getPosition(uint256 marketId, bytes32 scoutId)
        external
        view
        returns (Position memory)
    {
        _requireMarketExists(marketId);
        return positions[marketId][scoutId];
    }

    /// @notice Retrieve the full state of a market.
    /// @param marketId The market to query.
    function getMarket(uint256 marketId) external view returns (MarketData memory) {
        return _market(marketId);
    }

    function _voidMarket(uint256 marketId, MarketData storage market, string memory reasonURI)
        internal
    {
        _requireTradingStatus(marketId, market);
        market.status = Status.VOIDED;
        market.claimDeadline = block.timestamp + CLAIM_WINDOW;
        emit MarketVoided(marketId, reasonURI, market.claimDeadline);
    }

    function _validateMarketSpec(MarketSpec calldata spec) internal view {
        if (
            spec.specHash == bytes32(0) || bytes(spec.metadataURI).length == 0
                || spec.projectOwner == address(0)
        ) revert InvalidMarketSpec();
        if (!season.isSeasonActive(spec.seasonId)) revert InvalidMarketSpec();

        (uint256 seasonStart, uint256 seasonEnd, bool isActive) = season.getSeason(spec.seasonId);
        if (!isActive) revert InvalidMarketSpec();
        if (seasonStart == 0) revert InvalidMarketSpec();
        if (
            block.timestamp >= spec.tradingDeadline
                || spec.tradingDeadline >= spec.resolutionDeadline
                || spec.resolutionDeadline >= spec.forceVoidDeadline
                || spec.forceVoidDeadline > seasonEnd
        ) revert InvalidMarketSpec();
    }

    function _requireTradingStatus(uint256 marketId, MarketData storage market) internal view {
        if (market.status == Status.SETTLED) revert AlreadySettled(marketId);
        if (market.status == Status.VOIDED) revert AlreadyVoided(marketId);
    }

    function _market(uint256 marketId) internal view returns (MarketData storage) {
        _requireMarketExists(marketId);
        return markets[marketId];
    }

    function _requireMarketExists(uint256 marketId) internal view {
        if (marketId >= nextMarketId) revert MarketNotFound(marketId);
    }
}
