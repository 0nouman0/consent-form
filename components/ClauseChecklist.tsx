"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";
import { REQUIRED_CLAUSES } from "@/lib/clauses";

interface ClauseChecklistProps {
  detectedClauses: string[];
  consentType: string;
}

export default function ClauseChecklist({ detectedClauses, consentType }: ClauseChecklistProps) {
  const applicableClauses = REQUIRED_CLAUSES.filter(
    (c) => c.requiredFor.includes("all") || c.requiredFor.includes(consentType)
  );

  const detectedCount = applicableClauses.filter((c) => detectedClauses.includes(c.id)).length;
  const totalCount = applicableClauses.length;
  const progressPercent = totalCount > 0 ? (detectedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-background border border-border rounded-2xl p-5 space-y-4 clause-checklist shadow-card">
      {/* Title */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" weight="bold" />
        <h3 className="font-sans font-bold text-base text-foreground">Medico-Legal Clause Verification</h3>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground font-body">
        <span className="font-semibold text-foreground">{detectedCount}</span> /{" "}
        <span className="font-semibold text-foreground">{totalCount}</span> required clauses detected
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--primary) / 0.1)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: "hsl(var(--primary))" }}
        />
      </div>

      {/* Clause list */}
      <div className="space-y-2">
        {applicableClauses.map((c) => {
          const isDetected = detectedClauses.includes(c.id);
          return (
            <div key={c.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                isDetected ? "bg-green-50/50 border-green-200" : "bg-muted border-border"
              }`}>
              <motion.div initial={false}
                animate={isDetected ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                {isDetected
                  ? <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                  : <Circle className="w-5 h-5 text-border" weight="bold" />}
              </motion.div>
              <div>
                <span className={`text-sm font-semibold block font-body ${isDetected ? "text-green-800" : "text-muted-foreground"}`}>
                  {c.title}
                </span>
                <span className="text-xs text-muted-foreground font-body">{c.partLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-semibold text-amber-700 font-body">
        ⚠ Missing clause or timestamp = medico-legal loophole
      </div>
    </div>
  );
}