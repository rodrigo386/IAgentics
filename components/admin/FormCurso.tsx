"use client";
import { useActionState } from "react";
import { criarCursoAction } from "@/app/admin/conteudo/actions";
import {
  definirPublicadoAction,
  excluirCursoAction,
  salvarCursoAction,
} from "@/app/admin/conteudo/[slug]/actions";
import { admin } from "@/lib/content-admin";
import type { Impacto } from "@/lib/admin/conteudo";

type Estado = { erro: string | null; sucesso: string | null };
const ESTADO_INICIAL: Estado = { erro: null, sucesso: null };
const t = admin.conteudo;

const campoClasse =
  "w-full border border-line bg-surface px-4 py-2.5 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";
const botaoClasse =
  "rounded-control border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg disabled:opacity-60";
const botaoDestaqueClasse =
  "rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60";

/** Formulário de criação usado em /admin/conteudo — só título; slug, ordem e
 *  publicado=false nascem em criarCurso(). Sucesso redireciona para o curso
 *  novo (a action faz redirect()), então o único estado visível aqui é erro. */
export function NovoCursoForm() {
  const [estado, dispatch, pendente] = useActionState(criarCursoAction, { erro: null });
  return (
    <form action={dispatch} className="flex flex-col gap-3 border border-line p-6 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
        {t.novoCurso.campoTitulo}
        <input type="text" name="titulo" required className={campoClasse} />
      </label>
      <button type="submit" disabled={pendente} className={`shrink-0 ${botaoDestaqueClasse}`}>
        {t.novoCurso.botao}
      </button>
      {estado.erro ? (
        <p role="alert" className="text-sm text-fg sm:basis-full">
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}

function FormExcluirCurso({ id, slug, impacto }: { id: string; slug: string; impacto: Impacto }) {
  const tx = t.confirmarExclusao;
  const [estado, dispatch, pendente] = useActionState(excluirCursoAction.bind(null, id, slug), ESTADO_INICIAL);
  return (
    <details className="border-t border-line pt-6">
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
        {tx.excluirCurso}
      </summary>
      <form action={dispatch} className="mt-4 flex flex-col gap-3">
        <p className="text-sm text-fg-muted">{tx.texto(impacto.aulas, impacto.alunosComProgresso)}</p>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {tx.campoLabel}
          <input type="text" name="confirmacao" required className={`max-w-sm ${campoClasse}`} />
        </label>
        {estado.erro ? (
          <p role="alert" className="text-sm text-fg">
            {estado.erro}
          </p>
        ) : null}
        <button type="submit" disabled={pendente} className={`w-fit ${botaoClasse}`}>
          {tx.excluirCurso}
        </button>
      </form>
    </details>
  );
}

/** Painel completo do curso em /admin/conteudo/[slug]: campos + salvar,
 *  publicar/ocultar (mostra o aviso retornado pela action) e exclusão com
 *  confirmação por texto (contarImpacto já veio pronto do servidor). */
export function FormCurso({
  curso,
  impacto,
}: {
  curso: {
    id: string;
    slug: string;
    titulo: string;
    descricao: string;
    capaUrl: string;
    nivel: string;
    cargaHoras: number;
    ordem: number;
    publicado: boolean;
  };
  impacto: Impacto;
}) {
  const [estadoSalvar, dispatchSalvar, pendenteSalvar] = useActionState(salvarCursoAction.bind(null, curso.id), ESTADO_INICIAL);
  const [estadoPublicar, dispatchPublicar, pendentePublicar] = useActionState(
    definirPublicadoAction.bind(null, curso.id, curso.slug, !curso.publicado),
    ESTADO_INICIAL,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-6 border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span
            className={
              curso.publicado
                ? "w-fit rounded-control bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-text"
                : "w-fit rounded-control border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted"
            }
          >
            {curso.publicado ? t.seloPublicado : t.seloOculto}
          </span>
          <form action={dispatchPublicar}>
            <button type="submit" disabled={pendentePublicar} className={botaoClasse}>
              {curso.publicado ? t.botaoOcultar : t.botaoPublicar}
            </button>
          </form>
        </div>
        {estadoPublicar.sucesso ? (
          <p role="status" className="text-sm text-fg">
            {estadoPublicar.sucesso}
          </p>
        ) : null}

        <form action={dispatchSalvar} className="flex flex-col gap-4">
          <input type="hidden" name="slugAtual" value={curso.slug} />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t.campos.titulo}
            <input type="text" name="titulo" defaultValue={curso.titulo} required className={campoClasse} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t.campos.slug}
            <input type="text" name="slug" defaultValue={curso.slug} required className={campoClasse} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t.campos.descricao}
            <textarea name="descricao" defaultValue={curso.descricao} rows={3} className={campoClasse} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t.campos.capaUrl}
            <input type="text" name="capaUrl" defaultValue={curso.capaUrl} className={campoClasse} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t.campos.nivel}
              <select name="nivel" defaultValue={curso.nivel} className={campoClasse}>
                {t.niveis.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t.campos.cargaHoras}
              <input type="number" name="cargaHoras" min={0} defaultValue={curso.cargaHoras} className={campoClasse} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t.campos.ordem}
              <input type="number" name="ordem" defaultValue={curso.ordem} className={campoClasse} />
            </label>
          </div>
          {estadoSalvar.erro ? (
            <p role="alert" className="text-sm text-fg">
              {estadoSalvar.erro}
            </p>
          ) : null}
          {estadoSalvar.sucesso ? (
            <p role="status" className="text-sm text-accent-text">
              {estadoSalvar.sucesso}
            </p>
          ) : null}
          <button type="submit" disabled={pendenteSalvar} className={`w-fit ${botaoDestaqueClasse}`}>
            {t.botaoSalvar}
          </button>
        </form>

        <FormExcluirCurso id={curso.id} slug={curso.slug} impacto={impacto} />
      </section>
    </div>
  );
}
