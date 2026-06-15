// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";

import { IncubationVault } from "../src/IncubationVault.sol";

contract SeedIncubationDemo is Script {
    uint256 private constant DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    struct Deployment {
        IncubationVault incubationVault;
    }

    struct DemoMilestone {
        string label;
        uint256 releaseAmount;
        string metadataURI;
    }

    function run() external returns (uint256 vaultId) {
        return seed();
    }

    function seed() public returns (uint256 vaultId) {
        require(block.chainid == 31_337, "SeedIncubationDemo is intended for local Anvil");

        Deployment memory deployment = _loadDeployment();
        require(
            deployment.incubationVault.nextVaultId() == 0,
            "Incubation demo already seeded for this deployment"
        );

        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", DEFAULT_ANVIL_PRIVATE_KEY);
        address sponsor = vm.envOr("INCUBATION_SPONSOR", address(0x5150));
        address projectOwner = vm.envOr("INCUBATION_PROJECT_OWNER", address(0xA613));
        uint256 totalBudget = vm.envOr("INCUBATION_TOTAL_BUDGET", uint256(12_000));
        string memory projectSlug = vm.envOr("INCUBATION_PROJECT_SLUG", string("agentpay"));

        DemoMilestone[3] memory milestones = [
            DemoMilestone({
                label: "Contributor PR tranche",
                releaseAmount: 4_000,
                metadataURI: "ipfs://incubation/agentpay/m1"
            }),
            DemoMilestone({
                label: "API integration tranche",
                releaseAmount: 4_000,
                metadataURI: "ipfs://incubation/agentpay/m2"
            }),
            DemoMilestone({
                label: "Usage retention tranche",
                releaseAmount: 4_000,
                metadataURI: "ipfs://incubation/agentpay/m3"
            })
        ];

        vm.startBroadcast(deployerPrivateKey);
        vaultId = deployment.incubationVault
            .createVault(
                projectOwner,
                sponsor,
                totalBudget,
                string.concat("local://incubation/", projectSlug, "/selected")
            );
        for (uint256 milestoneId = 0; milestoneId < milestones.length; milestoneId++) {
            deployment.incubationVault
                .recordMilestone(
                    vaultId,
                    milestones[milestoneId].label,
                    milestones[milestoneId].releaseAmount,
                    milestones[milestoneId].metadataURI
                );
        }
        deployment.incubationVault
            .releaseMilestone(
                vaultId,
                0,
                "Demo seed released the first fixed milestone after proof-of-execution review."
            );
        vm.stopBroadcast();

        _writeSeedOutput(projectSlug, deployment.incubationVault, vaultId);

        console2.log("Incubation demo seed complete");
        console2.log("incubationVault:", address(deployment.incubationVault));
        console2.log("vaultId:", vaultId);
        console2.log("milestone_0 released, milestone_1 pending, vault remains ACTIVE.");
    }

    function _loadDeployment() private view returns (Deployment memory deployment) {
        string memory deploymentPath =
            vm.envOr("DEPLOYMENT_JSON", string.concat(vm.projectRoot(), "/deployment.json"));
        string memory json = vm.readFile(deploymentPath);
        deployment = Deployment({
            incubationVault: IncubationVault(vm.parseJsonAddress(json, ".incubationVault"))
        });
    }

    function _writeSeedOutput(
        string memory projectSlug,
        IncubationVault incubationVault,
        uint256 vaultId
    ) private {
        string memory outputPath = vm.envOr(
            "INCUBATION_DEMO_JSON", string.concat(vm.projectRoot(), "/incubation-demo.json")
        );
        IncubationVault.VaultData memory vault = incubationVault.getVault(vaultId);
        IncubationVault.Milestone memory milestone0 = incubationVault.getMilestone(vaultId, 0);
        IncubationVault.Milestone memory milestone1 = incubationVault.getMilestone(vaultId, 1);
        IncubationVault.Milestone memory milestone2 = incubationVault.getMilestone(vaultId, 2);
        uint256 remaining = incubationVault.remainingBudget(vaultId);

        string memory json = string.concat(
            "{\n",
            '  "chainId": ',
            vm.toString(block.chainid),
            ",\n",
            '  "projectSlug": "',
            projectSlug,
            '",\n',
            '  "incubationVault": "',
            vm.toString(address(incubationVault)),
            '",\n',
            '  "vaultId": ',
            vm.toString(vaultId),
            ",\n",
            '  "status": "ACTIVE",\n',
            '  "totalBudget": ',
            vm.toString(vault.totalBudget),
            ",\n",
            '  "releasedBudget": ',
            vm.toString(vault.releasedBudget),
            ",\n",
            '  "remainingBudget": ',
            vm.toString(remaining),
            ",\n",
            '  "milestones": [\n',
            _milestoneJson(0, milestone0),
            ",\n",
            _milestoneJson(1, milestone1),
            ",\n",
            _milestoneJson(2, milestone2),
            "\n",
            "  ]\n",
            "}\n"
        );
        vm.writeJson(json, outputPath);
    }

    function _milestoneJson(uint256 milestoneId, IncubationVault.Milestone memory milestone)
        private
        view
        returns (string memory)
    {
        return string.concat(
            "    {\n",
            '      "milestoneId": ',
            vm.toString(milestoneId),
            ",\n",
            '      "label": "',
            milestone.label,
            '",\n',
            '      "releaseAmount": ',
            vm.toString(milestone.releaseAmount),
            ",\n",
            '      "released": ',
            milestone.released ? "true" : "false",
            "\n",
            "    }"
        );
    }
}
