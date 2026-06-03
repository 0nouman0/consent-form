"use client";

import { cn } from "@/lib/utils";

interface ClayToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function ClayToggle({
  checked,
  onChange,
  label,
  disabled,
}: ClayToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={cn(
            "w-12 h-7 rounded-full transition-colors duration-300",
            checked ? "bg-clay-primary" : "bg-clay-border",
            checked
              ? "shadow-[inset_2px_2px_5px_rgba(80,140,130,0.4),inset_-2px_-2px_5px_rgba(150,220,210,0.3)]"
              : "shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]"
          )}
        />
        <div
          className={cn(
            "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-300",
            "shadow-[2px_2px_4px_rgba(163,177,198,0.3),-1px_-1px_3px_rgba(255,255,255,0.8)]",
            checked && "translate-x-5"
          )}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-clay-text">{label}</span>
      )}
    </label>
  );
}
