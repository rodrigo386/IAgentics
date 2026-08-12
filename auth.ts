import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verificarCredenciais } from "@/lib/plataforma/usuarios";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      async authorize(cred) {
        const u = await verificarCredenciais(String(cred?.email ?? ""), String(cred?.senha ?? ""));
        return u ? { id: u.id, name: u.nome, email: u.email, role: u.role } as any : null;
      },
    }),
  ],
});
