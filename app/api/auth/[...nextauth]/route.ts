import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ⚡ This now properly references your unified Thin Client config
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };