import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const API_KEY = process.env.INTERNAL_API_KEY || "labseven_secret_key_2025";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Lab Credentials",
      credentials: {
        username: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // ⚡ Forward the login request to the Node.js engine
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ 
                username: credentials.username, 
                password: credentials.password 
            })
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Invalid credentials.");
        }

        // Return the validated user payload
        return result.data;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.orgId = (user as any).orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).orgId = token.orgId;
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};