import type { NextAuthConfig } from 'next-auth';

// Base config that can be used in Edge runtime (middleware)
// This file MUST NOT import any code that depends on Node.js runtime (like mongoose)
export const authConfig = {
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // Trust the host header for deployed environments (Netlify, Vercel, etc)
  trustHost: true,
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [], // Providers will be added in the full auth config
} satisfies NextAuthConfig;



