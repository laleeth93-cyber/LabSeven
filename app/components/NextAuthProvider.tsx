// --- BLOCK app/components/NextAuthProvider.tsx OPEN ---
"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface NextAuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export const NextAuthProvider = ({ children, session }: NextAuthProviderProps) => {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
};
// --- BLOCK app/components/NextAuthProvider.tsx CLOSE ---