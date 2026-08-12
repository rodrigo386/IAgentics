"use client";
import { useActionState } from "react";
import {
  criarAulaAction,
  criarModuloAction,
  excluirModuloAction,
  moverAulaAction,
  moverModuloAction,
  salvarModuloAction,
} from "@/app/admin/conteudo/[slug]/actions";
import { EditorAula } from "@/components/admin/EditorAula";
import { admin } from "@/lib/content-admin";
import type { Impacto } from "@/lib/admin/conteudo";

type Estado = { erro: string | null; sucesso: string | null };
const ESTADO_INICIAL: Estado = { erro: null, sucesso: null };
const t = admin.conteudo;

const campoClasse =
  "w-full border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";
const botaoClasse =
  "rounded-control border border-line-strong px-4 py-2 text-xs font-medium transition-colors hover:border-fg disabled:opacity-60";
const botaoDestaqueClasse =
  "rounded-control bg-accent px-4 py-2 text-xs font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60";

type AulaComImpacto = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  duracaoSeg: number;
  ordem: number;
  gratuita: boolean;
  midia: { provider: string; videoId: string } | null;
  impacto: Impacto;
};

type ModuloComImpacto = {
  id: string;
  titulo: string;
  ordem: number;
  impacto: Impacto;
  aulas: AulaComImpacto[];
};

function BotaoMover({
  acao,
  rotulo,
  desabilitado,
}: {
  acao: (estado: Estado, formData: FormData) => Promise<Estado>;
  rotulo: string;
  desabilitado: boolean;
}) {
  const [, dispatch, pendente] = useActionState(acao, ESTADO_INICIAL);
  return (
    <form action={dispatch}>
      <button
        type="submit"
        disabled={desabilitado || pendente}
        aria-label={rotulo}
        className="rounded-control border border-line-strong px-2.5 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-fg hover:text-fg disabled:pointer-events-none disabled:opacity-30"
      >
        {rotulo === t.modulos.subir ? "↑" : "↓"}
      </button>
    </form>
  );
}

function NovaAulaForm({ moduleId, cursoSlug }: { moduleId: string; cursoSlug: string }) {
  const [estado, dispatch, pendente] = useActionState(criarAulaAction.bind(null, moduleId, cursoSlug), ESTADO_INICIAL);
  return (
    <form action={dispatch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium">
        {t.aulas.campoTitulo}
        <input type="text" name="titulo" required className={campoClasse} />
      </label>
      <button type="submit" disabled={pendente} className={`shrink-0 ${botaoClasse}`}>
        {t.aulas.botaoNovaAula}
      </button>
      {estado.erro ? (
        <p role="alert" className="text-xs text-fg sm:basis-full">
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}

function FormTituloModulo({ id, cursoSlug, tituloAtual }: { id: string; cursoSlug: string; tituloAtual: string }) {
  const [estado, dispatch, pendente] = useActionState(salvarModuloAction.bind(null, id, cursoSlug), ESTADO_INICIAL);
  return (
    <form action={dispatch} className="flex flex-1 flex-wrap items-center gap-2">
      <input
        type="text"
        name="titulo"
        defaultValue={tituloAtual}
        required
        aria-label={t.modulos.campoRenomear}
        className={`max-w-sm flex-1 ${campoClasse}`}
      />
      <button type="submit" disabled={pendente} className={botaoClasse}>
        {t.modulos.botaoSalvarTitulo}
      </button>
      {estado.erro ? (
        <p role="alert" className="w-full text-xs text-fg">
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}

function FormExcluirModulo({ id, cursoSlug, impacto }: { id: string; cursoSlug: string; impacto: Impacto }) {
  const [estado, dispatch, pendente] = useActionState(excluirModuloAction.bind(null, id, cursoSlug), ESTADO_INICIAL);
  return (
    <details>
      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
        {t.confirmarExclusao.excluirModulo}
      </summary>
      <form action={dispatch} className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-fg-muted">{t.confirmarExclusao.texto(impacto.aulas, impacto.alunosComProgresso)}</p>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t.confirmarExclusao.campoLabel}
          <input type="text" name="confirmacao" required className={`max-w-xs ${campoClasse}`} />
        </label>
        {estado.erro ? (
          <p role="alert" className="text-xs text-fg">
            {estado.erro}
          </p>
        ) : null}
        <button type="submit" disabled={pendente} className={`w-fit ${botaoClasse}`}>
          {t.confirmarExclusao.excluirModulo}
        </button>
      </form>
    </details>
  );
}

function NovoModuloForm({ courseId, cursoSlug }: { courseId: string; cursoSlug: string }) {
  const [estado, dispatch, pendente] = useActionState(criarModuloAction.bind(null, courseId, cursoSlug), ESTADO_INICIAL);
  return (
    <form action={dispatch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
        {t.modulos.campoTitulo}
        <input type="text" name="titulo" required className={campoClasse} />
      </label>
      <button type="submit" disabled={pendente} className={`shrink-0 ${botaoDestaqueClasse}`}>
        {t.modulos.botaoNovoModulo}
      </button>
      {estado.erro ? (
        <p role="alert" className="text-sm text-fg sm:basis-full">
          {estado.erro}
        </p>
      ) : null}
    </form>
  );
}

/** Painel de módulos e aulas de /admin/conteudo/[slug]. Cada módulo é uma
 *  seção com: título editável, subir/descer, nova aula, lista de aulas em
 *  <details> (cada uma com EditorAula) e exclusão com confirmação. */
export function PainelModulos({
  courseId,
  cursoSlug,
  modulos,
}: {
  courseId: string;
  cursoSlug: string;
  modulos: ModuloComImpacto[];
}) {
  const ordenados = [...modulos].sort((a, b) => a.ordem - b.ordem);

  return (
    <section className="flex flex-col gap-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.modulos.titulo}</p>

      <NovoModuloForm courseId={courseId} cursoSlug={cursoSlug} />

      {ordenados.length === 0 ? (
        <p className="text-fg-muted">{t.modulos.vazio}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {ordenados.map((m, i) => {
            const aulasOrdenadas = [...m.aulas].sort((a, b) => a.ordem - b.ordem);
            return (
              <div key={m.id} data-testid="modulo" className="flex flex-col gap-4 border border-line p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex shrink-0 gap-1">
                    <BotaoMover
                      acao={moverModuloAction.bind(null, m.id, cursoSlug, -1)}
                      rotulo={t.modulos.subir}
                      desabilitado={i === 0}
                    />
                    <BotaoMover
                      acao={moverModuloAction.bind(null, m.id, cursoSlug, 1)}
                      rotulo={t.modulos.descer}
                      desabilitado={i === ordenados.length - 1}
                    />
                  </div>
                  {/* Título atual como texto de verdade (não só o value de um
                      input): sem isto o admin não tinha como identificar um
                      módulo sem ler dentro de cada campo de renomear. */}
                  <p className="flex-1 font-medium text-fg">{m.titulo}</p>
                </div>
                <FormTituloModulo id={m.id} cursoSlug={cursoSlug} tituloAtual={m.titulo} />

                <div className="flex flex-col gap-3 pl-1">
                  {aulasOrdenadas.length === 0 ? (
                    <p className="text-sm text-fg-muted">{t.aulas.vazio}</p>
                  ) : (
                    aulasOrdenadas.map((a, j) => (
                      // Botões de mover ficam FORA do <summary>, de propósito: um
                      // <button type="submit"> aninhado dentro de <summary> deixa o
                      // clique ambíguo entre "abrir/fechar" e "enviar o form" — em
                      // vez de arriscar preventDefault cancelar os dois, a linha vira
                      // um flex separado do <details>.
                      <div key={a.id} data-testid="aula" className="border border-line">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                          <details className="flex-1 min-w-0">
                            <summary className="cursor-pointer">
                              <span className="text-fg">{a.titulo}</span>
                              {!a.midia ? (
                                <span className="ml-2 rounded-control border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                                  {t.seloAulaSemVideo}
                                </span>
                              ) : null}
                            </summary>
                            <div className="mt-4 border-t border-line pt-4">
                              <EditorAula aula={a} cursoSlug={cursoSlug} impacto={a.impacto} />
                            </div>
                          </details>
                          <span className="flex shrink-0 gap-1">
                            <BotaoMover
                              acao={moverAulaAction.bind(null, a.id, cursoSlug, -1)}
                              rotulo={t.modulos.subir}
                              desabilitado={j === 0}
                            />
                            <BotaoMover
                              acao={moverAulaAction.bind(null, a.id, cursoSlug, 1)}
                              rotulo={t.modulos.descer}
                              desabilitado={j === aulasOrdenadas.length - 1}
                            />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <NovaAulaForm moduleId={m.id} cursoSlug={cursoSlug} />
                </div>

                <FormExcluirModulo id={m.id} cursoSlug={cursoSlug} impacto={m.impacto} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
