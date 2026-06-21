import assert from "node:assert/strict";
import test from "node:test";

import {
  getReleaseGuard,
  resolveProofMode,
  validatePublicProofManifest,
  type EvidenceManifest,
} from "./public-proof.ts";

const address = "0x1111111111111111111111111111111111111111";

const manifest: EvidenceManifest = {
  schemaVersion: 1,
  codeCommit: "d".repeat(40),
  chainId: 84532,
  network: "base-sepolia",
  contracts: {
    season: address,
    creditLedger: address,
    leaderboard: address,
    market: address,
    marketFactory: address,
    incubationVault: address,
  },
  marketId: 0,
  vaultId: 0,
  provider: "openai",
  model: "gpt-4o-mini",
  promptVersion: "veil-scout-ai-prior-v1",
  inputDigest: "a".repeat(64),
  evidenceDigest: "b".repeat(64),
  artifacts: { "ai-report.json": "c".repeat(64) },
  explorer: { baseUrl: "https://sepolia.basescan.org", contracts: {}, transactions: {} },
};

test("public mode takes precedence only when its required configuration exists", () => {
  assert.equal(resolveProofMode({ requestedMode: "public", hasPublicConfig: true, hasLocalConfig: true }), "public");
  assert.equal(resolveProofMode({ requestedMode: "public", hasPublicConfig: false, hasLocalConfig: true }), "fallback");
  assert.equal(resolveProofMode({ requestedMode: "local", hasPublicConfig: true, hasLocalConfig: true }), "local");
  assert.equal(resolveProofMode({ requestedMode: undefined, hasPublicConfig: true, hasLocalConfig: true }), "fallback");
});

test("manifest validation rejects zero addresses and wrong chain", () => {
  assert.deepEqual(validatePublicProofManifest(manifest), { valid: true, reason: null });
  assert.equal(validatePublicProofManifest({ ...manifest, chainId: 1 }).valid, false);
  assert.equal(
    validatePublicProofManifest({
      ...manifest,
      contracts: { ...manifest.contracts, market: "0x0000000000000000000000000000000000000000" },
    }).valid,
    false,
  );
});

const readyGuard = {
  mode: "public" as const,
  connected: true,
  chainId: 84532,
  hasOracleRole: true,
  vaultActive: true,
  milestoneReleased: false,
  verificationPassed: true,
  manifestVerified: true,
  dataError: null,
};

test("release guard allows only fully verified authorized Base Sepolia state", () => {
  assert.deepEqual(getReleaseGuard(readyGuard), { allowed: true, reason: null });
  assert.match(getReleaseGuard({ ...readyGuard, chainId: 1 }).reason ?? "", /Base Sepolia/);
  assert.match(getReleaseGuard({ ...readyGuard, hasOracleRole: false }).reason ?? "", /ORACLE_ROLE/);
  assert.match(getReleaseGuard({ ...readyGuard, verificationPassed: false }).reason ?? "", /verification/);
  assert.match(getReleaseGuard({ ...readyGuard, manifestVerified: false }).reason ?? "", /manifest/);
  assert.match(getReleaseGuard({ ...readyGuard, milestoneReleased: true }).reason ?? "", /released/);
  assert.match(getReleaseGuard({ ...readyGuard, dataError: "RPC unavailable" }).reason ?? "", /RPC unavailable/);
});
