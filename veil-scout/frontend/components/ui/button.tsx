import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden border border-transparent text-sm font-semibold tracking-[0.015em] whitespace-nowrap transition-[transform,border-color,background-color,box-shadow,color] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-white/34 before:opacity-75 after:pointer-events-none after:absolute after:inset-y-[2px] after:right-[2px] after:w-10 after:translate-x-full after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] after:opacity-0 after:transition-[transform,opacity] after:duration-200 hover:after:translate-x-0 hover:after:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-cyan-100/70 bg-[linear-gradient(180deg,rgba(125,240,255,0.98),rgba(43,196,255,0.96))] text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_6px_10px_rgba(43,196,255,0.18)] hover:border-white/80 hover:bg-[linear-gradient(180deg,rgba(185,250,255,0.98),rgba(67,211,255,0.98))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.48),0_8px_12px_rgba(43,196,255,0.2)]",
        outline:
          "border-slate-100/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-sky-200/36 hover:bg-white/[0.07] hover:text-white aria-expanded:bg-white/[0.065]",
        secondary:
          "border-slate-100/16 bg-[linear-gradient(180deg,rgba(42,67,96,0.98),rgba(28,50,76,0.98))] text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] hover:border-sky-200/26 hover:bg-[linear-gradient(180deg,rgba(50,78,110,0.98),rgba(32,57,86,0.98))]",
        ghost:
          "border-transparent bg-transparent text-sky-50 hover:bg-white/[0.07] hover:text-white",
        destructive:
          "border-red-300/38 bg-[linear-gradient(180deg,rgba(255,107,122,0.34),rgba(128,37,50,0.98))] text-red-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_10px_rgba(28,6,10,0.18)] hover:border-red-200/48 hover:bg-[linear-gradient(180deg,rgba(255,128,140,0.4),rgba(148,44,58,1))]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 rounded-[11px] px-4",
        xs: "h-7 rounded-[9px] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-[10px] px-3 text-[0.84rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 rounded-[12px] px-4.5",
        icon: "size-9 rounded-[10px]",
        "icon-xs": "size-7 rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[10px]",
        "icon-lg": "size-11 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-size={size}
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
