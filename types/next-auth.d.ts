import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    orgId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: number;
  }
}