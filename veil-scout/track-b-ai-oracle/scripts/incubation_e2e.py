from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

from eth_account import Account
from web3 import Web3


DEFAULT_PRIVATE_KEY = (
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assert the incubation demo loop end-to-end against a local Anvil node."
    )
    parser.add_argument("--rpc-url", required=True)
    parser.add_argument("--deployment-json", required=True, type=Path)
    parser.add_argument("--incubation-demo-json", required=True, type=Path)
    parser.add_argument("--track-a-dir", required=True, type=Path)
    parser.add_argument("--track-b-dir", required=True, type=Path)
    parser.add_argument("--track-b-data-dir", required=True, type=Path)
    return parser.parse_args()


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_incubation_contract(w3: Web3, track_a_dir: Path, address: str):
    abi_path = track_a_dir / "abi" / "IncubationVault.json"
    with abi_path.open("r", encoding="utf-8") as handle:
        abi = json.load(handle)
    return w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)


def assert_seeded_state(contract, demo_state: dict) -> None:
    vault_id = int(demo_state["vaultId"])
    next_vault_id = int(contract.functions.nextVaultId().call())
    require(next_vault_id == 1, f"expected one vault to exist, got nextVaultId={next_vault_id}")

    vault = contract.functions.getVault(vault_id).call()
    milestone_0 = contract.functions.getMilestone(vault_id, 0).call()
    milestone_1 = contract.functions.getMilestone(vault_id, 1).call()
    remaining_budget = int(contract.functions.remainingBudget(vault_id).call())

    require(int(vault[6]) == 3, f"expected 3 milestones, got {vault[6]}")
    require(bool(milestone_0[3]) is True, "expected milestone 0 to be released")
    require(bool(milestone_1[3]) is False, "expected milestone 1 to be pending")
    require(int(vault[7]) == 0, f"expected ACTIVE vault status, got {vault[7]}")
    require(int(vault[4]) == 4_000, f"expected released budget 4000, got {vault[4]}")
    require(remaining_budget == 8_000, f"expected remaining budget 8000, got {remaining_budget}")
    require(demo_state["status"] == "ACTIVE", f"expected incubation-demo ACTIVE, got {demo_state['status']}")


def write_project_config(track_b_data_dir: Path, incubation_vault_address: str) -> Path:
    project_path = track_b_data_dir / "projects" / "incubation-smoke.json"
    project_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "slug": "incubation-smoke",
        "name": "Incubation Smoke",
        "description": "Deterministic local incubation smoke test project.",
        "contract_addresses": [incubation_vault_address],
        "milestone": "Observe incubation vault events for the pending milestone release check.",
        "deadline": 1_893_456_000,
        "season_id": 0,
        "verification_rule": {
            "type": "contract_event_count",
            "target": 1,
            "contract": {
                "address": incubation_vault_address,
                "from_block": 0,
                "to_block": "latest",
            },
        },
    }
    with project_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
    return project_path


def run_assess_release(args: argparse.Namespace, project_path: Path, vault_id: int, milestone_id: int) -> Path:
    env = os.environ.copy()
    pythonpath_entries = [str(args.track_b_dir / "src")]
    if env.get("PYTHONPATH"):
        pythonpath_entries.append(env["PYTHONPATH"])
    env.update({
        "RPC_URL": args.rpc_url,
        "CHAIN_ID": "31337",
        "DEPLOYMENT_JSON": str(args.deployment_json),
        "CONTRACTS_DIR": str(args.track_a_dir),
        "TRACK_B_DATA_DIR": str(args.track_b_data_dir),
        "PYTHONPATH": os.pathsep.join(pythonpath_entries),
    })
    subprocess.run(
        [
            sys.executable,
            "-m",
            "track_b.cli",
            "assess-release",
            "--project",
            str(project_path),
            "--market-id",
            "0",
            "--vault-id",
            str(vault_id),
            "--milestone-id",
            str(milestone_id),
        ],
        cwd=args.track_b_dir,
        env=env,
        check=True,
    )
    return (
        args.track_b_data_dir
        / "releases"
        / f"incubation-smoke-market-0-vault-{vault_id}-milestone-{milestone_id}.json"
    )


def assert_assessment_report(contract, report_path: Path, vault_id: int, milestone_id: int) -> None:
    report = load_json(report_path)
    milestone = contract.functions.getMilestone(vault_id, milestone_id).call()
    vault = contract.functions.getVault(vault_id).call()

    require(report["passed"] is True, "expected assess-release to pass")
    require(
        int(report["recommendedReleaseAmount"]) == int(milestone[1]),
        "expected recommended release amount to equal the fixed on-chain amount",
    )
    require(int(report["vaultId"]) == vault_id, "expected report vaultId to match")
    require(int(report["milestoneId"]) == milestone_id, "expected report milestoneId to match")
    require(
        "Advisory only" in report["trustBoundary"],
        "expected trust boundary to state advisory-only release guidance",
    )
    require(
        "releaseMilestone" in report["releaseCommandPreview"],
        "expected release command preview to mention releaseMilestone",
    )
    require(bool(milestone[3]) is False, "assess-release must not submit a release transaction")
    require(int(vault[4]) == 4_000, "assess-release must not change released budget")


def manual_release(w3: Web3, contract, vault_id: int, milestone_id: int) -> str:
    private_key = os.environ.get("ORACLE_PRIVATE_KEY") or os.environ.get("PRIVATE_KEY") or DEFAULT_PRIVATE_KEY
    account = Account.from_key(private_key)
    tx = contract.functions.releaseMilestone(
        vault_id,
        milestone_id,
        "Smoke test reviewer release after advisory verification.",
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "chainId": int(w3.eth.chain_id),
        "gasPrice": w3.eth.gas_price,
    })
    tx["gas"] = int(w3.eth.estimate_gas(tx) * 1.2)
    signed = account.sign_transaction(tx)
    raw_tx = getattr(signed, "raw_transaction", None) or signed.rawTransaction
    tx_hash = w3.eth.send_raw_transaction(raw_tx)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    require(int(receipt["status"]) == 1, "manual milestone release transaction failed")
    return receipt["transactionHash"].hex()


def assert_released_state(contract, vault_id: int, milestone_id: int) -> None:
    vault = contract.functions.getVault(vault_id).call()
    milestone = contract.functions.getMilestone(vault_id, milestone_id).call()
    remaining_budget = int(contract.functions.remainingBudget(vault_id).call())

    require(bool(milestone[3]) is True, "expected milestone 1 to be released after reviewer action")
    require(int(vault[4]) == 8_000, f"expected released budget 8000, got {vault[4]}")
    require(remaining_budget == 4_000, f"expected remaining budget 4000, got {remaining_budget}")
    require(int(vault[7]) == 0, f"expected vault to remain ACTIVE, got {vault[7]}")


def main() -> None:
    args = parse_args()
    deployment = load_json(args.deployment_json)
    demo_state = load_json(args.incubation_demo_json)

    w3 = Web3(Web3.HTTPProvider(args.rpc_url))
    require(w3.is_connected(), f"failed to connect to RPC at {args.rpc_url}")

    contract = load_incubation_contract(w3, args.track_a_dir, deployment["incubationVault"])
    vault_id = int(demo_state["vaultId"])

    assert_seeded_state(contract, demo_state)
    project_path = write_project_config(args.track_b_data_dir, deployment["incubationVault"])
    report_path = run_assess_release(args, project_path, vault_id, 1)
    assert_assessment_report(contract, report_path, vault_id, 1)
    release_tx_hash = manual_release(w3, contract, vault_id, 1)
    assert_released_state(contract, vault_id, 1)

    summary = {
        "vaultId": vault_id,
        "releaseTxHash": release_tx_hash,
        "reportPath": str(report_path),
        "assertions": {
            "seededState": {
                "oneVaultExists": True,
                "threeMilestonesExist": True,
                "milestone0Released": True,
                "milestone1Pending": True,
                "vaultStatusActive": True,
                "releasedBudget4000": True,
                "remainingBudget8000": True,
            },
            "assessment": {
                "passed": True,
                "fixedOnChainAmount": True,
                "vaultAndMilestoneIdsPresent": True,
                "advisoryTrustBoundaryPresent": True,
                "noAutomaticTransaction": True,
            },
            "postRelease": {
                "milestone1Released": True,
                "releasedBudget8000": True,
                "remainingBudget4000": True,
                "vaultStillActive": True,
            },
        },
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
