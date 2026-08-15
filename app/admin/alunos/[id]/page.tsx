import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { AcoesRapidas } from "@/components/admin/AcoesRapidas";
import { ehChaveSucesso, MENSAGENS_SUCESSO, MOTIVOS_ERRO, mensagemErro } from "@/lib/admin/mensagens-aluno";
import { admin } from "@/lib/content-admin";
import { plataforma } from "@/lib/content-plataforma";
import { buscarAluno } from "@/lib/admin/alunos";
import { buscarFimAssinatura } from "@/lib/plataforma/dados";

function formatarData(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default async function PaginaAluno({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  // Feedback das ações rápidas via querystring (ver AcoesRapidas.tsx). Chave
  // desconhecida na URL é ignorada - nunca vira texto na tela.
  const { msg, erro } = await searchParams;
  const mensagem = ehChaveSucesso(msg)
    ? ({ tipo: "sucesso", texto: MENSAGENS_SUCESSO[msg] } as const)
    : erro && MOTIVOS_ERRO.includes(erro)
      ? ({ tipo: "erro", texto: mensagemErro(erro) } as const)
      : null;
  // O layout de /admin já rodou exigirAdmin() (gate 404); aqui só precisamos
  // de quem está logado, sem pagar outra consulta ao banco para revalidar.
  const sessao = await auth();
  const { id } = await params;
  const aluno = await buscarAluno(id);
  if (!aluno) notFound();

  const t = admin.alunos;
  const tc = plataforma.conta;

  let textoAssinatura: string;
  if (aluno.status === "ativa") {
    // Mesmo padrão de app/app/conta/page.tsx: inatingível com dado real no
    // Ciclo 1 (só SQL grava "manual"), mas o texto por extenso fica pronto.
    const ate = await buscarFimAssinatura(aluno.id);
    textoAssinatura = tc.statusAtiva(ate ? new Intl.DateTimeFormat("pt-BR").format(ate) : "—");
  } else if (aluno.status === "manual") {
    textoAssinatura = tc.statusManual;
  } else if (aluno.status === "inadimplente") {
    textoAssinatura = tc.statusInadimplente;
  } else if (aluno.status === "cancelada") {
    textoAssinatura = tc.statusCancelada;
  } else if (aluno.status === "pendente") {
    textoAssinatura = tc.statusPendente;
  } else {
    textoAssinatura = tc.statusNenhuma;
  }

  const temAcessoAtual = aluno.status === "ativa" || aluno.status === "manual";
  const souEu = sessao?.user?.id === aluno.id;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/alunos"
          className="w-fit font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted transition-colors hover:text-fg"
        >
          ← {t.detalhe.voltar}
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{aluno.nome || aluno.email}</h1>
      </div>

      {/* Bloco 1: identidade */}
      <section className="flex flex-col gap-4 border border-line p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.detalhe.dadosConta}</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.colunas.nome}</dt>
            <dd className="mt-1 text-fg">{aluno.nome || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.colunas.email}</dt>
            <dd className="mt-1 text-fg">{aluno.email}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.colunas.criadoEm}</dt>
            <dd className="mt-1 text-fg">{formatarData(aluno.criadoEm)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">{t.colunas.ultimoAcesso}</dt>
            <dd className="mt-1 text-fg">{formatarData(aluno.ultimoAcesso)}</dd>
          </div>
        </dl>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted">
          {aluno.emailConfirmadoEm ? t.emailConfirmado : t.emailNaoConfirmado}
        </p>
        {aluno.role === "admin" || !aluno.ativo ? (
          <div className="flex flex-wrap gap-2">
            {aluno.role === "admin" ? (
              <span className="rounded-control border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                {t.seloAdmin}
              </span>
            ) : null}
            {!aluno.ativo ? (
              <span className="rounded-control bg-brand-ink/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-paper">
                {t.seloDesativada}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Bloco 2: assinatura, status atual em destaque + histórico completo */}
      <section className="flex flex-col gap-4 border border-line p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.detalhe.assinatura}</p>
        <p className="text-lg font-medium text-fg">{textoAssinatura}</p>

        {aluno.historico.length ? (
          <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
            {aluno.historico.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-1 py-2.5">
                <span className="text-fg">{h.status}</span>
                <span className="font-mono text-[11px] text-fg-muted">{formatarData(h.criadoEm)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">{t.detalhe.semHistorico}</p>
        )}
      </section>

      {/* Bloco 3: progresso por curso, % e aulas concluídas com data */}
      <section className="flex flex-col gap-4 border border-line p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{t.detalhe.progresso}</p>
        {aluno.progresso.length ? (
          <div className="flex flex-col gap-6">
            {aluno.progresso.map((c) => (
              <div key={c.slug} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-fg">{c.titulo}</p>
                  <p className="font-mono text-[11px] text-fg-muted">
                    {plataforma.curso.concluidaDe(c.feitas, c.total)} · {c.pct}%
                  </p>
                </div>
                <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
                  {c.aulas.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 px-1 py-2 text-fg-muted">
                      <span className="text-fg">{a.titulo}</span>
                      <span className="font-mono text-[11px]">{formatarData(a.concluidaEm)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-fg-muted">{t.detalhe.semProgresso}</p>
        )}
      </section>

      <AcoesRapidas
        alunoId={aluno.id}
        role={aluno.role}
        ativo={aluno.ativo}
        temAcesso={temAcessoAtual}
        emailConfirmado={Boolean(aluno.emailConfirmadoEm)}
        souEu={souEu}
        mensagem={mensagem}
      />
    </div>
  );
}
