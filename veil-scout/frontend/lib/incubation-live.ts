"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPublicClient,
  custom,
  isAddress,
  type Address,
} from "viem";
import type { DemoContent, Locale, StepState } from "@/lib/demo-data";
import { getInjectedProvider } from "@/lib/wallet-state";

const incubationVaultAbi = [
  {
    type: "function",
    name: "getVault",
    stateMutability: "view",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "projectOwner", type: "address" },
          { name: "sponsor", type: "address" },
          { name: "totalBudget", type: "uint256" },
          { name: "allocatedBudget", type: "uint256" },
          { name: "releasedBudget", type: "uint256" },
          { name: "refundedBudget", type: "uint256" },
          { name: "milestoneCount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getMilestone",
    stateMutability: "view",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "milestoneId", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "label", type: "string" },
          { name: "releaseAmount", type: "uint256" },
          { name: "metadataURI", type: "string" },
          { name: "released", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "remainingBudget",
    stateMutability: "view",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type IncubationContent = DemoContent["incubation"];
type IncubationPanelState = {
  incubation: IncubationContent;
  dataSourceLabel: string;
  dataMode: "live" | "fallback";
};

const configuredVaultAddress = process.env.NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS;
const configuredVaultId = process.env.NEXT_PUBLIC_INCUBATION_VAULT_ID;
const configuredProjectName = process.env.NEXT_PUBLIC_INCUBATION_SELECTED_PROJECT;

function localizedMessage(locale: Locale, english: string, chinese: string) {
  return locale === "zh" ? chinese : english;
}

function withFallbackReason(
  fallback: IncubationContent,
  locale: Locale,
  reason: string,
): IncubationPanelState {
  return {
    incubation: {
      ...fallback,
      note: `${fallback.note} ${localizedMessage(locale, "Fallback reason:", "回退原因：")} ${reason}`,
    },
    dataSourceLabel: fallback.fallbackDataLabel,
    dataMode: "fallback",
  };
}

function milestoneSummary(
  locale: Locale,
  released: boolean,
  isCurrent: boolean,
  statusLabel: string,
): { signal: string; state: StepState; summary: string } {
  if (released) {
    return {
      signal: localizedMessage(locale, "Released", "已释放"),
      state: "complete",
      summary: localizedMessage(
        locale,
        "This fixed sponsor tranche has already been released in the demo ledger.",
        "这笔固定 sponsor tranche 已经在 demo 账本中释放。",
      ),
    };
  }

  if (statusLabel === "PAUSED") {
    return {
      signal: localizedMessage(locale, "Paused", "已暂停"),
      state: "current",
      summary: localizedMessage(
        locale,
        "Vault review is paused. Do not release this milestone until the hold is cleared.",
        "Vault 当前处于暂停复核状态，在解除暂停前不应释放这个 milestone。",
      ),
    };
  }

  if (statusLabel === "REFUNDED") {
    return {
      signal: localizedMessage(locale, "Refunded", "已退款"),
      state: "upcoming",
      summary: localizedMessage(
        locale,
        "This milestone is no longer releasable because the remaining sponsor budget was refunded.",
        "剩余 sponsor 预算已经退回，因此这个 milestone 不再可释放。",
      ),
    };
  }

  if (isCurrent) {
    return {
      signal: localizedMessage(locale, "Under review", "复核中"),
      state: "current",
      summary: localizedMessage(
        locale,
        "This is the active proof-of-execution checkpoint. An authorized reviewer can release it after a passing report.",
        "这是当前的 proof-of-execution 检查点。通过验证报告后，由授权 reviewer 决定是否释放。",
      ),
    };
  }

  return {
    signal: localizedMessage(locale, "Queued", "排队中"),
    state: "upcoming",
    summary: localizedMessage(
      locale,
      "This tranche stays queued until the earlier milestone is reviewed and released.",
      "在前一个 milestone 完成复核和释放之前，这一档 tranche 会继续排队。",
    ),
  };
}

function statusPresentation(locale: Locale, status: number) {
  if (status === 1) {
    return {
      label: "PAUSED",
      tone: "caution" as const,
      executionBadge: localizedMessage(
        locale,
        "Execution badge: Review hold active (demo)",
        "执行徽章：复核暂停中（demo）",
      ),
    };
  }
  if (status === 2) {
    return {
      label: "REFUNDED",
      tone: "neutral" as const,
      executionBadge: localizedMessage(
        locale,
        "Execution badge: Refunded remainder (demo)",
        "执行徽章：剩余预算已退款（demo）",
      ),
    };
  }

  return {
    label: "ACTIVE",
    tone: "positive" as const,
    executionBadge: localizedMessage(
      locale,
      "Execution badge: Live milestone ledger (demo)",
      "执行徽章：实时 milestone 账本（demo）",
    ),
  };
}

export function useIncubationPanelState(
  locale: Locale,
  fallback: IncubationContent,
  chainName: string | null,
): IncubationPanelState {
  const [liveState, setLiveState] = useState<{
    key: string;
    value: IncubationPanelState;
  } | null>(null);
  const provider = getInjectedProvider();
  const vaultId = Number.parseInt(configuredVaultId ?? "", 10);
  const currentKey = `${configuredVaultAddress ?? "none"}:${configuredVaultId ?? "none"}:${chainName ?? "none"}:${locale}`;
  const fallbackReason = useCallback(
    (reason: string) => withFallbackReason(fallback, locale, reason),
    [fallback, locale],
  );
  const preconditionFailure =
    !configuredVaultAddress || !isAddress(configuredVaultAddress)
      ? localizedMessage(locale, "no IncubationVault address is configured.", "没有配置 IncubationVault 地址。")
      : Number.isNaN(vaultId) || vaultId < 0
        ? localizedMessage(locale, "no seeded vault id is configured.", "没有配置 seeded vault id。")
        : !provider
          ? localizedMessage(
              locale,
              "no injected wallet/provider is available in this browser session.",
              "当前浏览器会话里没有可用的钱包或 provider。",
            )
          : null;

  useEffect(() => {
    if (preconditionFailure || !provider) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const client = createPublicClient({
          transport: custom(provider),
        });

        const [vault, remainingBudget] = await Promise.all([
          client.readContract({
            address: configuredVaultAddress as Address,
            abi: incubationVaultAbi,
            functionName: "getVault",
            args: [BigInt(vaultId)],
          }),
          client.readContract({
            address: configuredVaultAddress as Address,
            abi: incubationVaultAbi,
            functionName: "remainingBudget",
            args: [BigInt(vaultId)],
          }),
        ]);

        const milestoneCount = Number(vault.milestoneCount);
        const status = statusPresentation(locale, Number(vault.status));
        const milestoneTuples = await Promise.all(
          Array.from({ length: milestoneCount }, (_, index) =>
            client.readContract({
              address: configuredVaultAddress as Address,
              abi: incubationVaultAbi,
              functionName: "getMilestone",
              args: [BigInt(vaultId), BigInt(index)],
            }),
          ),
        );
        let currentAssigned = false;
        const milestones = milestoneTuples.map((milestone, index) => {
          const released = Boolean(milestone.released);
          const isCurrent = !released && status.label === "ACTIVE" && !currentAssigned;
          if (isCurrent) {
            currentAssigned = true;
          }
          const presentation = milestoneSummary(locale, released, isCurrent, status.label);
          return {
            id: `M${index + 1}`,
            title: milestone.label || `Milestone ${index + 1}`,
            summary: presentation.summary,
            releaseAmount: Number(milestone.releaseAmount),
            state: presentation.state,
            signal: presentation.signal,
          };
        });

        const liveIncubation: IncubationContent = {
          ...fallback,
          selectedProject: configuredProjectName ?? fallback.selectedProject,
          executionBadge: status.executionBadge,
          statusLabel: status.label,
          statusTone: status.tone,
          totalBudget: Number(vault.totalBudget),
          releasedBudget: Number(vault.releasedBudget),
          refundedBudget: Number(vault.refundedBudget),
          remainingBudget: Number(remainingBudget),
          milestoneCount,
          note: localizedMessage(
            locale,
            `Reading IncubationVault ${configuredVaultAddress} / vault ${vaultId} on ${chainName ?? "the connected network"}. Sponsor units remain demo-grade, and an authorized reviewer must still submit releaseMilestone.`,
            `当前读取的是 ${chainName ?? "已连接网络"} 上的 IncubationVault ${configuredVaultAddress} / vault ${vaultId}。Sponsor 单位仍然是 demo 记账，最终仍需授权 reviewer 提交 releaseMilestone。`,
          ),
          milestones,
        };

        if (!cancelled) {
          setLiveState({
            key: currentKey,
            value: {
              incubation: liveIncubation,
              dataSourceLabel: fallback.liveDataLabel,
              dataMode: "live",
            },
          });
        }
      } catch {
        if (!cancelled) {
          setLiveState({
            key: currentKey,
            value: fallbackReason(
              localizedMessage(
                locale,
                "the network was unavailable or the configured vault could not be read.",
                "网络不可用，或配置的 vault 无法读取。",
              ),
            ),
          });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [chainName, currentKey, fallback, fallbackReason, locale, preconditionFailure, provider, vaultId]);

  if (preconditionFailure) {
    return fallbackReason(preconditionFailure);
  }

  return liveState?.key === currentKey
    ? liveState.value
    : {
        incubation: fallback,
        dataSourceLabel: fallback.fallbackDataLabel,
        dataMode: "fallback",
      };
}
