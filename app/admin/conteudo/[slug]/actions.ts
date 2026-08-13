"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin/sessao";
import {
  criarAula,
  criarModulo,
  definirPublicado,
  excluirAula,
  excluirCurso,
  excluirModulo,
  moverAula,
  moverModulo,
  salvarAula,
  salvarCurso,
  salvarMidia,
  salvarModulo,
} from "@/lib/admin/conteudo";
import { admin } from "@/lib/content-admin";
import { extrairYoutubeId } from "@/lib/plataforma/youtube";
import type { ResultadoAcao } from "@/lib/admin/alunos";

type Estado = { erro: string | null; sucesso: string | null };

const t = admin.conteudo;

/** Revalida as rotas do admin sempre, e as do aluno (/app e /app/curso/[slug])
 *  sempre que a mudança PODE afetar o que ele vê — o custo de revalidar uma
 *  rota que nem existe (curso ainda oculto) é zero, então é mais simples
 *  revalidar sempre do que decidir caso a caso. aulaSlug é opcional: só as
 *  actions que mexem numa aula específica sabem o slug dela. */
function revalidarConteudo(cursoSlug: string, aulaSlug?: string) {
  revalidatePath("/admin/conteudo");
  revalidatePath(`/admin/conteudo/${cursoSlug}`);
  revalidatePath("/app");
  revalidatePath(`/app/curso/${cursoSlug}`);
  if (aulaSlug) revalidatePath(`/app/curso/${cursoSlug}/${aulaSlug}`);
}

function mensagemErroResultado(motivo: Exclude<ResultadoAcao, { ok: true }>["motivo"]): string {
  switch (motivo) {
    case "curso_publicado":
      return t.erros.cursoPublicado;
    default:
      return t.erros.generico;
  }
}

function confirmacaoConfere(formData: FormData): boolean {
  return String(formData.get("confirmacao") ?? "") === t.confirmarExclusao.palavra;
}

// ---------- Curso ----------

export async function salvarCursoAction(id: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const slugAntigo = String(formData.get("slugAtual") ?? "");
  const campos = {
    titulo: String(formData.get("titulo") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? ""),
    capaUrl: String(formData.get("capaUrl") ?? ""),
    nivel: String(formData.get("nivel") ?? ""),
    cargaHoras: Number(formData.get("cargaHoras") ?? 0),
    ordem: Number(formData.get("ordem") ?? 0),
  };
  // Fix round final (I3): capaUrl externa (https://...) quebra o /app do
  // aluno — hoje a página monta a imagem como caminho local, então uma URL
  // absoluta produz um <img> com src errado (sem base própria). Recusa aqui,
  // antes de tocar o banco: upload/URLs externas ficam para um ciclo futuro
  // com storage e validação de host, não algo pra improvisar agora.
  if (campos.capaUrl !== "" && !campos.capaUrl.startsWith("/")) {
    return { erro: t.erros.capaLocal, sucesso: null };
  }
  const resultado = await salvarCurso(id, campos);
  if (!resultado.ok) return { erro: t.erros.slugExiste, sucesso: null };

  revalidarConteudo(slugAntigo);
  if (campos.slug !== slugAntigo) revalidarConteudo(campos.slug);
  return { erro: null, sucesso: t.mensagens.salvo };
}

export async function definirPublicadoAction(
  id: string,
  slug: string,
  publicado: boolean,
  _estado: Estado,
  _formData: FormData,
): Promise<Estado> {
  await exigirAdmin();
  const resultado = await definirPublicado(id, publicado);
  revalidarConteudo(slug);

  let sucesso: string = publicado ? t.mensagens.publicado : t.mensagens.ocultado;
  if (resultado.aviso === "aulas_sem_video") sucesso = t.avisos.aulasSemVideo(resultado.n);
  if (resultado.aviso === "alunos_ativos") sucesso = t.avisos.alunosAtivos;
  return { erro: null, sucesso };
}

export async function excluirCursoAction(id: string, slug: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  if (!confirmacaoConfere(formData)) return { erro: t.confirmarExclusao.naoConfere, sucesso: null };

  const resultado = await excluirCurso(id);
  if (!resultado.ok) return { erro: mensagemErroResultado(resultado.motivo), sucesso: null };

  revalidatePath("/admin/conteudo");
  revalidatePath("/app");
  revalidatePath(`/app/curso/${slug}`);
  redirect("/admin/conteudo?excluido=1");
}

// ---------- Módulo ----------

export async function criarModuloAction(courseId: string, slug: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { erro: t.erros.generico, sucesso: null };
  await criarModulo(courseId, titulo);
  revalidarConteudo(slug);
  return { erro: null, sucesso: t.mensagens.moduloCriado };
}

export async function salvarModuloAction(id: string, slug: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { erro: t.erros.generico, sucesso: null };
  await salvarModulo(id, titulo);
  revalidarConteudo(slug);
  return { erro: null, sucesso: t.mensagens.salvo };
}

export async function moverModuloAction(
  id: string,
  slug: string,
  direcao: -1 | 1,
  _estado: Estado,
  _formData: FormData,
): Promise<Estado> {
  await exigirAdmin();
  await moverModulo(id, direcao);
  revalidarConteudo(slug);
  return { erro: null, sucesso: null };
}

export async function excluirModuloAction(id: string, slug: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  if (!confirmacaoConfere(formData)) return { erro: t.confirmarExclusao.naoConfere, sucesso: null };
  await excluirModulo(id);
  revalidarConteudo(slug);
  return { erro: null, sucesso: t.mensagens.excluido };
}

// ---------- Aula ----------

export async function criarAulaAction(moduleId: string, slug: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { erro: t.erros.generico, sucesso: null };
  const resultado = await criarAula(moduleId, titulo);
  if (!resultado.ok) return { erro: t.erros.slugExiste, sucesso: null };
  revalidarConteudo(slug, resultado.slug);
  return { erro: null, sucesso: t.mensagens.aulaCriada };
}

export async function salvarAulaAction(id: string, slug: string, aulaSlugAntigo: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const campos = {
    titulo: String(formData.get("titulo") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? ""),
    duracaoSeg: Number(formData.get("duracaoSeg") ?? 0),
    gratuita: formData.get("gratuita") === "on",
  };
  const resultado = await salvarAula(id, campos);
  if (!resultado.ok) return { erro: t.erros.slugExiste, sucesso: null };

  revalidarConteudo(slug, aulaSlugAntigo);
  if (campos.slug !== aulaSlugAntigo) revalidarConteudo(slug, campos.slug);
  return { erro: null, sucesso: t.mensagens.salvo };
}

export async function moverAulaAction(id: string, slug: string, direcao: -1 | 1, _estado: Estado, _formData: FormData): Promise<Estado> {
  await exigirAdmin();
  await moverAula(id, direcao);
  revalidarConteudo(slug);
  return { erro: null, sucesso: null };
}

export async function excluirAulaAction(id: string, slug: string, aulaSlug: string, _estado: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  if (!confirmacaoConfere(formData)) return { erro: t.confirmarExclusao.naoConfere, sucesso: null };
  await excluirAula(id);
  revalidarConteudo(slug, aulaSlug);
  return { erro: null, sucesso: t.mensagens.excluido };
}

export async function salvarMidiaAction(
  lessonId: string,
  slug: string,
  aulaSlug: string,
  _estado: Estado,
  formData: FormData,
): Promise<Estado> {
  await exigirAdmin();
  const provider = String(formData.get("provider") ?? "youtube") as "youtube" | "panda" | "mux";
  const bruto = String(formData.get("videoId") ?? "");
  // URL colada no lugar do ID vira player preto mudo — normaliza aqui e
  // recusa o que não der para reconhecer (bug da aula "teste").
  let videoId = bruto;
  if (provider === "youtube" && bruto.trim()) {
    const id = extrairYoutubeId(bruto);
    if (!id) return { erro: t.mensagens.midiaIdInvalido, sucesso: null };
    videoId = id;
  }
  await salvarMidia(lessonId, provider, videoId);
  revalidarConteudo(slug, aulaSlug);
  return { erro: null, sucesso: videoId.trim() ? t.mensagens.midiaSalva : t.mensagens.midiaRemovida };
}
