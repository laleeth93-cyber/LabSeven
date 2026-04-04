// --- BLOCK app/components/NextAuthProvider.tsx OPEN ---
"use client";

import { SessionProvider } from "next-auth/react";

export const NextAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
// --- BLOCK app/components/NextAuthProvider.tsx CLOSE ---