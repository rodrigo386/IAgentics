"use server";
import { auth } from "@/auth";
import { gravarProgresso } from "@/lib/plataforma/dados";

export async function concluirAula(lessonId: string) {
  const sessao = await auth();
  if (!sessao?.user?.id) return;
  await gravarProgresso(sessao.user.id, lessonId, { concluida: true });
}

export async function baterProgresso(lessonId: string, segundos: number) {
  const sessao = await auth();
  if (!sessao?.user?.id) return;
  await gravarProgresso(sessao.user.id, lessonId, { segundosAssistidos: Math.max(0, Math.floor(segundos)) });
}
