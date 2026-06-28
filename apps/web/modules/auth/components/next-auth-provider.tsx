"use client";

import { SessionProvider } from "next-auth/react";

interface NextAuthProviderProps {
  children: React.ReactNode;
  sessionMaxAge: number;
}

/**
 * Client-side NextAuth SessionProvider that automatically refetches the
 * session at a calculated interval — 1/3 of the session max age, floored
 * to at least 60 seconds and at most 300 seconds. This keeps the session
 * state reasonably fresh without polling too aggressively on long-lived
 * sessions or too slowly on short-lived ones.
 */
export const NextAuthProvider = ({ children, sessionMaxAge }: Readonly<NextAuthProviderProps>) => {
  const refetchInterval = Math.min(Math.max(Math.floor(sessionMaxAge / 3), 60), 300);

  return <SessionProvider refetchInterval={refetchInterval}>{children}</SessionProvider>;
};
