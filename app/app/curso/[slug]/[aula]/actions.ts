"use server";
import { auth } from "@/auth";
import { contaAtiva, gravarProgresso, podeGravarProgresso } from "@/lib/plataforma/dados";

// Fix round 1 (revisão Task 7, Important): as duas actions só checavam
// identidade (auth()), nunca se o usuário tem acesso ao lessonId — gravarProgresso
// fazia upsert incondicional. Um usuário sem assinatura conseguia chamar
// concluirAula com o id de uma aula paga e fabricar `concluida: true` de
// conteúdo que nunca assistiu (o vídeo não vazava — o portão de mídia segurava —
// mas o registro de progresso virava mentira). podeGravarProgresso espelha
// exatamente o portão de leitura (buscarMidia); falha de acesso retorna
// silenciosamente, sem erro para o usuário — quem chega aí está fabricando a chamada.
//
// Fix round final (I1): auth() só confirma que o JWT é válido, não que a
// conta segue ativa — um admin pode desativar o aluno com a sessão dele já
// aberta, e o cookie continua passando em auth() até expirar. contaAtiva
// consulta o banco a cada chamada (mesmo padrão de exigirAdmin/ehAdminAtivo)
// e corta a escrita imediatamente, sem esperar o JWT vencer.

export async function concluirAula(lessonId: string) {
  const sessao = await auth();
  if (!sessao?.user?.id) return;
  if (!(await contaAtiva(sessao.user.id))) return;
  if (!(await podeGravarProgresso(sessao.user.id, lessonId))) return;
  await gravarProgresso(sessao.user.id, lessonId, { concluida: true });
}

export async function baterProgresso(lessonId: string, segundos: number) {
  const sessao = await auth();
  if (!sessao?.user?.id) return;
  if (!(await contaAtiva(sessao.user.id))) return;
  if (!(await podeGravarProgresso(sessao.user.id, lessonId))) return;
  // Fix round final (M5): segundos vem do cliente sem validação — NaN (ex.:
  // currentTime antes de metadata carregar) produzia NaN→NaN no banco, e
  // Infinity/valores absurdos (ex.: 3e9) estouravam o int4 da coluna, ambos
  // derrubando o POST autenticado com 500. Clampa em [0, 86400] (24h, teto
  // generoso pra qualquer aula) e não-finito vira 0.
  const s = Number.isFinite(segundos) ? Math.min(86400, Math.max(0, Math.floor(segundos))) : 0;
  await gravarProgresso(sessao.user.id, lessonId, { segundosAssistidos: s });
}
