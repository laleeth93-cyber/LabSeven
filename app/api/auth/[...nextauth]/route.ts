import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Imports config from your lib folder

const handler = NextAuth(authOptions);

// ✅ ONLY exports the HTTP handlers, completely fixing the Vercel build error
export { handler as GET, handler as POST };