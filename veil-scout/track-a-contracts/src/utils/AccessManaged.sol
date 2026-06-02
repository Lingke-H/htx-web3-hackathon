// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Unauthorized } from "../types/Errors.sol";

/// @title AccessManaged
/// @notice Minimal role-based access control without external dependencies.
/// @dev Grants DEFAULT_ADMIN_ROLE to the deployer. Roles are stored as simple mappings.
abstract contract AccessManaged {
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    mapping(bytes32 role => mapping(address account => bool)) private _roles;

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, msg.sender)) revert Unauthorized();
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Check whether an account holds a specific role.
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    /// @notice Grant a role to an account. Callable only by admin.
    function grantRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(role, account);
    }

    /// @notice Revoke a role from an account. Callable only by admin.
    function revokeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(role, account);
    }

    function renounceRole(bytes32 role) external {
        _revokeRole(role, msg.sender);
    }

    function _grantRole(bytes32 role, address account) internal {
        if (!_roles[role][account]) {
            _roles[role][account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    function _revokeRole(bytes32 role, address account) internal {
        if (_roles[role][account]) {
            _roles[role][account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }
}
