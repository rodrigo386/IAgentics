"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { catalogo as t } from "@/lib/content";
import { calcularCarrinho, DESCONTO_MAXIMO_PCT, formatarReais } from "@/lib/catalogo/preco";
import { Trilha } from "./Trilha";

/**
 * Catálogo + carrinho + formulário do checkout (2026-09-22).
 *
 * O preço exibido sai da MESMA calcularCarrinho que o servidor usa; o servidor
 * recalcula de qualquer jeito, e é o valor dele que vai para o Asaas.
 *
 * O carrinho fica em localStorage — conveniência por navegador. Tudo com
 * try/catch: janela anônima ou armazenamento bloqueado só fazem o carrinho não
 * sobreviver ao recarregar; a página funciona igual.
 */
const CHAVE = "iagentics:carrinho";

const ROTULO = "font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted";
/* Campo é superfície, não controle: raio 0 pela trava de forma (DESIGN.md).
   Sem outline-none de propósito — o anel global de :focus-visible é o foco
   visível do site, e trocar por 1px de borda o deixaria fraco demais. */
const CAMPO = "border border-line-strong bg-bg px-4 py-3 text-fg transition-colors duration-200 focus:border-fg motion-reduce:transition-none";
const BOTAO_CHEIO =
  "rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none";
const BOTAO_CONTORNO =
  "rounded-control border border-line-strong px-6 py-3 font-medium text-fg transition-colors hover:border-fg active:translate-y-px motion-reduce:transition-none";

type Props = { precoBaseCentavos: number; urlCheckout: string };

export function Catalogo({ precoBaseCentavos, urlCheckout }: Props) {
  const validos = useMemo(() => t.cursos.map((c) => c.slug), []);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [etapa, setEtapa] = useState<"carrinho" | "dados">("carrinho");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // null = todos os níveis. Com 62 cursos, a grade inteira não se navega.
  const [nivel, setNivel] = useState<number | null>(null);

  // Lê depois de montar: no SSR não há localStorage, e ler no render quebraria a hidratação.
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
      if (Array.isArray(salvo)) setSlugs(salvo.filter((s) => typeof s === "string"));
    } catch {}
  }, []);

  function salvar(novos: string[]) {
    setSlugs(novos);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novos));
    } catch {}
  }

  /* A trilha SOMA ao carrinho, não substitui: quem já escolheu algo à mão não
     perde a escolha. Os cursos da trilha entram depois, na ordem de estudo. */
  function aplicarTrilha(trilha: string[]) {
    salvar([...slugs, ...trilha.filter((s) => !slugs.includes(s))]);
  }

  const carrinho = calcularCarrinho(slugs, validos, precoBaseCentavos);
  const noCarrinho = new Set(carrinho.itens.map((i) => i.slug));
  const nomes = new Map<string, string>(t.cursos.map((c) => [c.slug, c.nome]));
  const ultimo = carrinho.itens.at(-1);

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
          slugs: carrinho.itens.map((i) => i.slug),
        }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (resposta.ok && typeof corpo.url === "string") {
        try {
          localStorage.removeItem(CHAVE);
        } catch {}
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
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="flex flex-col gap-8 lg:col-span-8 lg:self-start">
        <Trilha precoBaseCentavos={precoBaseCentavos} aoAplicar={aplicarTrilha} />

        <div role="group" aria-label={t.filtro.rotulo} className="flex flex-wrap gap-2">
          {[null, 0, 1, 2, 3].map((n) => (
            <button
              key={String(n)}
              type="button"
              aria-pressed={nivel === n}
              onClick={() => setNivel(n)}
              className={`rounded-control border px-4 py-2 text-sm transition-colors motion-reduce:transition-none ${
                nivel === n ? "border-accent bg-accent text-accent-on" : "border-line-strong text-fg hover:border-fg"
              }`}
            >
              {n === null ? t.filtro.todos : t.niveis[n]}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {t.cursos
            .filter((c) => nivel === null || c.nivel === nivel)
            .map((c) => {
              const dentro = noCarrinho.has(c.slug);
              return (
                /* Borda violeta como indicador de estado — uso sancionado da trava
                   de cor; o fundo do card não muda, então o acento continua único. */
                <article
                  key={c.slug}
                  className={`flex flex-col border bg-surface p-5 transition-colors duration-300 motion-reduce:transition-none ${
                    dentro ? "border-accent" : "border-line"
                  }`}
                >
                  <p className={ROTULO}>{t.niveis[c.nivel]}</p>
                  <h3 className="mt-2 text-lg font-medium tracking-[-0.01em] text-fg">{c.nome}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{c.temas.map((tema) => t.temas[tema]).join(" · ")}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                    {dentro ? (
                      <button
                        type="button"
                        aria-label={`${t.card.remover} ${c.nome}`}
                        onClick={() => salvar(slugs.filter((s) => s !== c.slug))}
                        className={`${BOTAO_CONTORNO} px-4 py-2 text-sm`}
                      >
                        {t.card.remover}
                      </button>
                    ) : (
                      <>
                        <span className="tnum text-sm text-fg">
                          {t.card.entraPor(formatarReais(carrinho.proximo!.precoCentavos))}
                        </span>
                        <button
                          type="button"
                          aria-label={`${t.card.adicionar} ${c.nome}`}
                          onClick={() => salvar([...slugs, c.slug])}
                          className={`${BOTAO_CHEIO} px-4 py-2 text-sm`}
                        >
                          {t.card.adicionar}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      <aside
        aria-label={t.carrinho.titulo}
        className="border border-line bg-surface p-6 lg:sticky lg:top-24 lg:col-span-4 lg:self-start"
      >
        {etapa === "carrinho" ? (
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.carrinho.titulo}</h2>
            {carrinho.itens.length === 0 ? (
              <p className="text-fg-muted">{t.carrinho.vazio}</p>
            ) : (
              <>
                <ul className="divide-y divide-line border-y border-line">
                  {carrinho.itens.map((item) => (
                    <li key={item.slug} className="flex items-start justify-between gap-4 py-3">
                      <span className="text-fg">{nomes.get(item.slug)}</span>
                      <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                        {item.descontoPct > 0 ? (
                          <span className="flex items-center gap-2">
                            <span className={`${ROTULO} text-accent-text`}>{t.carrinho.desconto(item.descontoPct)}</span>
                            <s className="tnum text-sm text-fg-subtle">{formatarReais(precoBaseCentavos)}</s>
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
            {!carrinho.proximo && ultimo?.descontoPct === DESCONTO_MAXIMO_PCT ? (
              <p className="border-l-2 border-accent pl-3 text-sm text-fg">{t.carrinho.teto}</p>
            ) : null}
            <button
              type="button"
              disabled={carrinho.itens.length === 0}
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
      </aside>
    </div>
  );
}
