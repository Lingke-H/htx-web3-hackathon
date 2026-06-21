export type ProofMode = "public" | "local" | "fallback";

export type ReleaseActionState = "idle" | "signing" | "submitted" | "confirmed" | "error";

export type EvidenceManifest = {
  schemaVersion: number;
  codeCommit: string;
  chainId: number;
  network: string;
  contracts: {
    season: string;
    creditLedger: string;
    leaderboard: string;
    market: string;
    marketFactory: string;
    incubationVault: string;
  };
  marketId: number;
  vaultId: number;
  provider: string;
  model: string;
  promptVersion: string;
  inputDigest: string;
  evidenceDigest: string;
  artifacts: Record<string, string>;
  explorer: {
    baseUrl: string;
    contracts: Record<string, string>;
    transactions: Record<string, string>;
  };
};

export type PublicProofState = {
  sourceMode: ProofMode;
  deployment: EvidenceManifest["contracts"] | null;
  marketId: number | null;
  vaultId: number | null;
  aiPriorBps: number | null;
  crowdOddsBps: number | null;
  verificationPassed: boolean;
  leaderboard: Array<{ account: string; score: number }>;
  milestones: Array<{ id: number; label: string; releaseAmount: string; released: boolean }>;
  explorerUrls: EvidenceManifest["explorer"] | null;
  lastUpdated: string | null;
  error: string | null;
};

const BASE_SEPOLIA_CHAIN_ID = 84532;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const digestPattern = /^[0-9a-fA-F]{64}$/;
const commitPattern = /^[0-9a-fA-F]{40}$/;

export function resolveProofMode({
  requestedMode,
  hasPublicConfig,
  hasLocalConfig,
}: {
  requestedMode?: string;
  hasPublicConfig: boolean;
  hasLocalConfig: boolean;
}): ProofMode {
  if (requestedMode === "public" && hasPublicConfig) {
    return "public";
  }
  if (requestedMode === "local" && hasLocalConfig) {
    return "local";
  }
  return "fallback";
}

export function validatePublicProofManifest(
  manifest: EvidenceManifest,
): { valid: boolean; reason: string | null } {
  if (manifest.chainId !== BASE_SEPOLIA_CHAIN_ID || manifest.network !== "base-sepolia") {
    return { valid: false, reason: "Evidence manifest must target Base Sepolia (chain 84532)." };
  }
  if (!commitPattern.test(manifest.codeCommit)) {
    return { valid: false, reason: "Evidence manifest contains an invalid code commit." };
  }
  for (const [name, value] of Object.entries(manifest.contracts)) {
    if (!addressPattern.test(value) || value.toLowerCase() === ZERO_ADDRESS) {
      return { valid: false, reason: `Evidence manifest contains an invalid ${name} address.` };
    }
  }
  if (!Number.isSafeInteger(manifest.marketId) || manifest.marketId < 0) {
    return { valid: false, reason: "Evidence manifest contains an invalid market ID." };
  }
  if (!Number.isSafeInteger(manifest.vaultId) || manifest.vaultId < 0) {
    return { valid: false, reason: "Evidence manifest contains an invalid vault ID." };
  }
  if (!digestPattern.test(manifest.inputDigest) || !digestPattern.test(manifest.evidenceDigest)) {
    return { valid: false, reason: "Evidence manifest contains an invalid AI digest." };
  }
  if (
    Object.keys(manifest.artifacts).length === 0 ||
    Object.values(manifest.artifacts).some((digest) => !digestPattern.test(digest))
  ) {
    return { valid: false, reason: "Evidence manifest contains an invalid artifact digest." };
  }
  return { valid: true, reason: null };
}

export type ReleaseGuardInput = {
  mode: ProofMode;
  connected: boolean;
  chainId: number | null;
  hasOracleRole: boolean;
  vaultActive: boolean;
  milestoneReleased: boolean;
  verificationPassed: boolean;
  manifestVerified: boolean;
  dataError: string | null;
};

export function getReleaseGuard(input: ReleaseGuardInput): { allowed: boolean; reason: string | null } {
  if (input.dataError) {
    return { allowed: false, reason: input.dataError };
  }
  if (input.mode !== "public") {
    return { allowed: false, reason: "Milestone release is available only from verified public proof." };
  }
  if (!input.connected) {
    return { allowed: false, reason: "Connect the authorized reviewer wallet." };
  }
  if (input.chainId !== BASE_SEPOLIA_CHAIN_ID) {
    return { allowed: false, reason: "Switch the wallet to Base Sepolia (chain 84532)." };
  }
  if (!input.manifestVerified) {
    return { allowed: false, reason: "The evidence manifest has not passed digest validation." };
  }
  if (!input.verificationPassed) {
    return { allowed: false, reason: "A passing verification report is required." };
  }
  if (!input.vaultActive) {
    return { allowed: false, reason: "The incubation vault is not ACTIVE." };
  }
  if (input.milestoneReleased) {
    return { allowed: false, reason: "This milestone has already been released." };
  }
  if (!input.hasOracleRole) {
    return { allowed: false, reason: "The connected wallet does not have ORACLE_ROLE." };
  }
  return { allowed: true, reason: null };
}
