import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Lab Credentials",
      credentials: {
        username: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Find user by either Username or Email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.username },
              { username: credentials.username }
            ],
            isActive: true
          }
        });

        if (!user) {
          throw new Error("User not found or inactive.");
        }

        // Check password using bcryptjs directly
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password.");
        }

        // Return user data (Safely passing the orgId, even if it's null)
        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          orgId: user.organizationId || null, 
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };