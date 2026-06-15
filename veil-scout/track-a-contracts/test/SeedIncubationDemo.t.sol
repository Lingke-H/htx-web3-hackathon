// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";

import { IncubationVault } from "../src/IncubationVault.sol";
import { SeedIncubationDemo } from "../script/SeedIncubationDemo.s.sol";

contract SeedIncubationDemoTest is Test {
    address private constant DEFAULT_ANVIL_DEPLOYER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    function testDemoBudgetMatchesFixedMilestones() public {
        SeedIncubationDemo script = new SeedIncubationDemo();
        assertEq(script.demoMilestoneBudget(), 12_000);
    }

    function testSeedRejectsBudgetMismatch() public {
        vm.chainId(31_337);

        IncubationVault vault = new IncubationVault();
        address deployer = DEFAULT_ANVIL_DEPLOYER;
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
