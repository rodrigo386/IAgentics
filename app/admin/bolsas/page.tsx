import type { Metadata } from "next";
import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { Cartao } from "@/components/admin/Cartao";
import { bolsasPorDia, listarInscricoes, resumoBolsas, resumoSelecao, resumoVouchers, STATUS_VALIDOS } from "@/lib/bolsas/inscricoes";
import { listarPrecoFundador } from "@/lib/assinatura/assinaturas";
import { hojeSP } from "@/lib/assinatura/regras";
import { janelaDoVoucher, precisaReajuste, type GrupoVoucher } from "@/lib/bolsas/voucher";
import { avaliada, elegivel, ordenarPainel, pontuacao, NOTA_MAX, VAGAS } from "@/lib/bolsas/selecao";
import { agoraBolsas, faseDasInscricoes } from "@/lib/bolsas/regras";
import { funilInterno } from "@/lib/admin/cursos";
import { CAMPOS_BOLSAS, EVENTOS_BOLSAS, MOTIVOS_BOLSAS } from "@/lib/eventos";
import { bolsas as textosBolsas } from "@/lib/content";
import { aplicarRankingAdmin, avaliarInscricao, enviarResultados, enviarVouchers, reajustarAssinaturaAdmin } from "./acoes";

const t = admin.bolsas;
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const numero = new Intl.NumberFormat("pt-BR");
const porcento = (v: number, base: number) => (base > 0 ? ((v / base) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0");

/**
 * Painel do Desafio Prova Real (2026-11-03; refeito em 2026-11-18). Atrás do
 * Basic Auth do middleware, como todo /admin. Mostra os inscritos (meta 400,
 * do mapa da campanha) e exporta o CSV que a equipe preenche na avaliação.
 */
const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const campo = "w-full rounded-control border border-line bg-bg px-3 py-2 text-sm text-fg";
const rotuloCampo = "font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted";

export default async function PainelBolsas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; ranking?: string; resultado?: string; voucher?: string }>;
}) {
  const sp = await searchParams;
  const [r, porDia, sel, todas, vou, fundador, dentro] = await Promise.all([
    resumoBolsas(),
    bolsasPorDia(),
    resumoSelecao(),
    listarInscricoes(),
    resumoVouchers(),
    listarPrecoFundador(),
    funilInterno({ de: "2026-11-23", ate: hojeSP() }, "/bolsas", EVENTOS_BOLSAS),
  ]);
  const s = t.selecao;
  const v = t.voucher;
  const hoje = hojeSP(agoraBolsas());
  const reajustar = fundador.filter((a) => precisaReajuste(a.precoFundadorAte, hoje));
  const aEnviar: Record<GrupoVoucher, number> = { nao_selecionado: vou.naoSelecionadosAEnviar, bolsista: vou.bolsistasAEnviar };
  const busca = (sp.q ?? "").trim().toLowerCase();
  const statusFiltro = STATUS_VALIDOS.find((x) => x === sp.status);
  const vagasRestantes = Math.max(0, VAGAS - (sel.porStatus.selecionado ?? 0) - (sel.porStatus.aceitou ?? 0));
  const encerradas = faseDasInscricoes(agoraBolsas()) === "encerradas";
  const aviso = (() => {
    if (sp.ranking) {
      const [a, b] = sp.ranking.split("-").map(Number);
      return Number.isFinite(a) && Number.isFinite(b) ? s.ranking.feito(a, b) : null;
    }
    if (sp.resultado === "cedo") return s.resultado.cedo;
    if (sp.voucher === "cedo") return v.bloqueado;
    if (sp.voucher) {
      const [a, b] = sp.voucher.split("-").map(Number);
      return Number.isFinite(a) && Number.isFinite(b) ? v.feito(a, b) : null;
    }
    if (sp.resultado) {
      const [a, b] = sp.resultado.split("-").map(Number);
      return Number.isFinite(a) && Number.isFinite(b) ? s.resultado.feito(a, b) : null;
    }
    return null;
  })();
  const linhas = ordenarPainel(todas).filter(
    (l) =>
      (!statusFiltro || l.status === statusFiltro) &&
      (!busca || `${l.nome} ${l.email} ${l.empresa}`.toLowerCase().includes(busca)),
  );

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-12 px-5 py-12 sm:px-8">
      <header>
        <Link href="/admin" className="text-sm text-fg-muted hover:text-fg">
          {t.voltar}
        </Link>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-fg">{t.titulo}</h1>
        <p className="mt-2 text-fg-muted">{t.lead}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao rotulo={t.cartoes.inscritos} valor={numero.format(r.inscritos)} nota={t.cartoes.metaInscritos} />
        <Cartao rotulo={t.cartoes.grupo} valor={numero.format(r.grupoWhatsapp)} />
        <Cartao rotulo={t.cartoes.contato} valor={numero.format(r.contatoComercial)} />
        <Cartao rotulo={t.cartoes.imagem} valor={numero.format(r.usoImagem)} />
      </section>

      <section className="flex flex-col gap-2">
        <a href="/admin/bolsas/inscricoes.csv" className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
          {t.exportar}
        </a>
        <p className="max-w-[70ch] text-xs text-fg-muted">{t.exportarNota}</p>
      </section>

      {/* Funil por dentro da /bolsas (2026-11-23) */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.dentro.titulo}</h2>
        {dentro.inicio === null ? (
          <p className="text-sm text-fg-muted">{t.dentro.semDados}</p>
        ) : (
          <>
            <ol className="flex flex-col gap-3">
              {t.dentro.etapas.map((e, i) => {
                const valor = i === 0 ? dentro.visitas : e.eventos.reduce((soma, ev) => soma + (dentro.totais[ev] ?? 0), 0);
                return (
                  <li key={e.rotulo} className="grid grid-cols-[180px_1fr] items-center gap-4 sm:grid-cols-[300px_1fr]">
                    <span className="text-sm text-fg">{e.rotulo}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-6 bg-accent/60" style={{ width: `${Math.max(1.5, Math.min(100, (valor / Math.max(1, dentro.visitas)) * 100))}%` }} />
                      <span className="shrink-0 text-sm tabular-nums text-fg">
                        <strong className="font-medium">{numero.format(valor)}</strong>
                        {i > 0 ? <span className="ml-2 text-fg-muted">{t.dentro.dasVisitas(porcento(valor, dentro.visitas))}</span> : null}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="text-sm text-fg-muted">{t.dentro.desde(dentro.inicio.split("-").reverse().join("/"))}</p>
            <div className="grid gap-8 md:grid-cols-2">
              {(
                [
                  [t.dentro.bloqueios.titulo, t.dentro.bloqueios.nota, CAMPOS_BOLSAS.map((c) => [t.dentro.bloqueios.campos[c] ?? c, dentro.totais[`bolsas_bloqueio_${c}`] ?? 0] as const)],
                  [t.dentro.erros.titulo, t.dentro.erros.nota, MOTIVOS_BOLSAS.map((m) => [textosBolsas.formulario.erros[m] ?? m, dentro.totais[`bolsas_erro_${m}`] ?? 0] as const)],
                ] as const
              ).map(([titulo, nota, itens]) => {
                const com = itens.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
                return (
                  <div key={titulo} className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium text-fg">{titulo}</h3>
                    {com.length === 0 ? (
                      <p className="text-sm text-fg-muted">{t.dentro.nenhum}</p>
                    ) : (
                      <ul className="flex flex-col gap-1 text-sm">
                        {com.map(([rotulo, n]) => (
                          <li key={rotulo} className="flex justify-between gap-4 border-b border-line py-1">
                            <span className="text-fg">{rotulo}</span>
                            <span className="tabular-nums text-fg">{numero.format(n)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-fg-muted">{nota}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <p className="max-w-[80ch] text-xs text-fg-muted">{t.dentro.nota}</p>
      </section>

      {aviso ? (
        <p role="status" className="border border-accent bg-surface px-4 py-3 text-sm text-fg">
          {aviso}
        </p>
      ) : null}

      {r.inscritos > 0 ? (
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{s.titulo}</h2>
            <p className="mt-2 max-w-[75ch] text-sm text-fg-muted">{s.lead}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_VALIDOS.filter((x) => x === "selecionado" || x === "nao_selecionado" || x === "espera").map((x) => (
              <Cartao key={x} rotulo={s.status[x]} valor={numero.format(sel.porStatus[x] ?? 0)} nota={x === "selecionado" ? `Meta: ${VAGAS}` : undefined} />
            ))}
            <Cartao rotulo={s.cartoes.naoAvaliadas} valor={numero.format(sel.naoAvaliadas)} alerta={sel.naoAvaliadas > 0} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form action={aplicarRankingAdmin} className="flex flex-col gap-3 border border-line bg-surface p-5">
              <h3 className="text-base font-medium text-fg">{s.ranking.titulo}</h3>
              <p className="text-sm text-fg-muted">{s.ranking.texto(vagasRestantes)}</p>
              <label className="flex items-start gap-2 text-sm text-fg">
                <input type="checkbox" name="confirmar" required className="mt-1 size-4 accent-[var(--accent)]" />
                <span>{s.ranking.confirmar}</span>
              </label>
              <button type="submit" className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
                {s.ranking.botao}
              </button>
            </form>
            <form action={enviarResultados} className="flex flex-col gap-3 border border-line bg-surface p-5">
              <h3 className="text-base font-medium text-fg">{s.resultado.titulo}</h3>
              <p className="text-sm text-fg-muted">{s.resultado.texto}</p>
              <p className="text-sm text-fg">
                {s.cartoes.pendente}: <strong className="tabular-nums">{numero.format(sel.resultadoPendente)}</strong> · {s.cartoes.enviado}:{" "}
                <strong className="tabular-nums">{numero.format(sel.resultadoEnviado)}</strong>
              </p>
              {sel.resultadoPendente === 0 ? (
                <p className="text-sm text-fg-muted">{s.resultado.nada}</p>
              ) : !encerradas ? (
                <p className="text-sm text-fg-muted">{s.resultado.cedo}</p>
              ) : (
                <button type="submit" className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
                  {s.resultado.botao(sel.resultadoPendente)}
                </button>
              )}
            </form>
          </div>

          <div className="flex flex-col gap-4 border border-line bg-surface p-5">
            <h3 className="text-base font-medium text-fg">{v.titulo}</h3>
            <p className="max-w-[75ch] text-sm text-fg-muted">{v.texto}</p>
            <p className="text-sm text-fg">
              {v.cartoes.enviados}: <strong className="tabular-nums">{numero.format(vou.enviados)}</strong> · {v.cartoes.usados}:{" "}
              <strong className="tabular-nums">{numero.format(vou.usados)}</strong>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["nao_selecionado", "bolsista"] as const).map((g) => {
                const janela = janelaDoVoucher(g, hoje);
                return (
                  <form key={g} action={enviarVouchers} className="flex flex-col gap-2 border-t border-line pt-3">
                    <input type="hidden" name="grupo" value={g} />
                    <p className="text-sm font-medium text-fg">
                      {v.grupos[g].rotulo} · <span className="font-normal text-fg-muted">{v.aEnviar(aEnviar[g])}</span>
                    </p>
                    {janela === "atrasada" && aEnviar[g] > 0 ? <p className="text-sm text-fg">{v.atrasado}</p> : null}
                    {aEnviar[g] === 0 ? (
                      <p className="text-sm text-fg-muted">{v.nada}</p>
                    ) : janela === "cedo" ? (
                      <p className="text-sm text-fg-muted">{v.cedo[g]}</p>
                    ) : (
                      <button type="submit" className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
                        {v.grupos[g].botao(aEnviar[g])}
                      </button>
                    )}
                  </form>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border border-line bg-surface p-5">
            <h3 className="text-base font-medium text-fg">{t.reajuste.titulo}</h3>
            <p className="max-w-[75ch] text-sm text-fg-muted">{t.reajuste.texto}</p>
            {reajustar.length === 0 ? (
              <p className="text-sm text-fg-muted">{t.reajuste.vazio}</p>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line-strong text-fg-muted">
                    <th scope="col" className="py-2 pr-4 font-normal">{t.reajuste.colunas.nome}</th>
                    <th scope="col" className="py-2 pr-4 font-normal">{t.reajuste.colunas.email}</th>
                    <th scope="col" className="py-2 pr-4 font-normal">{t.reajuste.colunas.ate}</th>
                    <th scope="col" className="py-2 font-normal">{t.reajuste.colunas.acao}</th>
                  </tr>
                </thead>
                <tbody>
                  {reajustar.map((a) => (
                    <tr key={a.id} className="border-b border-line">
                      <td className="py-2 pr-4 text-fg">{a.nome}</td>
                      <td className="py-2 pr-4 text-fg-muted">{a.email}</td>
                      <td className="py-2 pr-4 tabular-nums text-fg">{(a.precoFundadorAte ?? "").split("-").reverse().join("/")}</td>
                      <td className="py-2">
                        {/* Dois cliques: muda a cobrança no Asaas. */}
                        <details>
                          <summary className="cursor-pointer text-xs underline">{t.reajuste.botao}</summary>
                          <form action={reajustarAssinaturaAdmin} className="mt-2">
                            <input type="hidden" name="id" value={a.id} />
                            <button type="submit" className="rounded-control border border-line-strong px-3 py-1.5 text-xs text-fg">
                              {t.reajuste.confirmar}
                            </button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[240px] flex-1 flex-col gap-1">
              <span className={rotuloCampo}>{s.filtros.busca}</span>
              <input name="q" defaultValue={sp.q ?? ""} className={campo} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={rotuloCampo}>{s.filtros.status}</span>
              <select name="status" defaultValue={statusFiltro ?? ""} className={campo}>
                <option value="">{s.filtros.todos}</option>
                {STATUS_VALIDOS.map((x) => (
                  <option key={x} value={x}>
                    {s.status[x]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-control border border-line-strong px-4 py-2 text-sm text-fg">
              {s.filtros.filtrar}
            </button>
          </form>

          <p className="text-sm text-fg-muted" aria-live="polite">
            {numero.format(linhas.length)} de {numero.format(todas.length)}
          </p>

          <ol className="flex flex-col gap-4">
            {linhas.map((l) => {
              const pts = pontuacao(l);
              const sn = (v: boolean | null) => (v === true ? "sim" : v === false ? "nao" : "");
              return (
                <li key={l.id} className="border border-line bg-surface p-5">
                  <form action={avaliarInscricao} className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                    <input type="hidden" name="id" value={l.id} />
                    <div className="flex flex-col gap-2 text-sm">
                      <p className="text-base font-medium text-fg">
                        {l.nome} <span className="font-normal text-fg-muted">· {l.empresa}</span>
                      </p>
                      <p className="text-fg-muted">
                        {l.email} · {l.whatsapp} · {dataHora.format(l.criadaEm)}
                      </p>
                      <p className="flex flex-wrap gap-x-4 text-fg">
                        {l.instagram ? (
                          <a href={l.instagram} target="_blank" rel="noopener noreferrer" className="underline">
                            Instagram<span className="sr-only"> de {l.nome}. {s.linha.abrirPerfil}</span>
                          </a>
                        ) : null}
                        {l.linkedin ? (
                          <a href={l.linkedin} target="_blank" rel="noopener noreferrer" className="underline">
                            LinkedIn<span className="sr-only"> de {l.nome}. {s.linha.abrirPerfil}</span>
                          </a>
                        ) : null}
                      </p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{s.linha.problema}</p>
                      <p className="whitespace-pre-line leading-relaxed text-fg">{l.problema}</p>
                      <p className="text-xs text-fg-muted">
                        {pts !== null ? s.linha.pontos(pts) : s.linha.semNota}
                        {avaliada(l) && !elegivel(l) ? ` · ${s.linha.fora}` : ""}
                        {l.resultadoEnviadoEm ? ` · ${s.linha.resultadoEm(dataHora.format(l.resultadoEnviadoEm))}` : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 self-start">
                      <label className="flex flex-col gap-1">
                        <span className={rotuloCampo}>{s.campos.clareza}</span>
                        <input name="clareza" type="number" min={0} max={NOTA_MAX} step={1} defaultValue={l.clareza ?? ""} className={campo} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={rotuloCampo}>{s.campos.solucao}</span>
                        <input name="solucao" type="number" min={0} max={NOTA_MAX} step={1} defaultValue={l.solucao30Dias ?? ""} className={campo} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={rotuloCampo}>{s.campos.seguiu}</span>
                        <select name="seguiu" defaultValue={sn(l.seguiuAcademy)} className={campo}>
                          <option value="">{s.campos.naoAvaliado}</option>
                          <option value="sim">{s.campos.sim}</option>
                          <option value="nao">{s.campos.nao}</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={rotuloCampo}>{s.campos.publicou}</span>
                        <select name="publicou" defaultValue={sn(l.publicouPost)} className={campo}>
                          <option value="">{s.campos.naoAvaliado}</option>
                          <option value="sim">{s.campos.sim}</option>
                          <option value="nao">{s.campos.nao}</option>
                        </select>
                      </label>
                      <label className="col-span-2 flex flex-col gap-1">
                        <span className={rotuloCampo}>{s.campos.status}</span>
                        <select name="status" defaultValue={l.status} className={campo}>
                          {STATUS_VALIDOS.map((x) => (
                            <option key={x} value={x}>
                              {s.status[x]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="col-span-2 flex flex-col gap-1">
                        <span className={rotuloCampo}>{s.campos.observacao}</span>
                        <input name="observacao" maxLength={1000} defaultValue={l.observacao ?? ""} className={campo} />
                      </label>
                      <button type="submit" className="col-span-2 w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
                        {s.campos.salvar}
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {r.inscritos === 0 ? (
        <p className="text-fg-muted">{t.semDados}</p>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.porDia.titulo}</h2>
            <table className="w-full max-w-[480px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong text-fg-muted">
                  <th scope="col" className="py-2 pr-4 font-normal">{t.porDia.dia}</th>
                  <th scope="col" className="py-2 text-right font-normal">{t.porDia.inscritos}</th>
                </tr>
              </thead>
              <tbody>
                {porDia.map((d) => (
                  <tr key={d.dia} className="border-b border-line">
                    <td className="py-2 pr-4 tabular-nums text-fg">{d.dia.split("-").reverse().slice(0, 2).join("/")}</td>
                    <td className="py-2 text-right tabular-nums text-fg">{numero.format(d.inscritos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
