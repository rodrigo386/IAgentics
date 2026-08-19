"use server";
import { auth } from "@/auth";
import { contaAtiva, gravarProgresso, podeGravarProgresso } from "@/lib/plataforma/dados";
import { doAlunoPelaAula } from "@/lib/plataforma/certificados";

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

/**
 * Marca a aula como concluída e devolve o certificado SE esta conclusão
 * fechou a formação.
 *
 * O retorno existe para o player poder anunciar o fim no instante em que ele
 * acontece: antes, terminar a última aula mostrava um "Aula concluída" seco e
 * o aluno tinha que voltar sozinho à página do curso para descobrir que havia
 * certificado. A emissão em si não acontece aqui — ela mora no gancho de
 * gravarProgresso, que revalida o critério inteiro; aqui só perguntamos o
 * resultado.
 *
 * `certificado: null` cobre tudo que não é conclusão de curso: aula do meio,
 * chamada recusada pelos portões acima, ou emissão que falhou (a página do
 * curso tem a rede de recuperação).
 */
export async function concluirAula(lessonId: string): Promise<{ certificado: string | null }> {
  const sessao = await auth();
  if (!sessao?.user?.id) return { certificado: null };
  if (!(await contaAtiva(sessao.user.id))) return { certificado: null };
  if (!(await podeGravarProgresso(sessao.user.id, lessonId))) return { certificado: null };
  await gravarProgresso(sessao.user.id, lessonId, { concluida: true });

  const certificado = await doAlunoPelaAula(sessao.user.id, lessonId);
  return { certificado: certificado?.codigo ?? null };
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
