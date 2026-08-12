import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/app/entrar" },
  session: { strategy: "jwt" },
  // Necessário para `next start` local (produção): fora da Vercel, Auth.js
  // desconfia do header Host por padrão e derruba callbacks com UntrustedHost.
  trustHost: true,
  providers: [], // preenchidos em auth.ts (lado Node)
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = (user as any).id; token.role = (user as any).role; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
