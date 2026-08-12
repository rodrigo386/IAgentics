"use server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function salvarNome(nome: string) {
  const sessao = await auth(); if (!sessao?.user?.id) return { ok: false };
  // Mesmo piso de criarUsuario (lib/plataforma/usuarios.ts): Server Actions são
  // endpoints POST invocáveis direto (header Next-Action), sem passar pelo
  // minLength do HTML — o piso real é aqui, o minLength é só UX de primeira linha.
  if (nome.trim().length < 2) return { ok: false };
  await db.update(users).set({ nome: nome.trim() }).where(eq(users.id, sessao.user.id));
  return { ok: true };
}
export async function trocarSenha(nova: string) {
  const sessao = await auth(); if (!sessao?.user?.id || nova.length < 8) return { ok: false };
  await db.update(users).set({ senhaHash: await bcrypt.hash(nova, 10) }).where(eq(users.id, sessao.user.id));
  return { ok: true };
}
