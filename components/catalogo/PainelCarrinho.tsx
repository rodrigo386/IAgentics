"use client";
import { useState } from "react";
import Link from "next/link";
import { catalogo as t } from "@/lib/content";
import { DESCONTO_MAXIMO_PCT, descontoDaPosicao, formatarReais } from "@/lib/catalogo/preco";
import type { Carrinho } from "./useCarrinho";

/**
 * Carrinho + formulário do checkout (extraído do Catalogo em 2026-09-26 para
 * servir aos layouts da prévia: na página atual ele é a coluna lateral; na
 * Vitrine, na Jornada e no Mural, o conteúdo da gaveta).
 */
const ROTULO = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
/* Campo é superfície, não controle: raio 0 pela trava de forma (DESIGN.md).
   Sem outline-none de propósito — o anel global de :focus-visible é o foco
   visível do site, e trocar por 1px de borda o deixaria fraco demais. */
const CAMPO = "border border-line-strong bg-bg px-4 py-3 text-fg transition-colors duration-200 focus:border-fg motion-reduce:transition-none";
const BOTAO_CHEIO =
  "rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none";
const BOTAO_CONTORNO =
  "rounded-control border border-line-strong px-6 py-3 font-medium text-fg transition-colors hover:border-fg active:translate-y-px motion-reduce:transition-none";

type Props = { estado: Carrinho; precoBaseCentavos: number; urlCheckout: string };

export function PainelCarrinho({ estado, precoBaseCentavos, urlCheckout }: Props) {
  const { carrinho } = estado;
  const [etapa, setEtapa] = useState<"carrinho" | "dados">("carrinho");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nomes = new Map<string, string>(t.cursos.map((c) => [c.slug, c.nome]));
  const ultimo = carrinho.itens.at(-1);
  const vazio = carrinho.itens.length === 0 && carrinho.packs.length === 0;

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch(urlCheckout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: String(form.get("nome") ?? ""),
          email: String(form.get("email") ?? ""),
          cpf: String(form.get("cpf") ?? ""),
          telefone: String(form.get("telefone") ?? ""),
          consentimento: form.get("consentimento") === "on",
          slugs: [...carrinho.packs.map((p) => p.slug), ...carrinho.itens.map((i) => i.slug)],
        }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (resposta.ok && typeof corpo.url === "string") {
        estado.limpar();
        window.location.assign(corpo.url);
        return;
      }
      setErro(t.checkout.erros[corpo.error] ?? t.checkout.erros.geral);
    } catch {
      setErro(t.checkout.erros.geral);
    }
    setEnviando(false);
  }

  /* Total com "Total" à esquerda: aparece nas duas etapas, porque quem preenche
     os dados precisa continuar vendo quanto vai pagar. */
  const linhaTotal = (
    <p className="flex items-baseline justify-between gap-4 text-fg">
      <span className="font-medium">{t.carrinho.total}</span>
      <span data-testid="total" className="tnum text-2xl font-medium tracking-[-0.02em]">
        {formatarReais(carrinho.totalCentavos)}
      </span>
    </p>
  );

  return (
    <>
        {etapa === "carrinho" ? (
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.carrinho.titulo}</h2>
            {vazio ? (
              <p className="text-fg-muted">{t.carrinho.vazio}</p>
            ) : (
              <>
                <ul className="divide-y divide-line border-y border-line">
                  {/* Packs primeiro: preço fechado, com o valor dos avulsos riscado ao lado. */}
                  {carrinho.packs.map((p) => (
                    <li key={p.slug} className="flex items-start justify-between gap-4 py-3">
                      <span className="flex flex-col">
                        <span className="text-fg">{t.pack.nome(t.niveis[p.nivel])}</span>
                        <span className={ROTULO}>{t.pack.cursos(p.cursos)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                        <s className="tnum text-sm text-fg-subtle">{formatarReais(p.cheioCentavos)}</s>
                        <span className="tnum text-fg">{formatarReais(p.precoCentavos)}</span>
                      </span>
                    </li>
                  ))}
                  {carrinho.itens.map((item) => (
                    <li key={item.slug} className="flex items-start justify-between gap-4 py-3">
                      <span className="text-fg">{nomes.get(item.slug)}</span>
                      <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                        {item.descontoPct > 0 ? (
                          <span className="flex items-center gap-2">
                            <span className={`${ROTULO} text-accent-text`}>
                              {estado.fixos.has(item.slug) ? t.lancamento : t.carrinho.desconto(item.descontoPct)}
                            </span>
                            <s className="tnum text-sm text-fg-subtle">{formatarReais(item.cheioCentavos)}</s>
                          </span>
                        ) : null}
                        <span className="tnum text-fg">{formatarReais(item.precoCentavos)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {linhaTotal}
                {carrinho.cheioCentavos > carrinho.totalCentavos ? (
                  <p className="text-sm text-accent-text">
                    {t.carrinho.economia(formatarReais(carrinho.cheioCentavos - carrinho.totalCentavos))}
                  </p>
                ) : null}
              </>
            )}
            {/* O gatilho só aparece com carrinho cheio de algo: vazio, a frase
                do estado vazio já anuncia o desconto do segundo curso. */}
            {carrinho.itens.length > 0 && carrinho.proximo ? (
              <p className="border-l-2 border-accent pl-3 text-sm text-fg">
                {t.carrinho.proximo(formatarReais(carrinho.proximo.precoCentavos), carrinho.proximo.descontoPct)}
              </p>
            ) : null}
            {/* Pelo degrau, não pelo desconto do item: o de preço próprio tem o dele. */}
            {!carrinho.proximo && ultimo && descontoDaPosicao(carrinho.itens.length - 1) === DESCONTO_MAXIMO_PCT ? (
              <p className="border-l-2 border-accent pl-3 text-sm text-fg">{t.carrinho.teto}</p>
            ) : null}
            <button
              type="button"
              disabled={vazio}
              onClick={() => setEtapa("dados")}
              className={BOTAO_CHEIO}
            >
              {t.carrinho.finalizar}
            </button>
          </div>
        ) : (
          <form onSubmit={pagar} className="flex flex-col gap-4">
            {linhaTotal}
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-fg">{t.checkout.titulo}</h2>

            <label className="flex flex-col gap-1.5">
              <span className={ROTULO}>{t.checkout.nome}</span>
              <input name="nome" type="text" required autoComplete="name" className={CAMPO} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={ROTULO}>{t.checkout.email}</span>
              <input name="email" type="email" required autoComplete="email" className={CAMPO} />
            </label>

            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col gap-1.5">
                <span className={ROTULO}>{t.checkout.cpf}</span>
                <input
                  name="cpf"
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  aria-describedby="nota-cpf"
                  className={CAMPO}
                />
              </label>
              <p id="nota-cpf" className="text-xs text-fg-muted">
                {t.checkout.notaCpf}
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={ROTULO}>{t.checkout.telefone}</span>
              <input name="telefone" type="tel" required autoComplete="tel" className={CAMPO} />
            </label>

            <label className="flex items-start gap-3 text-sm text-fg-muted">
              <input name="consentimento" type="checkbox" required className="mt-1 size-4 shrink-0 accent-accent" />
              <span>{t.checkout.consentimento}</span>
            </label>

            {erro ? (
              <p role="alert" className="text-sm text-accent-text">
                {erro}
              </p>
            ) : null}

            <button type="submit" disabled={enviando} className={BOTAO_CHEIO}>
              {enviando ? t.checkout.enviando : t.checkout.pagar}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => {
                // O erro é da tentativa que ficou para trás; voltar e reabrir não pode mostrá-lo de novo.
                setErro(null);
                setEtapa("carrinho");
              }}
              className={`${BOTAO_CONTORNO} disabled:pointer-events-none disabled:opacity-50`}
            >
              {t.checkout.voltar}
            </button>

            <Link href="/privacidade" className="text-sm text-fg-muted underline-offset-4 hover:underline">
              {t.checkout.privacidade}
            </Link>
          </form>
        )}
    </>
  );
}
