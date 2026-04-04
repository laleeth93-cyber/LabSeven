// --- BLOCK app/components/KeepAlive.tsx OPEN ---
"use client";

import { useEffect } from "react";

export default function KeepAlive() {
  useEffect(() => {
    // 1. Instantly ping the server once when the app is first opened
    fetch('/api/keep-alive').catch(() => {});

    // 2. Set up a recurring heartbeat every 5 minutes (300,000 milliseconds)
    const interval = setInterval(() => {
      fetch('/api/keep-alive').catch(() => {});
    }, 5 * 60 * 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  // This component is completely invisible!
  return null;
}
// --- BLOCK app/components/KeepAlive.tsx CLOSE ---