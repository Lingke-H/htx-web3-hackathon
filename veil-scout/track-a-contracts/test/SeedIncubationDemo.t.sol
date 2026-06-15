// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { IncubationVault } from "../src/IncubationVault.sol";
import { SeedIncubationDemo } from "../script/SeedIncubationDemo.s.sol";

contract SeedIncubationDemoTest is Test {
    uint256 private constant DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function testDemoBudgetMatchesFixedMilestones() public {
        SeedIncubationDemo script = new SeedIncubationDemo();
        assertEq(script.demoMilestoneBudget(), 12_000);
    }

    function testSeedRejectsBudgetMismatch() public {
        vm.chainId(31_337);

        IncubationVault vault = new IncubationVault();
        address deployer = vm.addr(DEFAULT_ANVIL_PRIVATE_KEY);
        vault.grantRole(vault.VAULT_MANAGER_ROLE(), deployer);
        vault.grantRole(vault.ORACLE_ROLE(), deployer);

        string memory deploymentPath =
            string.concat(vm.projectRoot(), "/cache/seed-incubation-demo.test.json");
        vm.writeJson(
            string.concat('{"incubationVault":"', vm.toString(address(vault)), '"}'), deploymentPath
        );
        vm.setEnv("DEPLOYMENT_JSON", deploymentPath);
        vm.setEnv("INCUBATION_TOTAL_BUDGET", "11000");

        SeedIncubationDemo script = new SeedIncubationDemo();
        vm.expectRevert("INCUBATION_TOTAL_BUDGET must equal seeded milestone total");
        script.seed();
    }
}
