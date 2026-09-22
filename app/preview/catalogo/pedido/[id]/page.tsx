import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { catalogo as t } from "@/lib/content";
import { formatarReais } from "@/lib/catalogo/preco";
import { buscarVenda } from "@/lib/catalogo/vendas";

export const metadata: Metadata = { title: t.pedido.titulo, robots: { index: false, follow: false } };

/* Lê o banco a cada acesso: o status muda quando o webhook chega, e o build do
   Railway não alcança o Postgres. */
export const dynamic = "force-dynamic";

/**
 * Para onde o Asaas manda a pessoa depois de pagar. O id é o uuid aleatório da
 * venda — não se chega ao pedido de outra pessoa trocando um número.
 */
export default async function PaginaPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venda = await buscarVenda(id);
  if (!venda) notFound();

  return (
    <>
      <Nav />
      <main id="conteudo" className="pt-16">
        <section className="mx-auto max-w-[760px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
          <h1 className="text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl">{t.pedido.titulo}</h1>
          <p role="status" className="mt-5 text-lg font-medium text-fg">
            {t.pedido.status[venda.status] ?? venda.status}
          </p>
          <p className="mt-2 max-w-[60ch] text-fg-muted">{t.pedido.proximos}</p>

          <h2 className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.pedido.cursos}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {venda.itens.map((item) => (
              <li key={item.slug} className="flex justify-between gap-4 py-3 text-fg">
                <span>{item.nome}</span>
                <span className="tnum shrink-0">{formatarReais(item.precoCentavos)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between gap-4 text-lg font-medium text-fg">
            <span>{t.pedido.total}</span>
            <span className="tnum">{formatarReais(venda.totalCentavos)}</span>
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            {venda.status === "pendente" && venda.urlFatura ? (
              <a
                href={venda.urlFatura}
                className="rounded-control bg-accent px-8 py-4 font-medium text-accent-on transition-colors hover:bg-accent-hover active:translate-y-px motion-reduce:transition-none"
              >
                {t.pedido.abrirFatura}
              </a>
            ) : null}
            <Link
              href="/preview/catalogo"
              className="rounded-control border border-line-strong px-8 py-4 font-medium text-fg transition-colors hover:border-fg motion-reduce:transition-none"
            >
              {t.pedido.voltar}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
