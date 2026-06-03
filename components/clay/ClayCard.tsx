"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ClayCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "raised" | "inset";
  padding?: "sm" | "md" | "lg" | "xl";
}

export default function ClayCard({
  children,
  className,
  variant = "default",
  padding = "md",
}: ClayCardProps) {
  const variantClasses = {
    default: "shadow-clay",
    raised: "shadow-clay-lg",
    inset: "shadow-clay-inset",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  return (
    <div
      className={cn(
        "bg-clay-card rounded-3xl",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
