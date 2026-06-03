"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ClayInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}

const ClayInput = React.forwardRef<HTMLInputElement, ClayInputProps>(
  ({ className, label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-clay-text mb-1.5">
            {label}
            {props.required && <span className="text-clay-accent ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-clay-text-muted pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-clay-base rounded-xl px-4 py-3 text-sm text-clay-text outline-none transition-all duration-200",
              "placeholder:text-clay-text-muted/60",
              "shadow-clay-inset",
              "border border-transparent",
              "focus:border-clay-primary/40 focus:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.25),inset_-3px_-3px_6px_rgba(255,255,255,1),0_0_0_3px_rgba(109,179,166,0.1)]",
              Icon && "pl-10",
              error && "border-clay-accent/50 focus:border-clay-accent"
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-clay-accent mt-1.5">{error}</p>}
      </div>
    );
  }
);
ClayInput.displayName = "ClayInput";

export default ClayInput;
