// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { IncubationVault } from "../src/IncubationVault.sol";
import { Unauthorized } from "../src/types/Errors.sol";

contract IncubationVaultTest is Test {
    IncubationVault private vault;

    address private oracle = address(0x0A11CE);
    address private sponsor = address(0x500050);
    address private projectOwner = address(0xB017D3);
    address private stranger = address(0xBADF00D);

    function setUp() public {
        vault = new IncubationVault();
        vault.grantRole(vault.ORACLE_ROLE(), oracle);
    }

    function testCreateVault() public {
        uint256 vaultId =
            vault.createVault(projectOwner, sponsor, 12_000, "ipfs://project/selected");
        IncubationVault.VaultData memory data = vault.getVault(vaultId);

        assertEq(data.projectOwner, projectOwner);
        assertEq(data.sponsor, sponsor);
        assertEq(data.totalBudget, 12_000);
        assertEq(data.releasedBudget, 0);
        assertEq(data.milestoneCount, 0);
        assertEq(uint256(data.status), uint256(IncubationVault.VaultStatus.ACTIVE));
    }

    function testUnauthorizedVaultCreationReverts() public {
        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.createVault(projectOwner, sponsor, 12_000, "ipfs://project/selected");
    }

    function testReleaseMilestone() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.releaseMilestone(
            vaultId, 0, "Merged 7 PRs against a target of 5; first sponsor tranche released."
        );

        IncubationVault.VaultData memory data = vault.getVault(vaultId);
        IncubationVault.Milestone memory milestone = vault.getMilestone(vaultId, 0);

        assertTrue(milestone.released);
        assertEq(data.releasedBudget, 4_000);
        assertEq(vault.remainingBudget(vaultId), 8_000);
    }

    function testUnauthorizedMilestoneReleaseReverts() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(stranger);
        vm.expectRevert(Unauthorized.selector);
        vault.releaseMilestone(vaultId, 0, "Unauthorized release.");
    }

    function testPreventDoubleRelease() public {
        uint256 vaultId = _createSeededVault();

        vm.startPrank(oracle);
        vault.releaseMilestone(vaultId, 0, "Initial release complete.");
        vm.expectRevert(
            abi.encodeWithSelector(IncubationVault.MilestoneAlreadyReleased.selector, vaultId, 0)
        );
        vault.releaseMilestone(vaultId, 0, "Should not release twice.");
        vm.stopPrank();
    }

    function testRejectMilestoneAllocationAboveTotalBudget() public {
        uint256 vaultId = vault.createVault(projectOwner, sponsor, 5_000, "ipfs://project/selected");
        vault.recordMilestone(vaultId, "Milestone 1", 4_000, "ipfs://milestones/m1");

        vm.expectRevert(
            abi.encodeWithSelector(
                IncubationVault.OverAllocatedBudget.selector, vaultId, 7_000, 5_000
            )
        );
        vault.recordMilestone(vaultId, "Milestone 2", 3_000, "ipfs://milestones/m2");
    }

    function testReleaseMultipleValidMilestones() public {
        uint256 vaultId = _createSeededVault();

        vm.startPrank(oracle);
        vault.releaseMilestone(vaultId, 0, "Milestone 0 released.");
        vault.releaseMilestone(vaultId, 1, "Milestone 1 released.");
        vm.stopPrank();

        IncubationVault.VaultData memory data = vault.getVault(vaultId);
        assertEq(data.releasedBudget, 8_000);
    }

    function testRemainingBudgetTracksAfterMultipleReleases() public {
        uint256 vaultId = _createSeededVault();

        vm.startPrank(oracle);
        vault.releaseMilestone(vaultId, 0, "Milestone 0 released.");
        vault.releaseMilestone(vaultId, 1, "Milestone 1 released.");
        vm.stopPrank();

        assertEq(vault.remainingBudget(vaultId), 4_000);
    }

    function testPauseVault() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.pauseVault(vaultId, "Execution stalled; hold future sponsor releases.");

        IncubationVault.VaultData memory data = vault.getVault(vaultId);
        assertEq(uint256(data.status), uint256(IncubationVault.VaultStatus.PAUSED));
    }

    function testPauseBlocksFurtherRelease() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.pauseVault(vaultId, "Execution stalled; hold future sponsor releases.");

        vm.prank(oracle);
        vm.expectRevert(abi.encodeWithSelector(IncubationVault.VaultNotActive.selector, vaultId));
        vault.releaseMilestone(vaultId, 0, "Should not release while paused.");
    }

    function testPauseBlocksNewMilestones() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.pauseVault(vaultId, "Execution stalled; hold future sponsor releases.");

        vm.expectRevert(abi.encodeWithSelector(IncubationVault.VaultNotActive.selector, vaultId));
        vault.recordMilestone(vaultId, "Late milestone", 500, "ipfs://milestones/m4");
    }

    function testRefundRemainingBudget() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.releaseMilestone(vaultId, 0, "Initial milestone satisfied.");

        vm.prank(oracle);
        vault.pauseVault(vaultId, "Manual review requested before the next release.");

        uint256 refundedAmount = vault.refundRemainingBudget(vaultId);
        IncubationVault.VaultData memory data = vault.getVault(vaultId);

        assertEq(refundedAmount, 8_000);
        assertEq(data.refundedBudget, 8_000);
        assertEq(vault.remainingBudget(vaultId), 0);
        assertEq(uint256(data.status), uint256(IncubationVault.VaultStatus.REFUNDED));
    }

    function testPreventRepeatedRefund() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.releaseMilestone(vaultId, 0, "Initial milestone satisfied.");

        vm.prank(oracle);
        vault.pauseVault(vaultId, "Manual review requested before the next release.");

        vault.refundRemainingBudget(vaultId);

        vm.expectRevert(
            abi.encodeWithSelector(IncubationVault.VaultAlreadyRefunded.selector, vaultId)
        );
        vault.refundRemainingBudget(vaultId);
    }

    function testRefundRequiresPausedVault() public {
        uint256 vaultId = _createSeededVault();

        vm.expectRevert(
            abi.encodeWithSelector(IncubationVault.RefundRequiresPausedVault.selector, vaultId)
        );
        vault.refundRemainingBudget(vaultId);
    }

    function testRefundBlocksFurtherRelease() public {
        uint256 vaultId = _createSeededVault();

        vm.prank(oracle);
        vault.pauseVault(vaultId, "Manual review requested before any more releases.");

        vault.refundRemainingBudget(vaultId);

        vm.prank(oracle);
        vm.expectRevert(abi.encodeWithSelector(IncubationVault.VaultNotActive.selector, vaultId));
        vault.releaseMilestone(vaultId, 0, "Should not release after refund.");
    }

    function testRejectNonexistentVaultAndMilestone() public {
        vm.expectRevert(abi.encodeWithSelector(IncubationVault.VaultNotFound.selector, 77));
        vault.getVault(77);

        uint256 vaultId = _createSeededVault();

        vm.expectRevert(
            abi.encodeWithSelector(IncubationVault.MilestoneNotFound.selector, vaultId, 99)
        );
        vault.getMilestone(vaultId, 99);
    }

    function _createSeededVault() private returns (uint256 vaultId) {
        vaultId = vault.createVault(projectOwner, sponsor, 12_000, "ipfs://project/selected");
        vault.recordMilestone(
            vaultId, "Merge contributor PR tranche", 4_000, "ipfs://milestones/m1"
        );
        vault.recordMilestone(vaultId, "Deploy docs API tranche", 4_000, "ipfs://milestones/m2");
        vault.recordMilestone(
            vaultId, "Post-hackathon usage tranche", 4_000, "ipfs://milestones/m3"
        );
    }
}
