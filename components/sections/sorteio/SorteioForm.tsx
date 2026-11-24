"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { sorteio } from "@/lib/content";

/**
 * Cadastro do sorteio no Case 2026 (2026-11-23). Feito para o celular, em pé
 * no estande: quatro campos obrigatórios, teclado certo em cada um, e o
 * número da sorte grande na tela logo depois. O servidor valida tudo de novo
 * (lib/sorteio/regras.ts). LinkedIn e Instagram ficam no bloco da página, logo abaixo.
 */
const t = sorteio.formulario;
const ok = sorteio.ok;
const instagram = sorteio.redes.itens.find((r) => r.rede === "Instagram")!;
const linkedin = sorteio.redes.itens.find((r) => r.rede === "LinkedIn")!;

const campo = "w-full rounded-control border border-line bg-bg px-4 py-3 text-base text-fg outline-none focus-visible:border-fg";
const rotulo = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
const caixa = "flex items-start gap-3 text-sm leading-relaxed text-fg-muted";
const check = "mt-1 size-4 shrink-0 accent-[var(--accent)]";

export function SorteioForm() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [numero, setNumero] = useState<string | null>(null);
  const [repetido, setRepetido] = useState(false);
  const [isca, setIsca] = useState("");

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/sorteio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: f.get("nome"),
          email: f.get("email"),
          whatsapp: f.get("whatsapp"),
          empresa: f.get("empresa"),
          cargo: f.get("cargo"),
          area: f.get("area"),
          seguindo: f.get("seguindo") === "on",
          regulamento: f.get("regulamento") === "on",
          comunicacoes: f.get("comunicacoes") === "on",
          site: isca,
        }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (r.ok && typeof corpo.numero === "string") {
        setNumero(corpo.numero);
        return;
      }
      if (r.ok && corpo.repetido) {
        setRepetido(true);
        return;
      }
      setErro(t.erros[corpo.error] ?? t.erros.falha);
    } catch {
      setErro(t.erros.falha);
    } finally {
      setEnviando(false);
    }
  }

  if (numero || repetido) {
    return (
      /* No celular o botão fica no pé do formulário: leva a tela ao número. */
      <div role="status" ref={(el) => el?.scrollIntoView({ block: "start", behavior: "smooth" })} className="flex scroll-mt-24 flex-col gap-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{ok.eyebrow}</p>
        {numero ? (
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">{ok.titulo}</h2>
            <p className="mt-2 font-mono text-7xl font-medium tabular-nums tracking-[0.04em] text-fg sm:text-8xl" data-numero>
              {numero}
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">{ok.texto}</p>
          </div>
        ) : (
          <p className="leading-relaxed text-fg">{ok.repetido}</p>
        )}
        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <h3 className="text-lg font-medium text-fg">{ok.plataformaTitulo}</h3>
          <p className="text-sm text-fg-muted">{ok.plataformaTexto}</p>
          <Link
            href={ok.plataformaHref}
            className="mt-1 inline-flex items-center justify-center gap-2 self-start rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {ok.plataformaBotao}
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.titulo}</h2>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.nome}</span>
        <input name="nome" required autoComplete="name" className={campo} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.email}</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" className={campo} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.whatsapp}</span>
        <input name="whatsapp" type="tel" required autoComplete="tel" inputMode="tel" className={campo} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={rotulo}>{t.area}</span>
        <select name="area" required defaultValue="" className={campo}>
          <option value="" disabled>
            {t.escolha}
          </option>
          {t.areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>{t.empresa}</span>
          <input name="empresa" autoComplete="organization" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={rotulo}>{t.cargo}</span>
          <input name="cargo" autoComplete="organization-title" className={campo} />
        </label>
      </div>
      {/* Isca para robôs: fora da tela e da ordem de tabulação. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input name="site" tabIndex={-1} autoComplete="off" value={isca} onChange={(e) => setIsca(e.target.value)} />
        </label>
      </div>
      <label className={caixa}>
        <input name="seguindo" type="checkbox" required className={check} />
        <span>
          {t.seguindo}{" "}
          <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="text-fg underline">
            {t.seguindoInstagram}
          </a>{" "}
          {t.seguindoE}{" "}
          <a href={linkedin.href} target="_blank" rel="noopener noreferrer" className="text-fg underline">
            {t.seguindoLinkedin}
          </a>
          .
        </span>
      </label>
      <label className={caixa}>
        <input name="regulamento" type="checkbox" required className={check} />
        <span>
          {t.regulamento}{" "}
          <Link href="/sorteio/regulamento" className="text-fg underline" prefetch={false} target="_blank">
            {t.regulamentoLink}
          </Link>{" "}
          {t.dados}{" "}
          <Link href="/privacidade" className="text-fg underline" prefetch={false} target="_blank">
            {t.privacidade}
          </Link>
          .
        </span>
      </label>
      <label className={caixa}>
        <input name="comunicacoes" type="checkbox" className={check} />
        <span>{t.comunicacoes}</span>
      </label>
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-control bg-accent px-7 py-4 text-lg font-medium text-accent-on transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
      >
        {enviando ? t.enviando : t.botao}
      </button>
      {erro ? (
        <p role="alert" className="text-sm text-fg">
          {erro}
        </p>
      ) : null}
    </form>
  );
}
