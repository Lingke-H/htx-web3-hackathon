// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ISeason } from "./interfaces/ISeason.sol";
import {
    ClaimSignerZero,
    CreditsAlreadyClaimed,
    InsufficientBalance,
    InsufficientLockedCredits,
    InvalidAmount,
    InvalidMarketSeason,
    InvalidSignature,
    MarketAlreadyRegistered,
    MarketNotRegistered,
    ScoutIdAlreadyBound,
    SignatureExpired,
    WalletAlreadyBound
} from "./types/Errors.sol";
import { AccessManaged } from "./utils/AccessManaged.sol";

contract CreditLedger is AccessManaged {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");

    uint256 public constant CREDITS_PER_SEASON = 10_000;
    uint256 private constant SECP256K1N_HALF_ORDER =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    ISeason public immutable season;
    address public claimSigner;

    mapping(address wallet => bytes32 scoutId) public scoutIdOf;
    mapping(bytes32 scoutId => address wallet) public walletOfScoutId;
    mapping(uint256 seasonId => mapping(bytes32 scoutId => bool)) public hasClaimedSeason;
    mapping(address wallet => uint256 nonce) public claimNonce;

    mapping(bytes32 scoutId => mapping(uint256 seasonId => uint256 balance)) public freeBalance;
    mapping(uint256 seasonId => uint256 amount) public totalMintedCredits;
    mapping(uint256 seasonId => uint256 amount) public seasonProtocolReserve;

    mapping(uint256 marketId => uint256 amount) public marketLockedCredits;
    mapping(uint256 marketId => uint256 seasonId) public marketSeason;
    mapping(uint256 marketId => bool registered) public isMarketRegistered;

    event CreditsClaimed(
        bytes32 indexed scoutId, address indexed wallet, uint256 indexed seasonId, uint256 amount
    );
    event WalletBound(address indexed wallet, bytes32 indexed scoutId);
    event MarketRegistered(uint256 indexed marketId, uint256 indexed seasonId);
    event ClaimSignerUpdated(address indexed signer);

    constructor(ISeason season_, address claimSigner_) {
        season = season_;
        if (claimSigner_ == address(0)) revert ClaimSignerZero();
        claimSigner = claimSigner_;
        emit ClaimSignerUpdated(claimSigner_);
    }

    function setClaimSigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (signer == address(0)) revert ClaimSignerZero();
        claimSigner = signer;
        emit ClaimSignerUpdated(signer);
    }

    function claim(uint256 seasonId, bytes32 scoutId, uint256 deadline, bytes calldata signature)
        external
    {
        if (scoutId == bytes32(0)) revert InvalidSignature();
        if (block.timestamp > deadline) revert SignatureExpired(block.timestamp, deadline);
        if (!season.isSeasonActive(seasonId)) revert InvalidSignature();
        if (hasClaimedSeason[seasonId][scoutId]) revert CreditsAlreadyClaimed(scoutId, seasonId);

        bytes32 boundScoutId = scoutIdOf[msg.sender];
        if (boundScoutId != bytes32(0) && boundScoutId != scoutId) {
            revert WalletAlreadyBound(msg.sender);
        }

        address boundWallet = walletOfScoutId[scoutId];
        if (boundWallet != address(0) && boundWallet != msg.sender) {
            revert ScoutIdAlreadyBound(scoutId);
        }

        uint256 nonce = claimNonce[msg.sender];
        bytes32 digest = keccak256(
            abi.encodePacked(
                scoutId, seasonId, msg.sender, block.chainid, address(this), nonce, deadline
            )
        );
        if (!_isValidSignature(digest, signature)) revert InvalidSignature();

        claimNonce[msg.sender] = nonce + 1;
        hasClaimedSeason[seasonId][scoutId] = true;

        if (boundScoutId == bytes32(0)) {
            scoutIdOf[msg.sender] = scoutId;
            walletOfScoutId[scoutId] = msg.sender;
            emit WalletBound(msg.sender, scoutId);
        }

        freeBalance[scoutId][seasonId] += CREDITS_PER_SEASON;
        totalMintedCredits[seasonId] += CREDITS_PER_SEASON;

        emit CreditsClaimed(scoutId, msg.sender, seasonId, CREDITS_PER_SEASON);
    }

    function registerMarket(uint256 marketId, uint256 seasonId) external onlyRole(MARKET_ROLE) {
        if (isMarketRegistered[marketId]) revert MarketAlreadyRegistered(marketId);
        if (!season.isSeasonActive(seasonId)) revert InvalidSignature();

        isMarketRegistered[marketId] = true;
        marketSeason[marketId] = seasonId;

        emit MarketRegistered(marketId, seasonId);
    }

    function lockForTrade(bytes32 scoutId, uint256 seasonId, uint256 marketId, uint256 amount)
        external
        onlyRole(MARKET_ROLE)
    {
        _requireMarketSeason(marketId, seasonId);
        if (amount == 0) revert InvalidAmount();

        uint256 balance = freeBalance[scoutId][seasonId];
        if (balance < amount) revert InsufficientBalance(scoutId, seasonId, balance, amount);

        freeBalance[scoutId][seasonId] = balance - amount;
        marketLockedCredits[marketId] += amount;
    }

    function releaseToScout(bytes32 scoutId, uint256 seasonId, uint256 marketId, uint256 amount)
        external
        onlyRole(MARKET_ROLE)
    {
        _requireMarketSeason(marketId, seasonId);
        if (amount == 0) revert InvalidAmount();

        uint256 locked = marketLockedCredits[marketId];
        if (locked < amount) revert InsufficientLockedCredits(marketId, locked, amount);

        marketLockedCredits[marketId] = locked - amount;
        freeBalance[scoutId][seasonId] += amount;
    }

    function moveLockedToReserve(uint256 seasonId, uint256 marketId, uint256 amount)
        external
        onlyRole(MARKET_ROLE)
    {
        _requireMarketSeason(marketId, seasonId);
        if (amount == 0) revert InvalidAmount();

        uint256 locked = marketLockedCredits[marketId];
        if (locked < amount) revert InsufficientLockedCredits(marketId, locked, amount);

        marketLockedCredits[marketId] = locked - amount;
        seasonProtocolReserve[seasonId] += amount;
    }

    function freeBalanceOf(bytes32 scoutId, uint256 seasonId) external view returns (uint256) {
        return freeBalance[scoutId][seasonId];
    }

    function _requireMarketSeason(uint256 marketId, uint256 seasonId) internal view {
        if (!isMarketRegistered[marketId]) revert MarketNotRegistered(marketId);
        uint256 actualSeasonId = marketSeason[marketId];
        if (actualSeasonId != seasonId) {
            revert InvalidMarketSeason(marketId, seasonId, actualSeasonId);
        }
    }

    function _isValidSignature(bytes32 digest, bytes calldata signature)
        internal
        view
        returns (bool)
    {
        address recovered = _recover(digest, signature);
        if (recovered == claimSigner) return true;

        bytes32 ethSignedDigest =
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        return _recover(ethSignedDigest, signature) == claimSigner;
    }

    function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        if (signature.length != 65) return address(0);

        bytes memory sig = signature;
        bytes32 r = _readBytes32(sig, 0);
        bytes32 s = _readBytes32(sig, 32);
        uint8 v = uint8(sig[64]);
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        if (uint256(s) > SECP256K1N_HALF_ORDER) return address(0);
        return ecrecover(digest, v, r, s);
    }

    function _readBytes32(bytes memory data, uint256 offset) internal pure returns (bytes32 value) {
        for (uint256 i = 0; i < 32; i++) {
            value |= bytes32(uint256(uint8(data[offset + i])) << (8 * (31 - i)));
        }
    }
}
