"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  skipDelayDuration = 400,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      disableHoverableContent
      {...props}
    />
  );
}

function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

const tooltipVariants = cva(
  "z-50 overflow-hidden whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-medium leading-none tracking-[0.01em] will-change-[transform,opacity] [transform-origin:var(--radix-tooltip-content-transform-origin)] animate-in fade-in-0 zoom-in-95 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-[8px] data-[side=left]:slide-in-from-right-[8px] data-[side=right]:slide-in-from-left-[8px] data-[side=top]:slide-in-from-bottom-[8px] motion-reduce:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100 motion-reduce:data-[side=bottom]:slide-in-from-top-[0px] motion-reduce:data-[side=left]:slide-in-from-right-[0px] motion-reduce:data-[side=right]:slide-in-from-left-[0px] motion-reduce:data-[side=top]:slide-in-from-bottom-[0px]",
  {
    variants: {
      variant: {
        light:
          "border border-line bg-background text-foreground shadow-[0_2px_8px_rgba(21,20,15,0.08)]",
        dark: "bg-foreground text-background shadow-[0_2px_8px_rgba(21,20,15,0.14)]",
      },
    },
    defaultVariants: {
      variant: "light",
    },
  },
);

function TooltipContent({
  className,
  sideOffset = 8,
  variant,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> &
  VariantProps<typeof tooltipVariants>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(tooltipVariants({ variant }), className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  tooltipVariants,
};
