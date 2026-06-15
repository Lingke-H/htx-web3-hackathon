from __future__ import annotations

import json
import shlex
from pathlib import Path
from typing import Any

from eth_account import Account
from web3 import Web3

from .models import ChainSnapshot, CreatedMarket, ProjectConfig, TxReceiptSummary


class ChainClient:
    def __init__(self, rpc_url: str, contracts_dir: Path, deployment_json: Path, private_key: str | None = None, chain_id: int = 31337) -> None:
        self.rpc_url = rpc_url
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.contracts_dir = contracts_dir
        self.deployment_json = deployment_json
        self.private_key = private_key
        self.chain_id = chain_id
        self.deployment = self._load_deployment()

    def count_logs(self, address: str, from_block: int | str = 0, to_block: int | str = "latest", topic0: str | None = None) -> int:
        params: dict[str, Any] = {
            "address": Web3.to_checksum_address(address),
            "fromBlock": from_block,
            "toBlock": to_block,
        }
        if topic0:
            params["topics"] = [topic0]
        return len(self.w3.eth.get_logs(params))

    def snapshot_event_count(self, address: str, from_block: int | str = 0, to_block: int | str = "latest", topic0: str | None = None) -> ChainSnapshot:
        try:
            count = self.count_logs(address, from_block, to_block, topic0)
            return ChainSnapshot(
                rpc_url=self.rpc_url,
                latest_block=self.w3.eth.block_number,
                contract_event_counts={Web3.to_checksum_address(address): count},
            )
        except Exception as exc:  # web3 provider errors vary by backend.
            return ChainSnapshot(rpc_url=self.rpc_url, data_unavailable=True, error=str(exc))

    def create_market(self, project: ProjectConfig, metadata_uri: str) -> CreatedMarket:
        market_factory = self._contract("MarketFactory", self.deployment["marketFactory"])
        spec_hash = Web3.keccak(text=f"{project.slug}:{project.milestone}:{metadata_uri}")
        trading_deadline = project.trading_deadline or max(project.deadline - 86_400, 1)
        resolution_deadline = project.resolution_deadline or project.deadline
        force_void_deadline = project.force_void_deadline or project.deadline + 7 * 86_400
        spec = (
            spec_hash,
            metadata_uri,
            project.season_id,
            trading_deadline,
            resolution_deadline,
            force_void_deadline,
            Web3.to_checksum_address(project.project_owner),
        )
        tx = market_factory.functions.createMarket(spec).build_transaction(self._tx_base())
        receipt = self._send(tx)
        market_id = self._market_id_from_receipt(receipt)
        return CreatedMarket(
            projectSlug=project.slug,
            marketId=market_id,
            specHash=spec_hash.hex(),
            metadataURI=metadata_uri,
            tx=self._receipt_summary(receipt),
        )

    def can_settle(self, market_id: int) -> bool:
        return bool(self.market().functions.canSettle(market_id).call())

    def current_block_timestamp(self) -> int:
        block = self.w3.eth.get_block("latest")
        return int(block["timestamp"])

    def market_resolution_deadline(self, market_id: int) -> int:
        data = self.market().functions.getMarket(market_id).call()
        return int(data[4])

    def market_status(self, market_id: int) -> int:
        data = self.market().functions.getMarket(market_id).call()
        return int(data[11])

    def advance_time(self, seconds: int) -> None:
        if seconds <= 0:
            return
        provider = self.w3.provider
        provider.make_request("evm_increaseTime", [seconds])
        provider.make_request("evm_mine", [])

    def settle(self, market_id: int, passed: bool) -> TxReceiptSummary:
        if self.market_status(market_id) != 0:
            raise RuntimeError(f"market {market_id} is not TRADING")
        if not self.can_settle(market_id):
            raise RuntimeError(f"market {market_id} is not eligible for settlement")
        tx = self.market().functions.settle(market_id, passed).build_transaction(self._tx_base())
        return self._receipt_summary(self._send(tx))

    def market(self):
        return self._contract("Market", self.deployment["market"])

    def incubation_vault(self):
        return self._contract("IncubationVault", self.deployment["incubationVault"])

    def get_incubation_vault(self, vault_id: int) -> dict[str, Any]:
        data = self.incubation_vault().functions.getVault(vault_id).call()
        return {
            "projectOwner": data[0],
            "sponsor": data[1],
            "totalBudget": int(data[2]),
            "allocatedBudget": int(data[3]),
            "releasedBudget": int(data[4]),
            "refundedBudget": int(data[5]),
            "milestoneCount": int(data[6]),
            "status": self._vault_status_name(int(data[7])),
            "metadataURI": data[8],
        }

    def get_incubation_milestone(self, vault_id: int, milestone_id: int) -> dict[str, Any]:
        data = self.incubation_vault().functions.getMilestone(vault_id, milestone_id).call()
        return {
            "label": data[0],
            "releaseAmount": int(data[1]),
            "metadataURI": data[2],
            "released": bool(data[3]),
        }

    def remaining_incubation_budget(self, vault_id: int) -> int:
        return int(self.incubation_vault().functions.remainingBudget(vault_id).call())

    def release_milestone_command_preview(
        self, vault_id: int, milestone_id: int, execution_summary: str
    ) -> str:
        quoted_summary = shlex.quote(" ".join(execution_summary.split()))
        reviewer_address = self.deployment.get("deployer", "$DEPLOYER_ADDRESS")
        return (
            f'cast send {self.deployment["incubationVault"]} '
            f'"releaseMilestone(uint256,uint256,string)" {vault_id} {milestone_id} '
            f"{quoted_summary} --rpc-url $RPC_URL --unlocked --from {reviewer_address}"
        )

    def _contract(self, name: str, address: str):
        abi_path = self.contracts_dir / "abi" / f"{name}.json"
        with abi_path.open("r", encoding="utf-8") as handle:
            abi = json.load(handle)
        return self.w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)

    def _load_deployment(self) -> dict[str, Any]:
        with self.deployment_json.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _tx_base(self) -> dict[str, Any]:
        if not self.private_key:
            raise RuntimeError("PRIVATE_KEY is required for on-chain transactions")
        account = Account.from_key(self.private_key)
        return {
            "from": account.address,
            "nonce": self.w3.eth.get_transaction_count(account.address),
            "chainId": self.chain_id,
        }

    def _send(self, tx: dict[str, Any]):
        if not self.private_key:
            raise RuntimeError("PRIVATE_KEY is required for on-chain transactions")
        account = Account.from_key(self.private_key)
        if "gas" not in tx:
            tx["gas"] = int(self.w3.eth.estimate_gas(tx) * 1.2)
        if "gasPrice" not in tx and "maxFeePerGas" not in tx:
            tx["gasPrice"] = self.w3.eth.gas_price
        signed = account.sign_transaction(tx)
        raw_tx = getattr(signed, "raw_transaction", None) or signed.rawTransaction
        tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
        return self.w3.eth.wait_for_transaction_receipt(tx_hash)

    @staticmethod
    def _receipt_summary(receipt) -> TxReceiptSummary:
        return TxReceiptSummary(
            txHash=receipt["transactionHash"].hex(),
            blockNumber=receipt.get("blockNumber"),
            gasUsed=receipt.get("gasUsed"),
            status=receipt.get("status"),
        )

    @staticmethod
    def _market_id_from_receipt(receipt) -> int:
        for log in receipt.get("logs", []):
            topics = log.get("topics", [])
            if len(topics) >= 2:
                return int(topics[1].hex(), 16)
        raise RuntimeError("could not infer marketId from transaction receipt")

    @staticmethod
    def _vault_status_name(status: int) -> str:
        return {
            0: "ACTIVE",
            1: "PAUSED",
            2: "REFUNDED",
        }.get(status, f"UNKNOWN_{status}")
