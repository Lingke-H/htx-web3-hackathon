"use client";

import { Fingerprint, Wallet } from "lucide-react";
import type { DemoContent, StatusTone } from "@/lib/demo-data";
import { ConnectWalletButton } from "@/components/connect-wallet-button";
import { useWalletState } from "@/lib/wallet-state";
import { RiskBadge } from "@/components/risk-badge";

const supportedDemoChains = new Set([84532, 421614]);

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNativeBalance(balance: string | null) {
  if (!balance) {
    return "--";
  }
  return balance;
}

export function WalletStatusCard({ wallet }: { wallet: DemoContent["wallet"] }) {
  const { address, balance, chainId, chainName, error, hasProvider, isConnected } =
    useWalletState();

  const connectedTone: StatusTone = isConnected ? "positive" : "neutral";
  const networkTone: StatusTone = !isConnected
    ? "neutral"
    : supportedDemoChains.has(chainId ?? -1)
      ? "positive"
      : "caution";
  const walletConnectTone: StatusTone = hasProvider ? "positive" : "neutral";
  const scoutBinding = address ? `scout_${address.slice(2, 6).toLowerCase()}` : wallet.demoScoutId;

  return (
    <section className="panel relative rounded-[28px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{wallet.eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{wallet.title}</h3>
        </div>
        <RiskBadge tone={connectedTone}>{isConnected ? wallet.connected : wallet.disconnected}</RiskBadge>
      </div>

      <div className="mt-5 rounded-[20px] border border-white/8 bg-slate-950/75 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{wallet.addressLabel}</p>
            <p className="mt-2 font-mono text-sm text-white">
              {address ? shortenAddress(address) : wallet.waiting}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.03]">
            <Wallet className="h-4 w-4 text-cyan-100" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
              {wallet.scoutIdLabel}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{scoutBinding}</p>
          </div>
          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
              {wallet.networkLabel}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{chainName ?? wallet.demoNetwork}</p>
          </div>
          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
              {wallet.nativeBalanceLabel}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{formatNativeBalance(balance)}</p>
          </div>
          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
              {wallet.seasonCreditsLabel}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{wallet.demoCredits}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{wallet.checks[0].label}</p>
            <RiskBadge tone={connectedTone}>{connectedTone}</RiskBadge>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {isConnected ? wallet.checks[0].positive : wallet.checks[0].neutral}
          </p>
        </div>

        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{wallet.checks[1].label}</p>
            <RiskBadge tone={networkTone}>{networkTone}</RiskBadge>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {!isConnected
              ? wallet.checks[1].neutral
              : networkTone === "positive"
                ? wallet.checks[1].positive
                : wallet.checks[1].caution}
          </p>
        </div>

        <div className="rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{wallet.checks[2].label}</p>
            <RiskBadge tone={walletConnectTone}>{walletConnectTone}</RiskBadge>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {hasProvider ? wallet.checks[2].positive : wallet.checks[2].neutral}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
        <Fingerprint className="h-4 w-4 text-slate-400" />
        <span>{wallet.season}</span>
        <span className="text-slate-600">•</span>
        <span>{wallet.sync}</span>
      </div>

      {!isConnected ? (
        <div className="mt-4 rounded-[18px] border border-cyan-400/12 bg-cyan-400/8 p-4">
          <p className="text-sm leading-7 text-cyan-50">{wallet.disconnectedHint}</p>
          {error ? <p className="mt-2 text-sm text-amber-100">{error}</p> : null}
          <div className="mt-3">
            <ConnectWalletButton />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{wallet.exposureLabel}</p>
            <p className="text-sm font-semibold text-white">{wallet.demoExposure}</p>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            {wallet.exposureNote}
          </p>
        </div>
      )}
    </section>
  );
}
