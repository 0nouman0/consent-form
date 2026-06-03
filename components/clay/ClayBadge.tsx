"use client";

import { cn } from "@/lib/utils";

interface ClayBadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
}

export default function ClayBadge({
  children,
  variant = "secondary",
  className,
}: ClayBadgeProps) {
  const variantClasses = {
    primary:
      "bg-clay-primary/15 text-clay-primary border-clay-primary/20",
    secondary:
      "bg-clay-secondary/15 text-clay-secondary border-clay-secondary/20",
    success:
      "bg-clay-success/20 text-emerald-700 border-clay-success/30",
    warning:
      "bg-clay-warning/20 text-amber-700 border-clay-warning/30",
    danger:
      "bg-clay-error/15 text-red-700 border-clay-error/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
