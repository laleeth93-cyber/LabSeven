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
        username: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
        labId: { label: "Workspace ID", type: "text" } // 🚨 NEW: Accepts Lab ID
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        let whereClause: any = { isActive: true };

        // 🚨 If a Lab ID is provided (Staff User), strictly require it
        if (credentials.labId) {
            const parsedLabId = parseInt(credentials.labId);
            if (isNaN(parsedLabId)) {
                throw new Error("Invalid Workspace ID.");
            }
            whereClause.username = credentials.username;
            whereClause.organizationId = parsedLabId;
        } else {
            // Otherwise (Admin Login), fall back to email or username lookup globally
            whereClause.OR = [
              { email: credentials.username },
              { username: credentials.username }
            ];
        }

        // Find user 
        const user = await prisma.user.findFirst({
          where: whereClause
        });

        if (!user) {
          throw new Error("User not found or inactive.");
        }

        // Check password
        const isValid = await comparePassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password.");
        }

        // Return user data including their specific organizationId
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