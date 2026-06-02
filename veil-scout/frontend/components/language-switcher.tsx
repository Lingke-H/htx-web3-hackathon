"use client";

import { Languages } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { content, locale, localeOptions, setLocale } = useAppState();

  return (
    <div className="terminal-strip flex items-center gap-2 rounded-[16px] px-2 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/8 bg-white/[0.02] text-slate-200">
            <Languages className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{content.controls.language}</TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-1 rounded-[13px] border border-white/8 bg-background/70 p-1">
        {localeOptions.map((option) => (
          <Button
            key={option.value}
            className={cn(
              "h-8 rounded-[11px] px-3 text-[0.66rem]",
              locale === option.value
                ? "border-primary/26 bg-[linear-gradient(180deg,rgba(31,198,178,0.16),rgba(7,36,36,0.28))] text-cyan-50"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-white/[0.05] hover:text-white",
            )}
            onClick={() => setLocale(option.value)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {option.shortLabel}
          </Button>
        ))}
      </div>
    </div>
  );
}
