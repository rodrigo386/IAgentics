"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { CHAVE_LOCAL, ESTADO_INICIAL, estadoGuardado, type Estado } from "@/lib/nexo-demo/regras";
import { Aplicativo, type Acesso } from "./Aplicativo";

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
        guardar={(estado) => gravar({ acesso, estado })}
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
