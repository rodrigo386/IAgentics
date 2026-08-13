"use client";
import { useActionState } from "react";
import { excluirAulaAction, salvarAulaAction, salvarMidiaAction } from "@/app/admin/conteudo/[slug]/actions";
import { admin } from "@/lib/content-admin";
import type { Impacto } from "@/lib/admin/conteudo";

type Estado = { erro: string | null; sucesso: string | null };
const ESTADO_INICIAL: Estado = { erro: null, sucesso: null };
const t = admin.conteudo;

const campoClasse =
  "w-full border border-line bg-surface px-3 py-2 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";
const botaoClasse =
  "rounded-control border border-line-strong px-4 py-2 text-xs font-medium transition-colors hover:border-fg disabled:opacity-60";
const botaoDestaqueClasse =
  "rounded-control bg-accent px-4 py-2 text-xs font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60";

const PROVIDERS = ["youtube", "panda", "mux"] as const;

/** Painel de UMA aula existente: campos + salvar, bloco de mídia (provider +
 *  videoId) e exclusão com confirmação. Vive dentro de um <details> por aula
 *  no painel de módulos — cada instância tem seu próprio useActionState, então
 *  editar a aula 2 nunca pisa no formulário (ou no erro) da aula 1. */
export function EditorAula({
  aula,
  cursoSlug,
  impacto,
}: {
  aula: {
    id: string;
    slug: string;
    titulo: string;
    descricao: string;
    duracaoSeg: number;
    gratuita: boolean;
    midia: { provider: string; videoId: string } | null;
  };
  cursoSlug: string;
  impacto: Impacto;
}) {
  const [estadoSalvar, dispatchSalvar, pendenteSalvar] = useActionState(
    salvarAulaAction.bind(null, aula.id, cursoSlug, aula.slug),
    ESTADO_INICIAL,
  );
  const [estadoMidia, dispatchMidia, pendenteMidia] = useActionState(
    salvarMidiaAction.bind(null, aula.id, cursoSlug, aula.slug),
    ESTADO_INICIAL,
  );
  const [estadoExcluir, dispatchExcluir, pendenteExcluir] = useActionState(
    excluirAulaAction.bind(null, aula.id, cursoSlug, aula.slug),
    ESTADO_INICIAL,
  );

  const ta = t.aulas;
  const tm = ta.midia;

  return (
    <div className="flex flex-col gap-6 border border-line bg-surface p-5">
      <form action={dispatchSalvar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium">
          {ta.campos.titulo}
          <input type="text" name="titulo" defaultValue={aula.titulo} required className={campoClasse} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {ta.campos.slug}
          <input type="text" name="slug" defaultValue={aula.slug} required className={campoClasse} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {ta.campos.descricao}
          <textarea name="descricao" defaultValue={aula.descricao} rows={2} className={campoClasse} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium">
            {ta.campos.duracaoSeg}
            <input type="number" name="duracaoSeg" min={0} defaultValue={aula.duracaoSeg} className={campoClasse} />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium">
            <input type="checkbox" name="gratuita" defaultChecked={aula.gratuita} className="h-4 w-4" />
            {ta.campos.gratuita}
          </label>
        </div>
        {estadoSalvar.erro ? (
          <p role="alert" className="text-xs text-fg">
            {estadoSalvar.erro}
          </p>
        ) : null}
        {estadoSalvar.sucesso ? (
          <p role="status" className="text-xs text-accent-text">
            {estadoSalvar.sucesso}
          </p>
        ) : null}
        <button type="submit" disabled={pendenteSalvar} className={`w-fit ${botaoDestaqueClasse}`}>
          {t.botaoSalvar}
        </button>
      </form>

      <form action={dispatchMidia} className="flex flex-col gap-3 border-t border-line pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">{tm.titulo}</p>
        {!aula.midia ? <p className="text-xs text-fg-subtle">{tm.vazio}</p> : null}
        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <label className="flex flex-col gap-1 text-xs font-medium">
            {tm.provider}
            <select name="provider" defaultValue={aula.midia?.provider ?? "youtube"} className={campoClasse}>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            {tm.videoId}
            <input type="text" name="videoId" defaultValue={aula.midia?.videoId ?? ""} className={campoClasse} />
          </label>
        </div>
        {estadoMidia.sucesso ? (
          <p role="status" className="text-xs text-accent-text">
            {estadoMidia.sucesso}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button type="submit" disabled={pendenteMidia} className={`w-fit ${botaoClasse}`}>
            {tm.botaoSalvar}
          </button>
        </div>
      </form>

      <details className="border-t border-line pt-5">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
          {t.confirmarExclusao.excluirAula}
        </summary>
        <form action={dispatchExcluir} className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-fg-muted">{t.confirmarExclusao.texto(impacto.aulas, impacto.alunosComProgresso)}</p>
          <label className="flex flex-col gap-1 text-xs font-medium">
            {t.confirmarExclusao.campoLabel}
            <input type="text" name="confirmacao" required className={`max-w-xs ${campoClasse}`} />
          </label>
          {estadoExcluir.erro ? (
            <p role="alert" className="text-xs text-fg">
              {estadoExcluir.erro}
            </p>
          ) : null}
          <button type="submit" disabled={pendenteExcluir} className={`w-fit ${botaoClasse}`}>
            {t.confirmarExclusao.excluirAula}
          </button>
        </form>
      </details>
    </div>
  );
}
