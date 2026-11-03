import type { Metadata } from "next";
import Link from "next/link";
import { admin } from "@/lib/content-admin";
import { bolsas } from "@/lib/content";
import { Cartao } from "@/components/admin/Cartao";
import { bolsasPor, bolsasPorDia, resumoBolsas } from "@/lib/bolsas/inscricoes";

const t = admin.bolsas;
export const metadata: Metadata = { title: t.meta.titulo, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const numero = new Intl.NumberFormat("pt-BR");

/** Os rótulos de cada lista fechada, para a tabela mostrar "Compras" e não "compras". */
const ROTULOS: Record<string, Record<string, string>> = {
  area: bolsas.formulario.areas,
  nivel: bolsas.formulario.niveis,
  tamanho_time: bolsas.formulario.tamanhos,
};

/**
 * Painel do Desafio das 50 Bolsas (2026-11-03). Atrás do Basic Auth do
 * middleware, como todo /admin. Mostra o que o documento da campanha pede
 * para acompanhar (inscritos e, principalmente, vídeos) e exporta o CSV que a
 * banca preenche.
 */
export default async function PainelBolsas() {
  const [r, porDia, porArea, porNivel, porTamanho] = await Promise.all([
    resumoBolsas(),
    bolsasPorDia(),
    bolsasPor("area"),
    bolsasPor("nivel"),
    bolsasPor("tamanho_time"),
  ]);

  const Tabela = ({ titulo, campo, linhas }: { titulo: string; campo: string; linhas: { chave: string; total: number; comVideo: number }[] }) => (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">{titulo}</h2>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line-strong text-fg-muted">
            <th scope="col" className="py-2 pr-4 font-normal">{t.colunas.chave}</th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">{t.colunas.total}</th>
            <th scope="col" className="py-2 text-right font-normal">{t.colunas.comVideo}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave} className="border-b border-line">
              <td className="py-2 pr-4 text-fg">{ROTULOS[campo]?.[l.chave] ?? l.chave}</td>
              <td className="py-2 pr-4 text-right tabular-nums text-fg">{numero.format(l.total)}</td>
              <td className="py-2 text-right tabular-nums text-fg">{numero.format(l.comVideo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
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
        <Cartao rotulo={t.cartoes.comVideo} valor={numero.format(r.comVideo)} nota={t.cartoes.metaVideo} />
        <Cartao rotulo={t.cartoes.contato} valor={numero.format(r.contatoComercial)} />
        <Cartao rotulo={t.cartoes.imagem} valor={numero.format(r.usoImagem)} />
      </section>

      <section className="flex flex-col gap-2">
        <a href="/admin/bolsas/inscricoes.csv" className="w-fit rounded-control bg-accent px-4 py-2 text-sm font-medium text-accent-on">
          {t.exportar}
        </a>
        <p className="max-w-[70ch] text-xs text-fg-muted">{t.exportarNota}</p>
      </section>

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
                  <th scope="col" className="py-2 pr-4 text-right font-normal">{t.porDia.inscritos}</th>
                  <th scope="col" className="py-2 text-right font-normal">{t.porDia.videos}</th>
                </tr>
              </thead>
              <tbody>
                {porDia.map((d) => (
                  <tr key={d.dia} className="border-b border-line">
                    <td className="py-2 pr-4 tabular-nums text-fg">{d.dia.split("-").reverse().slice(0, 2).join("/")}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-fg">{numero.format(d.inscritos)}</td>
                    <td className="py-2 text-right tabular-nums text-fg">{numero.format(d.videos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="grid gap-10 lg:grid-cols-3">
            <Tabela titulo={t.porArea} campo="area" linhas={porArea} />
            <Tabela titulo={t.porNivel} campo="nivel" linhas={porNivel} />
            <Tabela titulo={t.porTamanho} campo="tamanho_time" linhas={porTamanho} />
          </div>
        </>
      )}
    </div>
  );
}
