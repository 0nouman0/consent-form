"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ClayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const ClayButton = React.forwardRef<HTMLButtonElement, ClayButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "relative inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-200 select-none";

    const sizeClasses = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3 text-base",
    };

    const variantClasses = {
      primary:
        "bg-clay-primary text-white shadow-[6px_6px_12px_rgba(109,179,166,0.35),-6px_-6px_12px_rgba(255,255,255,0.4)] hover:shadow-[8px_8px_18px_rgba(109,179,166,0.4),-8px_-8px_18px_rgba(255,255,255,0.5)] hover:bg-clay-primary-light active:shadow-clay-pressed active:translate-y-0 hover:-translate-y-0.5",
      secondary:
        "bg-clay-card text-clay-text shadow-clay hover:shadow-clay-lg active:shadow-clay-pressed hover:-translate-y-0.5 active:translate-y-0",
      danger:
        "bg-clay-accent text-white shadow-[6px_6px_12px_rgba(212,165,165,0.35),-6px_-6px_12px_rgba(255,255,255,0.4)] hover:shadow-[8px_8px_18px_rgba(212,165,165,0.4),-8px_-8px_18px_rgba(255,255,255,0.5)] active:shadow-clay-pressed hover:-translate-y-0.5 active:translate-y-0",
      ghost:
        "bg-transparent text-clay-text hover:bg-white/50 active:bg-white/30",
    };

    return (
      <button
        ref={ref}
        className={cn(
          base,
          sizeClasses[size],
          variantClasses[variant],
          (disabled || isLoading) &&
            "opacity-60 cursor-not-allowed hover:translate-y-0 active:translate-y-0",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-inherit">
            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          </span>
        )}
        <span className={isLoading ? "opacity-0" : undefined}>{children}</span>
      </button>
    );
  }
);
ClayButton.displayName = "ClayButton";

export default ClayButton;
