"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowsClockwise,
  ChatCircleDots,
  SignOut,
} from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import {
  CHAVE_LOCAL,
  ESTADO_INICIAL,
  FASES,
  estadoGuardado,
  faseDe,
  reduzir,
  type Acao,
  type Estado,
} from "@/lib/nexo-demo/regras";
import { botao, botaoLinha, type Tela } from "./pecas";
import {
  TelaAbrirRc,
  TelaAprovacoes,
  TelaMia,
  TelaMinhas,
  TelaRequisicoes,
} from "./TelasRequisicao";
import { TelaCotacoes } from "./TelaCotacoes";
import { TelaFecho } from "./TelaFecho";

/**
 * Nexo Demo (2026-11-27, pedido do Rodrigo): cadastro curto e, logo depois,
 * uma réplica clicável do fluxo de Compras do Nexo, com dados fictícios.
 *
 * - A demonstração inteira roda no navegador (lib/nexo-demo/regras.ts): o que
 *   a pessoa clica não vai ao servidor. Vai só o PASSO alcançado, ligado ao
 *   cadastro (/api/nexo-demo/passo), para o comercial saber até onde ela foi.
 * - Acesso e avanço ficam no localStorage, lidos depois de montar: a primeira
 *   pintura é sempre a entrada, igual no servidor e no navegador.
 * - `?acesso=<token>` é o link do e-mail: troca o token pela empresa e some
 *   do endereço.
 */
type Acesso = { token: string; nome: string; empresa: string };
type Guardado = { acesso: Acesso; estado: Estado };

function ler(): Guardado | null {
  try {
    const g = JSON.parse(
      localStorage.getItem(CHAVE_LOCAL) ?? "null",
    ) as Guardado | null;
    return g &&
      typeof g.acesso?.token === "string" &&
      typeof g.acesso?.empresa === "string"
      ? {
          acesso: {
            ...g.acesso,
            nome: typeof g.acesso.nome === "string" ? g.acesso.nome : "",
          },
          estado: estadoGuardado(g.estado),
        }
      : null;
  } catch {
    return null;
  }
}

function gravar(g: Guardado | null) {
  try {
    if (g) localStorage.setItem(CHAVE_LOCAL, JSON.stringify(g));
    else localStorage.removeItem(CHAVE_LOCAL);
  } catch {
    /* Sem localStorage a demo funciona; só não lembra na próxima visita. */
  }
}

export function NexoDemo({
  nav,
  rodape,
}: {
  nav: ReactNode;
  rodape: ReactNode;
}) {
  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [inicial, setInicial] = useState<Estado>(ESTADO_INICIAL);
  const [avisoAcesso, setAvisoAcesso] = useState(false);

  useEffect(() => {
    const guardado = ler();
    const token = new URLSearchParams(window.location.search).get("acesso");
    if (!token) {
      if (guardado) {
        setInicial(guardado.estado);
        setAcesso(guardado.acesso);
      }
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    if (guardado?.acesso.token === token) {
      setInicial(guardado.estado);
      setAcesso(guardado.acesso);
      return;
    }
    fetch("/api/nexo-demo/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const corpo = await r.json().catch(() => ({}));
        if (r.ok && typeof corpo.empresa === "string")
          setAcesso({
            token,
            nome: typeof corpo.nome === "string" ? corpo.nome : "",
            empresa: corpo.empresa,
          });
        else setAvisoAcesso(true);
      })
      .catch(() => setAvisoAcesso(true));
  }, []);

  if (acesso) {
    return (
      <Aplicativo
        key={acesso.token}
        acesso={acesso}
        inicial={inicial}
        sair={() => {
          gravar(null);
          setInicial(ESTADO_INICIAL);
          setAcesso(null);
        }}
      />
    );
  }
  return (
    <>
      {nav}
      <main id="conteudo" className="pt-16">
        <Entrada aviso={avisoAcesso} entrar={setAcesso} />
      </main>
      {rodape}
    </>
  );
}

function Entrada({
  aviso,
  entrar,
}: {
  aviso: boolean;
  entrar: (a: Acesso) => void;
}) {
  const f = t.formulario;
  const l = t.login;
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [isca, setIsca] = useState("");

  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const d = new FormData(ev.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/nexo-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: d.get("nome"),
          email: d.get("email"),
          empresa: d.get("empresa"),
          celular: d.get("celular"),
          linkedin: d.get("linkedin"),
          ciencia: d.get("ciencia") === "on",
          site: isca,
        }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok && typeof corpo.token === "string") {
        window.scrollTo(0, 0);
        entrar({
          token: corpo.token,
          nome: typeof corpo.nome === "string" ? corpo.nome : "",
          empresa: corpo.empresa,
        });
        return;
      }
      setErro(f.erros[corpo.error] ?? f.erros.falha);
    } catch {
      setErro(f.erros.falha);
    } finally {
      setEnviando(false);
    }
  }

  const [modo, setModo] = useState<"cadastro" | "login">("cadastro");
  const [linkPara, setLinkPara] = useState<string | null>(null);
  const trocar = (m: "cadastro" | "login") => {
    setModo(m);
    setErro(null);
    setLinkPara(null);
  };

  /* Quem já tem cadastro: o link de acesso vai para o e-mail (sem senha). A resposta é a mesma, exista o cadastro ou não. */
  async function pedirLink(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const email = String(
      new FormData(ev.currentTarget).get("email") ?? "",
    ).trim();
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/nexo-demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, site: isca }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok) setLinkPara(email);
      else setErro(f.erros[corpo.error] ?? f.erros.falha);
    } catch {
      setErro(f.erros.falha);
    } finally {
      setEnviando(false);
    }
  }

  const rotuloCampo =
    "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
  const campoSite =
    "w-full rounded-control border border-line bg-bg px-4 py-3 text-base text-fg outline-none focus-visible:border-fg";
  return (
    <section className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-x-16">
      <div className="flex flex-col gap-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          {t.entrada.eyebrow}
        </p>
        <h1 className="max-w-[14ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
          {t.entrada.titulo}
        </h1>
        <p className="max-w-[48ch] leading-relaxed text-fg-muted">
          {t.entrada.lead}
        </p>
        <ol className="grid gap-4 sm:grid-cols-2">
          {t.entrada.passos.map((p, i) => (
            <li
              key={p.titulo}
              className="flex flex-col gap-1 border-t border-line pt-3"
            >
              <span className="font-mono text-xs text-accent-text">
                0{i + 1}
              </span>
              <span className="font-medium text-fg">{p.titulo}</span>
              <span className="text-sm text-fg-muted">{p.texto}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-fg-muted">
          {t.entrada.tempo} {t.entrada.aviso}
        </p>
      </div>
      <div className="border border-line bg-surface p-6 sm:p-8 lg:self-start">
        {modo === "login" ? (
          linkPara ? (
            <div role="status" className="flex flex-col gap-4">
              <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">
                {l.enviadoTitulo}
              </h2>
              <p className="leading-relaxed text-fg-muted">
                {l.enviado(linkPara)}
              </p>
              <button
                type="button"
                onClick={() => setLinkPara(null)}
                className="self-start text-sm text-fg underline"
              >
                {l.outro}
              </button>
            </div>
          ) : (
            <form onSubmit={pedirLink} className="flex flex-col gap-4">
              <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">
                {l.titulo}
              </h2>
              <p className="text-sm leading-relaxed text-fg-muted">{l.texto}</p>
              <label className="flex flex-col gap-1.5">
                <span className={rotuloCampo}>{l.email}</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  className={campoSite}
                />
              </label>
              <button
                type="submit"
                disabled={enviando}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-control bg-accent px-7 py-4 text-lg font-medium text-accent-on transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
              >
                {enviando ? l.enviando : l.botao}
              </button>
              {erro ? (
                <p role="alert" className="text-sm text-fg">
                  {erro}
                </p>
              ) : null}
              <p className="border-t border-line pt-4 text-sm text-fg-muted">
                {l.semCadastro}{" "}
                <button
                  type="button"
                  onClick={() => trocar("cadastro")}
                  className="text-fg underline"
                >
                  {l.semCadastroLink}
                </button>
              </p>
            </form>
          )
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">
              {f.titulo}
            </h2>
            {aviso ? (
              <p role="status" className="text-sm text-fg">
                {f.acessoInvalido}
              </p>
            ) : null}
            <label className="flex flex-col gap-1.5">
              <span className={rotuloCampo}>{f.nome}</span>
              <input
                name="nome"
                required
                minLength={2}
                autoComplete="name"
                className={campoSite}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={rotuloCampo}>{f.email}</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                className={campoSite}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={rotuloCampo}>{f.empresa}</span>
              <input
                name="empresa"
                required
                minLength={2}
                autoComplete="organization"
                className={campoSite}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={rotuloCampo}>{f.celular}</span>
              <input
                name="celular"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                className={campoSite}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={rotuloCampo}>{f.linkedin}</span>
              <input
                name="linkedin"
                required
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="nexo-demo-linkedin"
                className={campoSite}
              />
              <span id="nexo-demo-linkedin" className="text-xs text-fg-muted">
                {f.linkedinExemplo}
              </span>
            </label>
            {/* Isca para robôs: fora da tela e da ordem de tabulação. */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
            >
              <label>
                Site
                <input
                  name="site"
                  tabIndex={-1}
                  autoComplete="off"
                  value={isca}
                  onChange={(ev) => setIsca(ev.target.value)}
                />
              </label>
            </div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-fg-muted">
              <input
                name="ciencia"
                type="checkbox"
                required
                className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span>
                {f.ciencia}{" "}
                <Link
                  href="/privacidade"
                  className="text-fg underline"
                  prefetch={false}
                  target="_blank"
                >
                  {f.privacidade}
                </Link>
                .
              </span>
            </label>
            <button
              type="submit"
              disabled={enviando}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-control bg-accent px-7 py-4 text-lg font-medium text-accent-on transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
            >
              {enviando ? f.enviando : f.botao}
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </button>
            {erro ? (
              <p role="alert" className="text-sm text-fg">
                {erro}
              </p>
            ) : null}
            <p className="border-t border-line pt-4 text-sm text-fg-muted">
              {f.jaTenho}{" "}
              <button
                type="button"
                onClick={() => trocar("login")}
                className="text-fg underline"
              >
                {f.jaTenhoLink}
              </button>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function Aplicativo({
  acesso,
  inicial,
  sair,
}: {
  acesso: Acesso;
  inicial: Estado;
  sair: () => void;
}) {
  const [e, despacharBase] = useReducer(reduzir, inicial);
  const fase = faseDe(e);
  const [tela, setTela] = useState<Tela>(
    fase === "fim"
      ? "fecho"
      : fase === "inicio"
        ? "mia"
        : (t.guia.fases[fase].tela as Tela),
  );
  const conteudo = useRef<HTMLDivElement>(null);
  const enviado = useRef(-1);

  /* Guarda o avanço e avisa o servidor do passo mais distante (só o índice). */
  useEffect(() => {
    gravar({ acesso, estado: e });
    const passo = FASES.indexOf(fase);
    if (passo <= enviado.current) return;
    enviado.current = passo;
    void fetch("/api/nexo-demo/passo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: acesso.token, passo }),
      keepalive: true,
    }).catch(() => {});
  }, [acesso, e, fase]);

  const ir = (destino: Tela) => {
    setTela(destino);
    conteudo.current?.focus();
    window.scrollTo(0, 0);
  };
  const despachar = (a: Acao) => {
    despacharBase(a);
    if (a.tipo === "reiniciar") ir("mia");
    if (a.tipo === "aprovarSelecao") ir("fecho");
  };

  const g = t.guia.fases[fase];
  const props = {
    e,
    despachar,
    ir,
    empresa: acesso.empresa,
    nome: acesso.nome.trim().split(/\s+/)[0] || acesso.empresa,
  };
  const itens: { id: string; rotulo: string }[] = t.app.menu.flatMap((m) => [
    ...m.itens,
  ]);
  return (
    <div className="nexo-demo flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
        <Image src="/nexo-app-icon.svg" alt="" width={26} height={26} />
        <span className="text-base font-semibold text-fg">{t.app.marca}</span>
        <span className="rounded-full bg-[#ece5ff] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent-text">
          {t.app.selo}
        </span>
        <span className="ml-2 hidden text-xs text-fg-muted md:inline">
          {t.app.faixa}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden text-right leading-tight sm:block">
            <p className="max-w-[22ch] truncate text-sm font-medium text-fg">
              {acesso.nome || acesso.empresa}
            </p>
            <p className="max-w-[28ch] truncate text-[11px] text-fg-muted">
              {acesso.nome ? acesso.empresa : t.app.perfil}
            </p>
          </div>
          <a
            href={t.fecho.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${botao} !px-3 !py-2`}
          >
            <ChatCircleDots size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{t.app.falar}</span>
            <span className="sr-only sm:hidden">{t.app.falar}</span>
          </a>
          <button
            type="button"
            onClick={sair}
            className={`${botaoLinha} !px-3 !py-2`}
            aria-label={t.app.sair}
            title={t.app.sair}
          >
            <SignOut size={16} aria-hidden="true" />
          </button>
        </div>
      </header>
      <p className="border-b border-line bg-surface px-4 py-1.5 text-center text-xs text-fg-muted md:hidden">
        {t.app.faixa}
      </p>

      <div className="flex min-h-0 flex-1">
        {/* Menu: coluna no desktop; no celular, faixa que rola de lado, só com as telas da demo. */}
        <nav
          aria-label={t.app.marca}
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-surface p-3 lg:flex"
        >
          {t.app.menu.map((grupo) => (
            <div key={grupo.grupo} className="flex flex-col gap-0.5">
              <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                {grupo.grupo}
              </p>
              {grupo.itens.map((i) => (
                <ItemMenu
                  key={i.id}
                  ativo={tela === i.id}
                  rotulo={i.rotulo}
                  onClick={() => ir(i.id as Tela)}
                />
              ))}
            </div>
          ))}
          <div
            className="mt-2 flex flex-col gap-0.5 border-t border-line pt-3"
            aria-hidden="true"
          >
            <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
              {t.app.completa}
            </p>
            {t.app.menuCompleto
              .flatMap((m) => m.itens)
              .map((i) => (
                <span key={i} className="px-3 py-1.5 text-sm text-fg-subtle/70">
                  {i}
                </span>
              ))}
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav
            aria-label={t.app.marca}
            className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-2 lg:hidden"
          >
            {itens.map((i) => (
              <ItemMenu
                key={i.id}
                ativo={tela === i.id}
                rotulo={i.rotulo}
                onClick={() => ir(i.id as Tela)}
                compacto
              />
            ))}
          </nav>

          {/* O guia: papel da vez, o que fazer e o botão que leva à tela certa. */}
          <div
            role="status"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-[#f4f1ff] px-4 py-3 sm:px-6"
          >
            <span className="rounded-full bg-accent-text px-2.5 py-0.5 text-xs font-medium text-white">
              {t.guia.rotulo(FASES.indexOf(fase) + 1, FASES.length)}
            </span>
            <p className="min-w-0 flex-1 basis-60 text-sm text-fg">
              <strong className="font-semibold">{g.papel}.</strong> {g.texto}
            </p>
            <div className="flex gap-2">
              {tela !== g.tela ? (
                <button
                  type="button"
                  onClick={() => ir(g.tela as Tela)}
                  className={`${botao} !py-2`}
                  data-guia
                >
                  {t.guia.ir}
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </button>
              ) : null}
              {e.rc ? (
                <button
                  type="button"
                  onClick={() => despachar({ tipo: "reiniciar" })}
                  className={`${botaoLinha} !py-2`}
                >
                  <ArrowsClockwise size={14} aria-hidden="true" />
                  {t.app.reiniciar}
                </button>
              ) : null}
            </div>
          </div>

          <main
            id="conteudo"
            ref={conteudo}
            tabIndex={-1}
            className="flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8"
          >
            <div className="mx-auto flex max-w-[980px] flex-col gap-5">
              {tela === "mia" ? <TelaMia {...props} /> : null}
              {tela === "abrir" ? <TelaAbrirRc {...props} /> : null}
              {tela === "minhas" ? <TelaMinhas {...props} /> : null}
              {tela === "aprovacoes" ? <TelaAprovacoes {...props} /> : null}
              {tela === "requisicoes" ? <TelaRequisicoes {...props} /> : null}
              {tela === "cotacoes" ? <TelaCotacoes {...props} /> : null}
              {tela === "fecho" ? <TelaFecho {...props} /> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ItemMenu({
  ativo,
  rotulo,
  onClick,
  compacto = false,
}: {
  ativo: boolean;
  rotulo: string;
  onClick: () => void;
  compacto?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={`rounded-lg px-3 text-left text-sm transition-colors ${compacto ? "shrink-0 whitespace-nowrap py-1.5" : "py-2"} ${ativo ? "bg-[#e8ecff] font-medium text-accent" : "text-fg hover:bg-bg"}`}
    >
      {rotulo}
    </button>
  );
}
