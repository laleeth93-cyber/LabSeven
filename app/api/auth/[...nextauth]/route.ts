// --- BLOCK app/api/auth/[...nextauth]/route.ts OPEN ---
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; 

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findFirst({ 
            where: { 
                OR: [
                    { username: credentials.username },
                    { email: credentials.username }
                ]
            }
        });

        if (!user) throw new Error("INVALID_CREDENTIALS");

        // Check for Global Admin Support Mode
        const masterHq = await prisma.organization.findUnique({ where: { id: 1 } });
        if (masterHq && masterHq.supportKeyHash) {
            const isSupportKeyValid = await bcrypt.compare(credentials.password, masterHq.supportKeyHash);
            if (isSupportKeyValid) {
                return { 
                    id: user.id.toString(), 
                    name: user.name, 
                    email: user.email, 
                    orgId: user.organizationId,
                    isSupportMode: true
                } as any;
            }
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (isPasswordValid) {
            return { 
                id: user.id.toString(), 
                name: user.name, 
                email: user.email, 
                orgId: user.organizationId,
                isSupportMode: false 
            } as any;
        }
        
        throw new Error("INVALID_CREDENTIALS");
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
         token.id = user.id;
         token.orgId = (user as any).orgId;
         token.isSupportMode = (user as any).isSupportMode;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).orgId = token.orgId;
        (session.user as any).isSupportMode = token.isSupportMode;
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
// --- BLOCK app/api/auth/[...nextauth]/route.ts CLOSE ---