import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { nexoDemo as t } from "@/lib/nexo-demo/textos";
import { alcadaDe, codigoRc, reais, totalSelecionado, type Estado, type OrdemDeCompra } from "@/lib/nexo-demo/regras";
import { Dado, rotulo } from "./pecas";

/**
 * O documento da ordem de compra no Nexo Demo (2026-11-27): o que fecha o
 * processo com algo concreto. Fornecedor, itens, condições, quem aprovou e o
 * registro do envio ao ERP. Tudo fictício, saído da seleção que a pessoa fez.
 */
const o = t.cotacoes.oc;
const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function OrdemCompra({ oc, e, numero, hoje, comprador, solicitante }: { oc: OrdemDeCompra; e: Estado; numero: string; hoje: Date; comprador: string; solicitante: string }) {
  const c = t.cotacoes.colunas;
  const alcada = alcadaDe(totalSelecionado(e));
  return (
    <article className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6" aria-label={`${o.titulo} ${oc.codigo}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className={rotulo}>{o.titulo}</p>
          <h3 className="text-xl font-semibold tracking-[-0.01em] text-fg">{oc.codigo}</h3>
          <p className="text-xs text-fg-muted">
            {codigoRc(numero)} · {o.emitida} {data.format(hoje)}
          </p>
        </div>
        <p className="flex items-center gap-1.5 rounded-full bg-[#dcf5e7] px-3 py-1 text-xs font-medium text-[#0b6b3a]">
          <CheckCircle size={14} weight="fill" aria-hidden="true" />
          {o.erp}
        </p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dado
          nome={o.fornecedor}
          valor={
            <>
              {oc.fornecedor.nome}
              <span className="block text-xs font-normal text-fg-muted">{oc.fornecedor.email}</span>
            </>
          }
        />
        <Dado nome={o.pagamento} valor={oc.fornecedor.pagamento} />
        <Dado nome={o.entrega} valor={o.entregaEm(oc.prazoDias)} />
        <Dado nome={o.centro} valor={e.rc!.centro} />
      </dl>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-bg">
            <tr>
              {[c.item, c.qtd, c.unitario, c.total].map((n) => (
                <th key={n} scope="col" className={`${rotulo} px-3 py-2.5`}>
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {oc.linhas.map((l) => (
              <tr key={l.item.id} className="border-t border-line">
                <th scope="row" className="px-3 py-3 font-medium text-fg">
                  {l.item.nome}
                </th>
                <td className="px-3 py-3 tabular-nums text-fg">
                  {l.qtd} {l.item.unidade}
                </td>
                <td className="px-3 py-3 tabular-nums text-fg">{reais(l.unitarioCentavos)}</td>
                <td className="px-3 py-3 font-medium tabular-nums text-fg">{reais(l.totalCentavos)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-bg">
              <th scope="row" colSpan={3} className="px-3 py-3 text-right text-sm font-semibold text-fg">
                {o.total}
              </th>
              <td className="px-3 py-3 text-base font-semibold tabular-nums text-fg">{reais(oc.totalCentavos)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* No celular a tabela rola de lado e o total fica fora da tela: repete aqui. */}
      <p className="flex items-baseline justify-between gap-3 rounded-lg bg-bg px-3 py-2.5 text-sm font-semibold text-fg sm:hidden" aria-hidden="true">
        {o.total} <span className="text-base tabular-nums">{reais(oc.totalCentavos)}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className={rotulo}>{o.aprovadores}</h4>
          <ul className="flex flex-col gap-1 text-sm text-fg">
            {[
              [o.solicitante, solicitante],
              [o.gestor, o.aprovado],
              [o.comprador, comprador],
              [alcada.aprovador, o.aprovado],
            ].map(([papel, quem]) => (
              <li key={papel} className="flex justify-between gap-3 border-b border-line py-1">
                <span className="text-fg-muted">{papel}</span>
                <span className="font-medium">{quem}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className={rotulo}>{o.erp}</h4>
          <p className="text-sm text-fg">{o.protocolo(oc.codigo)}</p>
          <ul className="flex list-disc flex-col gap-0.5 pl-5 text-sm text-fg-muted">
            {t.cotacoes.condicoes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
