// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrantCall } from "../types/Errors.sol";

/// @title ReentrancyGuard
/// @notice Prevents reentrant calls to a function.
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}
