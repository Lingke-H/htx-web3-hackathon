"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  keccak256,
  toBytes,
  type Address,
  type Hash,
} from "viem";

import {
  getReleaseGuard,
  resolveProofMode,
  validatePublicProofManifest,
  type EvidenceManifest,
  type PublicProofState,
  type ReleaseActionState,
} from "@/lib/public-proof";
import { getInjectedProvider } from "@/lib/wallet-state";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const ORACLE_ROLE = keccak256(toBytes("ORACLE_ROLE"));

const marketAbi = [
  {
    type: "function",
    name: "getYesOdds",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ name: "yesPriceBps", type: "uint256" }],
  },
  {
    type: "function",
    name: "getMarket",
    stateMutability: "view",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "specHash", type: "bytes32" },
          { name: "metadataURI", type: "string" },
          { name: "seasonId", type: "uint256" },
          { name: "tradingDeadline", type: "uint256" },
          { name: "resolutionDeadline", type: "uint256" },
          { name: "forceVoidDeadline", type: "uint256" },
          { name: "claimDeadline", type: "uint256" },
          { name: "projectOwner", type: "address" },
          { name: "yesStake", type: "uint256" },
          { name: "noStake", type: "uint256" },
          { name: "winningsPerShare", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "result", type: "uint8" },
        ],
      },
    ],
  },
] as const;

const leaderboardAbi = [
  {
    type: "function",
    name: "getTopN",
    stateMutability: "view",
    inputs: [
      { name: "seasonId", type: "uint256" },
      { name: "topN", type: "uint256" },
    ],
    outputs: [
      { name: "rankedScouts", type: "bytes32[]" },
      { name: "rankedScores", type: "int256[]" },
    ],
  },
] as const;

const vaultAbi = [
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
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "releaseMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "milestoneId", type: "uint256" },
      { name: "executionSummary", type: "string" },
    ],
    outputs: [],
  },
] as const;

type ProofArtifacts = {
  aiPriorBps: number;
  verificationPassed: boolean;
};

type LiveProofDetails = {
  manifest: EvidenceManifest | null;
  manifestVerified: boolean;
  hasOracleRole: boolean;
  vaultActive: boolean;
  marketStatus: number | null;
};

const emptyProof: PublicProofState = {
  sourceMode: "fallback",
  deployment: null,
  marketId: null,
  vaultId: null,
  aiPriorBps: null,
  crowdOddsBps: null,
  verificationPassed: false,
  leaderboard: [],
  milestones: [],
  explorerUrls: null,
  lastUpdated: null,
  error: null,
};

function requiredPublicConfig() {
  const values = {
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL?.trim(),
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID?.trim(),
    marketAddress: process.env.NEXT_PUBLIC_MARKET_ADDRESS?.trim(),
    marketId: process.env.NEXT_PUBLIC_MARKET_ID?.trim(),
    leaderboardAddress: process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS?.trim(),
    vaultAddress: process.env.NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS?.trim(),
    vaultId: process.env.NEXT_PUBLIC_INCUBATION_VAULT_ID?.trim(),
    manifestUrl: process.env.NEXT_PUBLIC_EVIDENCE_MANIFEST_URL?.trim(),
  };
  return { values, complete: Object.values(values).every(Boolean) };
}

const publicConfig = requiredPublicConfig();

function artifactUrl(manifestUrl: string, artifactName: string) {
  const absoluteManifest = new URL(manifestUrl, window.location.origin);
  return new URL(artifactName, absoluteManifest).toString();
}

async function sha256Hex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function loadAndVerifyArtifacts(
  manifest: EvidenceManifest,
  manifestUrl: string,
): Promise<ProofArtifacts> {
  const decoded: Record<string, unknown> = {};
  for (const [name, expectedDigest] of Object.entries(manifest.artifacts)) {
    const response = await fetch(artifactUrl(manifestUrl, name), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Evidence artifact ${name} returned HTTP ${response.status}.`);
    }
    const bytes = await response.arrayBuffer();
    if ((await sha256Hex(bytes)) !== expectedDigest.toLowerCase()) {
      throw new Error(`Evidence artifact digest mismatch: ${name}.`);
    }
    if (name === "ai-report.json" || name === "verification.json" || name === "release-assessment.json") {
      decoded[name] = JSON.parse(new TextDecoder().decode(bytes));
    }
  }

  const ai = decoded["ai-report.json"] as Record<string, unknown> | undefined;
  const verification = decoded["verification.json"] as Record<string, unknown> | undefined;
  const release = decoded["release-assessment.json"] as Record<string, unknown> | undefined;
  if (!ai || !verification || !release) {
    throw new Error("Required AI, verification, or release assessment artifact is missing.");
  }
  if (ai.fallbackUsed !== false) {
    throw new Error("Fallback AI evidence cannot enter public proof.");
  }
  if (
    ai.provider !== manifest.provider ||
    ai.model !== manifest.model ||
    ai.promptVersion !== manifest.promptVersion ||
    ai.inputDigest !== manifest.inputDigest ||
    ai.evidenceDigest !== manifest.evidenceDigest
  ) {
    throw new Error("AI provenance does not match the evidence manifest.");
  }
  if (verification.passed !== true || release.passed !== true) {
    throw new Error("Verification and release assessment must both pass.");
  }
  const probability = Number(ai.aiPriorProbability ?? ai.probability);
  if (!Number.isFinite(probability) || probability < 0.05 || probability > 0.95) {
    throw new Error("AI Prior probability is invalid.");
  }
  return { aiPriorBps: Math.round(probability * 10_000), verificationPassed: true };
}

function assertConfigMatchesManifest(manifest: EvidenceManifest, config: ReturnType<typeof requiredPublicConfig>["values"]) {
  if (Number(config.chainId) !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error("NEXT_PUBLIC_CHAIN_ID must be Base Sepolia 84532.");
  }
  if (
    manifest.contracts.market.toLowerCase() !== config.marketAddress?.toLowerCase() ||
    manifest.contracts.leaderboard.toLowerCase() !== config.leaderboardAddress?.toLowerCase() ||
    manifest.contracts.incubationVault.toLowerCase() !== config.vaultAddress?.toLowerCase() ||
    manifest.marketId !== Number(config.marketId) ||
    manifest.vaultId !== Number(config.vaultId)
  ) {
    throw new Error("Public environment configuration does not match the evidence manifest.");
  }
}

export function usePublicProof(address: string | null, chainId: number | null) {
  const requestedMode = process.env.NEXT_PUBLIC_DEMO_MODE;
  const config = publicConfig;
  const mode = resolveProofMode({
    requestedMode,
    hasPublicConfig: config.complete,
    hasLocalConfig: Boolean(process.env.NEXT_PUBLIC_INCUBATION_VAULT_ADDRESS),
  });
  const [proof, setProof] = useState<PublicProofState>({ ...emptyProof, sourceMode: "public" });
  const [details, setDetails] = useState<LiveProofDetails>({
    manifest: null,
    manifestVerified: false,
    hasOracleRole: false,
    vaultActive: false,
    marketStatus: null,
  });
  const [actionState, setActionState] = useState<ReleaseActionState>("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<Hash | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refresh = useCallback(() => setRefreshNonce((value) => value + 1), []);

  useEffect(() => {
    if (mode !== "public") {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const manifestResponse = await fetch(config.values.manifestUrl!, { cache: "no-store" });
        if (!manifestResponse.ok) {
          throw new Error(`Evidence manifest returned HTTP ${manifestResponse.status}.`);
        }
        const manifest = (await manifestResponse.json()) as EvidenceManifest;
        const validation = validatePublicProofManifest(manifest);
        if (!validation.valid) {
          throw new Error(validation.reason ?? "Evidence manifest is invalid.");
        }
        assertConfigMatchesManifest(manifest, config.values);
        const artifacts = await loadAndVerifyArtifacts(manifest, config.values.manifestUrl!);
        const client = createPublicClient({ transport: http(config.values.rpcUrl) });
        const rpcChainId = await client.getChainId();
        if (rpcChainId !== BASE_SEPOLIA_CHAIN_ID) {
          throw new Error(`Configured RPC returned chain ${rpcChainId}, not Base Sepolia 84532.`);
        }
        const marketAddress = manifest.contracts.market as Address;
        const leaderboardAddress = manifest.contracts.leaderboard as Address;
        const vaultAddress = manifest.contracts.incubationVault as Address;
        const marketId = BigInt(manifest.marketId);
        const vaultId = BigInt(manifest.vaultId);
        const [market, odds, vault] = await Promise.all([
          client.readContract({ address: marketAddress, abi: marketAbi, functionName: "getMarket", args: [marketId] }),
          client.readContract({ address: marketAddress, abi: marketAbi, functionName: "getYesOdds", args: [marketId] }),
          client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "getVault", args: [vaultId] }),
        ]);
        const [scoutIds, scores] = await client.readContract({
          address: leaderboardAddress,
          abi: leaderboardAbi,
          functionName: "getTopN",
          args: [market.seasonId, BigInt(10)],
        });
        const milestoneCount = Number(vault.milestoneCount);
        if (!Number.isSafeInteger(milestoneCount) || milestoneCount < 0 || milestoneCount > 100) {
          throw new Error("On-chain milestone count is invalid.");
        }
        const milestones = await Promise.all(
          Array.from({ length: milestoneCount }, async (_, index) => {
            const milestone = await client.readContract({
              address: vaultAddress,
              abi: vaultAbi,
              functionName: "getMilestone",
              args: [vaultId, BigInt(index)],
            });
            return {
              id: index,
              label: milestone.label,
              releaseAmount: milestone.releaseAmount.toString(),
              released: milestone.released,
            };
          }),
        );
        const hasOracleRole = address && isAddress(address)
          ? await client.readContract({
              address: vaultAddress,
              abi: vaultAbi,
              functionName: "hasRole",
              args: [ORACLE_ROLE, address as Address],
            })
          : false;
        if (!cancelled) {
          setProof({
            sourceMode: "public",
            deployment: manifest.contracts,
            marketId: manifest.marketId,
            vaultId: manifest.vaultId,
            aiPriorBps: artifacts.aiPriorBps,
            crowdOddsBps: Number(odds),
            verificationPassed: artifacts.verificationPassed,
            leaderboard: scoutIds.map((scoutId, index) => ({ account: scoutId, score: Number(scores[index]) })),
            milestones,
            explorerUrls: manifest.explorer,
            lastUpdated: new Date().toISOString(),
            error: null,
          });
          setDetails({
            manifest,
            manifestVerified: true,
            hasOracleRole,
            vaultActive: Number(vault.status) === 0,
            marketStatus: Number(market.status),
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Public proof could not be loaded.";
          setProof({ ...emptyProof, sourceMode: "public", error: message });
          setDetails({ manifest: null, manifestVerified: false, hasOracleRole: false, vaultActive: false, marketStatus: null });
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [address, config, mode, refreshNonce, requestedMode]);

  const effectiveProof =
    mode === "public"
      ? proof
      : {
          ...emptyProof,
          sourceMode: mode,
          error:
            requestedMode === "public"
              ? "Public proof configuration is incomplete; showing the separate seeded fallback."
              : "Public proof is not enabled; showing the separate seeded fallback.",
        };
  const firstMilestone = effectiveProof.milestones[0];
  const releaseGuard = getReleaseGuard({
    mode,
    connected: Boolean(address),
    chainId,
    hasOracleRole: details.hasOracleRole,
    vaultActive: details.vaultActive,
    milestoneReleased: firstMilestone?.released ?? false,
    verificationPassed: effectiveProof.verificationPassed,
    manifestVerified: details.manifestVerified,
    dataError: effectiveProof.error,
  });

  const releaseMilestone = useCallback(async () => {
    if (!releaseGuard.allowed || !details.manifest || !address || !firstMilestone) {
      setActionState("error");
      setActionError(releaseGuard.reason ?? "Milestone release preconditions are not satisfied.");
      return;
    }
    const provider = getInjectedProvider();
    if (!provider) {
      setActionState("error");
      setActionError("No injected wallet is available.");
      return;
    }
    try {
      setActionError(null);
      setTransactionHash(null);
      setActionState("signing");
      const walletClient = createWalletClient({ transport: custom(provider) });
      const hash = await walletClient.writeContract({
        account: address as Address,
        chain: null,
        address: details.manifest.contracts.incubationVault as Address,
        abi: vaultAbi,
        functionName: "releaseMilestone",
        args: [BigInt(details.manifest.vaultId), BigInt(firstMilestone.id), `verified:${details.manifest.evidenceDigest}`],
      });
      setTransactionHash(hash);
      setActionState("submitted");
      const client = createPublicClient({ transport: http(config.values.rpcUrl) });
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error("The release transaction reverted.");
      }
      setActionState("confirmed");
      refresh();
    } catch (error) {
      const code = (error as { code?: number })?.code;
      const message =
        code === 4001
          ? "The wallet signature was rejected. No release was submitted."
          : error instanceof Error
            ? error.message
            : "The release transaction failed.";
      setActionState("error");
      setActionError(message);
    }
  }, [address, config.values.rpcUrl, details.manifest, firstMilestone, refresh, releaseGuard.allowed, releaseGuard.reason]);

  return {
    proof: effectiveProof,
    manifest: details.manifest,
    marketStatus: details.marketStatus,
    hasOracleRole: details.hasOracleRole,
    releaseGuard,
    actionState,
    actionError,
    transactionHash,
    releaseMilestone,
    refresh,
  };
}
