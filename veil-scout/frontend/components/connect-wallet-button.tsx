"use client";

import { ChevronDown, LoaderCircle, Wallet2 } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { useWalletState } from "@/lib/wallet-state";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ConnectWalletButton({
  className,
  variant = "header",
}: {
  className?: string;
  variant?: "header" | "hero";
}) {
  const { content } = useAppState();
  const { address, chainName, connect, hasProvider, isConnected, isConnecting, switchToDemoChain } =
    useWalletState();

  if (isConnecting) {
    return (
      <Button className={cn("gap-2", className)} disabled size="lg" variant="outline">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {content.controls.preparing}
      </Button>
    );
  }

  if (!hasProvider) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button className={cn("text-slate-200", className)} disabled size="lg" variant="outline">
              <Wallet2 className="h-4 w-4" />
              {content.controls.noWallet}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Open the demo in a browser with an injected wallet extension to connect live.
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!isConnected) {
    return (
      <Button
        className={cn(variant === "hero" ? "w-full justify-between" : "", className)}
        onClick={connect}
        size="lg"
        type="button"
      >
        <span className="flex items-center gap-2">
          <Wallet2 className="h-4 w-4" />
          {content.controls.connectWallet}
        </span>
        {variant === "hero" ? <span className="font-mono text-xs uppercase tracking-[0.14em] text-slate-950/70">live</span> : null}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button onClick={switchToDemoChain} size="lg" type="button" variant="outline">
        <span className="status-led h-2.5 w-2.5 bg-emerald-300" />
        <span className="font-mono">{chainName ?? "EVM"}</span>
        <ChevronDown className="h-4 w-4 text-slate-300" />
      </Button>

      <Button className="min-w-[148px] justify-between" onClick={connect} size="lg" type="button" variant="secondary">
        <span className="flex items-center gap-2">
          <Wallet2 className="h-4 w-4" />
          <span className={cn(address && "font-mono")}>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : content.controls.connectWallet}
          </span>
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/65">wallet</span>
      </Button>
    </div>
  );
}
