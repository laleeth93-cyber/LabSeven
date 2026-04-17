// --- BLOCK lib/auth.ts OPEN ---
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth-utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Lab Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const cleanEmail = credentials.username.trim().toLowerCase();

        // 🚨 THE FIX: We now strictly enforce login via Email address ONLY.
        const user = await prisma.user.findFirst({
          where: { 
              isActive: true,
              email: cleanEmail
          },
          include: { organization: true } 
        });

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        // ==========================================
        // ✨ SMART SUBSCRIPTION BLOCKER ✨
        // ==========================================
        if (user.organizationId !== 1) { // Master HQ (ID: 1) never expires
            
            // 1. Check if Super Admin manually disabled them
            if (!user.organization.isActive) {
                throw new Error("Account suspended. Please contact support.");
            }

            // 2. Check if the subscription date has passed
            if (user.organization.subscriptionEndsAt) {
                const now = new Date();
                const expDate = new Date(user.organization.subscriptionEndsAt);
                
                if (expDate < now) {
                    throw new Error("Subscription expired. Please renew to access your laboratory.");
                }
            }
        }

        // Check password
        const isValid = await comparePassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        // Return user data
        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          orgId: user.organizationId, 
        };
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
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
// --- BLOCK lib/auth.ts CLOSE ---