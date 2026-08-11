import {
  Buildings,
  Check,
  Database,
  TreeStructure,
  UsersThree,
  Vault,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { spendLab } from "@/lib/content";

/**
 * A tabela comparativa e para quem o programa nasceu.
 *
 * A comparação é o argumento mais direto da página e ganha a faixa em ink por
 * isso. É a mesma decisão da garantia de dados no /nexo: o tratamento mais forte
 * da casa vai para a frase que precisa sobreviver a uma leitura de passagem.
 *
 * Marcada como <table> de verdade, não como duas listas lado a lado: são pares
 * comparáveis, e um leitor de tela precisa saber que "Uso individual e sem
 * governança" e "Governança e política para prática coletiva" são a MESMA linha.
 * Duas colunas soltas perderiam essa relação.
 *
 * Os ícones da tabela são redundantes com os cabeçalhos e levam aria-hidden -
 * quem ouve a página já sabe qual coluna é qual pelo <th>. O mesmo vale para os
 * ícones das cinco áreas: o nome da área está escrito ao lado.
 *
 * A ligação área -> ícone mora AQUI e não em lib/content.ts. Aquele arquivo é a
 * fonte de texto e existe para ser traduzido num passe só; nome de componente
 * React ali dentro transformaria conteúdo em código.
 */

/**
 * No site de vocês estes cinco ícones são SVG embutido em data-URI: o conjunto
 * padrão do Office, preenchido em #002060. Não dá para baixar como arquivo, e
 * mesmo que desse, azul-marinho chapado não convive com esta paleta e a mistura
 * de duas famílias de ícone é o tipo de detalhe que ninguém aponta e todo mundo
 * sente. Ficaram na Phosphor, que é a única família do projeto.
 *
 * O que mudou: eu tinha escolhido os desenhos por conta própria e a semântica
 * saía do lugar. Fui ler o `id` de cada SVG da referência - Icons_Meeting,
 * Icons_Database, Icons_Safe, Icons_BoardRoom, Icons_Hierarchy - e reaproximei
 * cada um do equivalente na Phosphor. Cofre para Finanças e organograma para
 * Liderança dizem o que "gráfico subindo" e "bússola" não diziam.
 */
const ICONES = {
  "Gente & T&D": UsersThree,
  "TI & TD": Database,
  "Finanças, Gestão de Gastos & Suprimentos": Vault,
  "Áreas de Negócios": Buildings,
  "Liderança & Executivos": TreeStructure,
} as const;
export function SpendLabComparison() {
  const { comparison, audience } = spendLab;

  return (
    <>
      <section className="assurance-band py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <h2 className="max-w-[26ch] text-3xl font-medium leading-tight tracking-[-0.03em] sm:text-4xl">
              {comparison.title}
              <span className="block opacity-70">{comparison.subtitle}</span>
            </h2>
          </Reveal>

          <Reveal className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b py-4 pr-6 font-mono text-[11px] uppercase tracking-[0.16em] font-normal opacity-70"
                    style={{ borderColor: "rgb(248 248 248 / 0.28)" }}
                  >
                    {comparison.columnA}
                  </th>
                  <th
                    scope="col"
                    className="border-b py-4 pl-6 font-mono text-[11px] uppercase tracking-[0.16em] font-normal"
                    style={{ borderColor: "rgb(248 248 248 / 0.28)" }}
                  >
                    {comparison.columnB}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map(([antes, depois]) => (
                  <tr key={antes}>
                    <td
                      className="border-b py-5 pr-6 align-top opacity-60"
                      style={{ borderColor: "rgb(248 248 248 / 0.14)" }}
                    >
                      <span className="flex items-start gap-3">
                        <X
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                          className="mt-1 shrink-0"
                        />
                        {antes}
                      </span>
                    </td>
                    <td
                      className="border-b py-5 pl-6 align-top font-medium"
                      style={{ borderColor: "rgb(248 248 248 / 0.14)" }}
                    >
                      <span className="flex items-start gap-3">
                        <Check
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-accent-text"
                        />
                        {depois}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line py-24 sm:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <h2 className="max-w-[20ch] text-4xl font-medium tracking-[-0.03em] text-fg sm:text-5xl">
              {audience.title}
            </h2>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-fg-muted">
              {audience.lead}
            </p>
          </Reveal>

          <ul className="mt-14">
            {audience.items.map((item) => {
              const Icone = ICONES[item as keyof typeof ICONES];
              return (
                <Reveal key={item}>
                  <li className="flex items-center gap-5 border-t border-line-strong py-6">
                    <Icone
                      size={30}
                      weight="regular"
                      aria-hidden="true"
                      className="shrink-0 text-accent-text"
                    />
                    <span className="text-2xl font-medium tracking-[-0.02em] text-fg sm:text-3xl">
                      {item}
                    </span>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
