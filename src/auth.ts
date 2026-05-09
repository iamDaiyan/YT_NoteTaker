import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        if (!email) return null;

        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
        session.user.name = typeof token.name === "string" ? token.name : token.email;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name ?? user.email;
      }
      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
});
