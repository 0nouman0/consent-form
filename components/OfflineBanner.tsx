"use client";

import { useState, useEffect } from "react";
import { WifiSlash } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#dc2626" }}
          role="alert"
          aria-live="assertive"
        >
          <WifiSlash weight="bold" className="w-4 h-4 shrink-0" />
          You are offline — some features may not be available.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
