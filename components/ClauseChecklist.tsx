"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle2, Circle } from "lucide-react";
import { REQUIRED_CLAUSES } from "@/lib/clauses";

interface ClauseChecklistProps {
  detectedClauses: string[];
  consentType: string;
}

export default function ClauseChecklist({
  detectedClauses,
  consentType,
}: ClauseChecklistProps) {
  // Filter clauses applicable to this consent type
  const applicableClauses = REQUIRED_CLAUSES.filter(
    (c) => c.requiredFor.includes("all") || c.requiredFor.includes(consentType)
  );

  // Count detected clauses that are applicable
  const detectedCount = applicableClauses.filter((c) =>
    detectedClauses.includes(c.id)
  ).length;

  const totalCount = applicableClauses.length;
  const progressPercent = totalCount > 0 ? (detectedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 clause-checklist">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Medico-Legal Clause Verification</h3>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-slate-600">
        <span className="font-medium">{detectedCount}</span> /{" "}
        <span className="font-medium">{totalCount}</span> required clauses detected
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="bg-teal-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Clause list */}
      <div className="space-y-2">
        {applicableClauses.map((c) => {
          const isDetected = detectedClauses.includes(c.id);

          return (
            <div
              key={c.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                isDetected
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-slate-100"
              }`}
            >
              <motion.div
                initial={false}
                animate={isDetected ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {isDetected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </motion.div>
              <div>
                <span className={`font-medium ${isDetected ? "text-green-700" : "text-slate-400"}`}>
                  {c.title}
                </span>
                <span className="text-xs text-slate-500 ml-2">{c.partLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
        ⚠ Missing clause or timestamp = medico-legal loophole — Narayan Reddy
      </div>
    </div>
  );
}