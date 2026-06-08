"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";

const messages = [
  "Verifying patient information and competency status...",
  "Building medico-legal clause structure...",
  "Applying Indian Medical compliance guidelines...",
  "Translating to requested language level...",
  "Finalising your consent form...",
];

export default function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const message = messages[index];

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      {/* Spinning loader */}
      <CircleNotch className="w-12 h-12 text-primary animate-spin" />


      {/* Animated message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-slate-600 text-sm font-medium"
        >
          {message}
        </motion.p>
      </AnimatePresence>

      {/* Shimmer skeleton rows */}
      <div className="space-y-3 w-full max-w-md mx-auto mt-8">
        <div className="w-full h-3 shimmer rounded" />
        <div className="w-4/5 h-3 shimmer rounded" />
        <div className="w-3/5 h-3 shimmer rounded" />
      </div>
    </div>
  );
}