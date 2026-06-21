"use client";

import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { HologramCard } from "@/components/sci-fi/hologram-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/demo-data";
import { usePublicProof } from "@/lib/public-proof-live";

function compact(value: string | null | undefined, size = 10) {
  if (!value) return "—";
  return value.length > size * 2 ? `${value.slice(0, size)}…${value.slice(-size)}` : value;
}

export function PublicProofPanel({ locale, address, chainId }: { locale: Locale; address: string | null; chainId: number | null }) {
  const live = usePublicProof(address, chainId);
  const { proof, manifest } = live;
  const zh = locale === "zh";
  const modeLabel = proof.sourceMode === "public"
    ? (zh ? "Base Sepolia 公开证明" : "Base Sepolia public proof")
    : (zh ? "Seeded fallback（独立）" : "Seeded fallback (separate)");
  const actionLabel = {
    idle: zh ? "释放 Milestone 0" : "Release milestone 0",
    signing: zh ? "等待钱包签名…" : "Awaiting wallet signature…",
    submitted: zh ? "交易已提交…" : "Transaction submitted…",
    confirmed: zh ? "交易已确认" : "Transaction confirmed",
    error: zh ? "重新尝试释放" : "Retry release",
  }[live.actionState];
  const transactionUrl = live.transactionHash
    ? `${manifest?.explorer.baseUrl ?? "https://sepolia.basescan.org"}/tx/${live.transactionHash}`
    : null;

  return (
    <section id="public-proof">
      <HologramCard className="rounded-[32px] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="terminal-label">PUBLIC PROOF / JUDGE EVIDENCE</p>
            <h3 className="mt-3 text-[1.14rem] font-semibold text-white">
              {zh ? "可审计的 AI → Crowd → Settlement → Release 闭环" : "Auditable AI → Crowd → Settlement → Release loop"}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={proof.sourceMode === "public" && !proof.error ? "border-emerald-300/35 bg-emerald-400/14 text-emerald-50" : "border-amber-300/35 bg-amber-400/14 text-amber-50"} variant="outline">
              {modeLabel}
            </Badge>
            <Button aria-label={zh ? "刷新公开证明" : "Refresh public proof"} onClick={live.refresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" /> {zh ? "刷新" : "Refresh"}
            </Button>
          </div>
        </div>

        {proof.error ? <div className="mt-5 rounded-[20px] border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-50">{proof.error}</div> : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            [zh ? "AI 先验" : "AI Prior", proof.aiPriorBps === null ? "—" : `${(proof.aiPriorBps / 100).toFixed(2)}%`],
            [zh ? "群体赔率" : "Crowd Odds", proof.crowdOddsBps === null ? "—" : `${(proof.crowdOddsBps / 100).toFixed(2)}% YES`],
            [zh ? "验证" : "Verification", proof.verificationPassed ? "PASSED" : "UNVERIFIED"],
            [zh ? "市场状态" : "Market status", live.marketStatus === 1 ? "SETTLED" : live.marketStatus === 2 ? "VOIDED" : live.marketStatus === 0 ? "TRADING" : "—"],
          ].map(([label, value]) => (
            <div className="data-row rounded-[20px] px-4 py-4" key={label}>
              <p className="terminal-label">{label}</p><p className="mt-3 font-mono text-sm font-semibold text-cyan-100">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className="terminal-console rounded-[24px] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="terminal-label">CODE COMMIT</p><p className="mt-2 break-all font-mono text-sm text-slate-100">{manifest?.codeCommit ?? "—"}</p></div>
              <div><p className="terminal-label">MODEL / PROMPT</p><p className="mt-2 font-mono text-sm text-slate-100">{manifest ? `${manifest.provider}/${manifest.model} · ${manifest.promptVersion}` : "—"}</p></div>
              <div><p className="terminal-label">INPUT DIGEST</p><p className="mt-2 font-mono text-sm text-slate-100" title={manifest?.inputDigest}>{compact(manifest?.inputDigest)}</p></div>
              <div><p className="terminal-label">EVIDENCE DIGEST</p><p className="mt-2 font-mono text-sm text-slate-100" title={manifest?.evidenceDigest}>{compact(manifest?.evidenceDigest)}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {manifest ? Object.entries(manifest.explorer.contracts).map(([name, url]) => (
                <a className="inline-flex items-center gap-1 rounded-full border border-white/12 px-3 py-1 text-xs text-cyan-100 hover:border-cyan-300/40" href={url} key={name} rel="noreferrer" target="_blank">{name} <ExternalLink className="h-3 w-3" /></a>
              )) : null}
            </div>
          </div>

          <div className="data-row rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="terminal-label">AUTHORIZED REVIEWER ACTION</p><p className="mt-2 text-sm text-slate-300">ORACLE_ROLE: {live.hasOracleRole ? "YES" : "NO"}</p></div>
              <ShieldCheck className={live.hasOracleRole ? "h-5 w-5 text-emerald-300" : "h-5 w-5 text-slate-500"} />
            </div>
            <Button className="mt-4 w-full" disabled={!live.releaseGuard.allowed || live.actionState === "signing" || live.actionState === "submitted" || live.actionState === "confirmed"} onClick={() => void live.releaseMilestone()}>{actionLabel}</Button>
            <p className="mt-3 text-xs leading-6 text-slate-400">{live.actionError ?? live.releaseGuard.reason ?? (zh ? "所有链上和证据 guard 均已通过。" : "All on-chain and evidence guards passed.")}</p>
            {transactionUrl ? <a className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-100" href={transactionUrl} rel="noreferrer" target="_blank">{compact(live.transactionHash, 8)} <ExternalLink className="h-3 w-3" /></a> : null}
          </div>
        </div>

        {proof.leaderboard.length > 0 || proof.milestones.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="data-row rounded-[22px] p-4"><p className="terminal-label">LEADERBOARD</p>{proof.leaderboard.map((entry, index) => <p className="mt-2 font-mono text-xs text-slate-200" key={entry.account}>#{index + 1} {compact(entry.account, 8)} · {entry.score > 0 ? "+" : ""}{entry.score}</p>)}</div>
            <div className="data-row rounded-[22px] p-4"><p className="terminal-label">MILESTONES</p>{proof.milestones.map((milestone) => <p className="mt-2 text-xs text-slate-200" key={milestone.id}>M{milestone.id} · {milestone.label} · {milestone.releaseAmount} · {milestone.released ? "RELEASED" : "LOCKED"}</p>)}</div>
          </div>
        ) : null}
        <p className="mt-4 text-xs leading-6 text-slate-500">{proof.lastUpdated ? `${zh ? "最后读取" : "Last read"}: ${new Date(proof.lastUpdated).toLocaleString()}` : (zh ? "没有经过验证的 public proof 时，本面板不会把种子数据冒充链上状态。" : "When verified public proof is unavailable, this panel never presents seeded data as on-chain state.")}</p>
      </HologramCard>
    </section>
  );
}
