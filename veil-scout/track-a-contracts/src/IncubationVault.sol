// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessManaged } from "./utils/AccessManaged.sol";

/// @title IncubationVault
/// @notice Demo-grade sponsor budget accounting for post-hackathon incubation.
/// @dev This contract intentionally keeps incubation budget separate from scout credits and market settlement.
contract IncubationVault is AccessManaged {
    bytes32 public constant VAULT_MANAGER_ROLE = keccak256("VAULT_MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    enum VaultStatus {
        ACTIVE,
        PAUSED,
        REFUNDED
    }

    struct VaultData {
        address projectOwner;
        address sponsor;
        uint256 totalBudget;
        uint256 allocatedBudget;
        uint256 releasedBudget;
        uint256 refundedBudget;
        uint256 milestoneCount;
        VaultStatus status;
        string metadataURI;
    }

    struct Milestone {
        string label;
        uint256 releaseAmount;
        string metadataURI;
        bool released;
    }

    error InvalidAddress();
    error InvalidBudget();
    error VaultNotFound(uint256 vaultId);
    error VaultNotActive(uint256 vaultId);
    error VaultAlreadyPaused(uint256 vaultId);
    error VaultAlreadyRefunded(uint256 vaultId);
    error MilestoneNotFound(uint256 vaultId, uint256 milestoneId);
    error MilestoneAlreadyReleased(uint256 vaultId, uint256 milestoneId);
    error OverAllocatedBudget(uint256 vaultId, uint256 allocatedBudget, uint256 totalBudget);
    error RefundRequiresPausedVault(uint256 vaultId);
    error NoRemainingBudget(uint256 vaultId);

    uint256 public nextVaultId;

    mapping(uint256 vaultId => VaultData vault) private _vaults;
    mapping(uint256 vaultId => mapping(uint256 milestoneId => Milestone milestone)) private
        _milestones;

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed projectOwner,
        address indexed sponsor,
        uint256 totalBudget,
        string metadataURI
    );
    event MilestoneRecorded(
        uint256 indexed vaultId,
        uint256 indexed milestoneId,
        string label,
        uint256 releaseAmount,
        string metadataURI
    );
    event MilestoneReleased(
        uint256 indexed vaultId,
        uint256 indexed milestoneId,
        uint256 releaseAmount,
        uint256 releasedBudget,
        string executionSummary
    );
    event VaultPaused(uint256 indexed vaultId, string reasonURI);
    event RemainingBudgetRefunded(uint256 indexed vaultId, address indexed sponsor, uint256 amount);

    constructor() {
        _grantRole(VAULT_MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    function createVault(
        address projectOwner,
        address sponsor,
        uint256 totalBudget,
        string calldata metadataURI
    ) external onlyRole(VAULT_MANAGER_ROLE) returns (uint256 vaultId) {
        if (projectOwner == address(0) || sponsor == address(0)) revert InvalidAddress();
        if (totalBudget == 0) revert InvalidBudget();

        vaultId = nextVaultId++;
        _vaults[vaultId] = VaultData({
            projectOwner: projectOwner,
            sponsor: sponsor,
            totalBudget: totalBudget,
            allocatedBudget: 0,
            releasedBudget: 0,
            refundedBudget: 0,
            milestoneCount: 0,
            status: VaultStatus.ACTIVE,
            metadataURI: metadataURI
        });

        emit VaultCreated(vaultId, projectOwner, sponsor, totalBudget, metadataURI);
    }

    function recordMilestone(
        uint256 vaultId,
        string calldata label,
        uint256 releaseAmount,
        string calldata metadataURI
    ) external onlyRole(VAULT_MANAGER_ROLE) returns (uint256 milestoneId) {
        VaultData storage vault = _requireActiveVault(vaultId);
        if (releaseAmount == 0) revert InvalidBudget();

        uint256 newAllocatedBudget = vault.allocatedBudget + releaseAmount;
        if (newAllocatedBudget > vault.totalBudget) {
            revert OverAllocatedBudget(vaultId, newAllocatedBudget, vault.totalBudget);
        }

        milestoneId = vault.milestoneCount;
        vault.milestoneCount += 1;
        vault.allocatedBudget = newAllocatedBudget;

        _milestones[vaultId][milestoneId] = Milestone({
            label: label, releaseAmount: releaseAmount, metadataURI: metadataURI, released: false
        });

        emit MilestoneRecorded(vaultId, milestoneId, label, releaseAmount, metadataURI);
    }

    function releaseMilestone(
        uint256 vaultId,
        uint256 milestoneId,
        string calldata executionSummary
    ) external onlyRole(ORACLE_ROLE) {
        VaultData storage vault = _requireActiveVault(vaultId);
        Milestone storage milestone = _requireMilestone(vaultId, milestoneId, vault.milestoneCount);
        if (milestone.released) revert MilestoneAlreadyReleased(vaultId, milestoneId);

        milestone.released = true;
        vault.releasedBudget += milestone.releaseAmount;

        emit MilestoneReleased(
            vaultId, milestoneId, milestone.releaseAmount, vault.releasedBudget, executionSummary
        );
    }

    function pauseVault(uint256 vaultId, string calldata reasonURI) external onlyRole(ORACLE_ROLE) {
        VaultData storage vault = _requireVault(vaultId);
        if (vault.status == VaultStatus.PAUSED) revert VaultAlreadyPaused(vaultId);
        if (vault.status == VaultStatus.REFUNDED) revert VaultAlreadyRefunded(vaultId);

        vault.status = VaultStatus.PAUSED;
        emit VaultPaused(vaultId, reasonURI);
    }

    function refundRemainingBudget(uint256 vaultId)
        external
        onlyRole(VAULT_MANAGER_ROLE)
        returns (uint256 refundedAmount)
    {
        VaultData storage vault = _requireVault(vaultId);
        if (vault.status == VaultStatus.REFUNDED) revert VaultAlreadyRefunded(vaultId);
        if (vault.status != VaultStatus.PAUSED) revert RefundRequiresPausedVault(vaultId);

        refundedAmount = remainingBudget(vaultId);
        if (refundedAmount == 0) revert NoRemainingBudget(vaultId);

        vault.refundedBudget = refundedAmount;
        vault.status = VaultStatus.REFUNDED;

        emit RemainingBudgetRefunded(vaultId, vault.sponsor, refundedAmount);
    }

    function getVault(uint256 vaultId) external view returns (VaultData memory) {
        return _requireVault(vaultId);
    }

    function getMilestone(uint256 vaultId, uint256 milestoneId)
        external
        view
        returns (Milestone memory)
    {
        VaultData storage vault = _requireVault(vaultId);
        return _requireMilestone(vaultId, milestoneId, vault.milestoneCount);
    }

    function remainingBudget(uint256 vaultId) public view returns (uint256) {
        VaultData storage vault = _requireVault(vaultId);
        return vault.totalBudget - vault.releasedBudget - vault.refundedBudget;
    }

    function _requireVault(uint256 vaultId) internal view returns (VaultData storage vault) {
        vault = _vaults[vaultId];
        if (vault.projectOwner == address(0)) revert VaultNotFound(vaultId);
    }

    function _requireActiveVault(uint256 vaultId) internal view returns (VaultData storage vault) {
        vault = _requireVault(vaultId);
        if (vault.status != VaultStatus.ACTIVE) revert VaultNotActive(vaultId);
    }

    function _requireMilestone(uint256 vaultId, uint256 milestoneId, uint256 milestoneCount)
        internal
        view
        returns (Milestone storage milestone)
    {
        if (milestoneId >= milestoneCount) revert MilestoneNotFound(vaultId, milestoneId);
        milestone = _milestones[vaultId][milestoneId];
    }
}
