import Image from "next/image";
import {
  Buildings,
  Calculator,
  FileText,
  Receipt,
  SealCheck,
  ShoppingCart,
  Storefront,
  Truck,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/ui/Reveal";
import { nexoPage } from "@/lib/content";

/**
 * O mapa do orquestrador (pitch Hacktown, slide 5): Nexo no centro, nove
 * módulos ao redor.
 *
 * Em lg+ é radial de verdade — cada módulo é posicionado por seno/cosseno em
 * volta do centro, sem biblioteca e sem JS: nove ângulos calculados no
 * servidor viram `left`/`top` em porcentagem. Abaixo de lg, a mesma lista
 * vira uma grade de duas colunas com o Nexo em cima: em tela estreita o
 * círculo comprimido esconderia os nomes uns atrás dos outros.
 *
 * Módulo com `href` é link (para a seção da página que o detalha); os outros
 * são só nome, como no slide. A distinção é visual (sublinhado) e semântica
 * (<a> vs <span>) — leitor de tela não anuncia link onde não há destino.
 */
const ICONES = {
  compras: ShoppingCart,
  ativos: Buildings,
  logistico: Truck,
  nf: Receipt,
  contas: Wallet,
  varejo: Storefront,
  orcamento: Calculator,
  contratos: FileText,
  homologacao: SealCheck,
} as const;

/* Anel ELÍPTICO (34% na horizontal, 42% na vertical) num contêiner mais largo
   que alto: nove rótulos num círculo perfeito colidiam na base — "Benchmark de
   Preços Varejo" e "Contas a Pagar" caem a 40° um do outro e são os dois mais
   largos. A elipse abre espaço embaixo sem esticar a seção para cima.

   Cada rótulo é ANCORADO para fora do anel: o da direita cresce para a
   direita, o da esquerda para a esquerda, e só o do topo fica centrado. É como
   um diagrama de verdade se lê — e é o que impede um rótulo de invadir o
   vizinho ou o centro. */
const RAIO_X = 34;
const RAIO_Y = 42;

function posicao(indice: number, total: number) {
  // Começa no topo (-90°) e anda no sentido horário, como no slide.
  const angulo = (-90 + (360 / total) * indice) * (Math.PI / 180);
  const cos = Math.cos(angulo);
  const ancora = cos > 0.3 ? "0%" : cos < -0.3 ? "-100%" : "-50%";
  return {
    left: `${50 + RAIO_X * cos}%`,
    top: `${50 + RAIO_Y * Math.sin(angulo)}%`,
    transform: `translate(${ancora}, -50%)`,
  };
}

function Modulo({ id, nome, href }: { id: keyof typeof ICONES; nome: string; href?: string }) {
  const Icone = ICONES[id];
  const conteudo = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center bg-accent text-accent-on">
        <Icone size={18} weight="regular" aria-hidden="true" />
      </span>
      <span className="max-w-[15ch] text-sm font-medium leading-tight text-fg">{nome}</span>
    </>
  );
  const classes = "flex items-center gap-3 border border-line bg-surface px-3 py-2 transition-colors";
  return href ? (
    <a href={href} className={`${classes} hover:border-fg`}>
      {conteudo}
    </a>
  ) : (
    <span className={classes}>{conteudo}</span>
  );
}

export function NexoOrquestrador() {
  const t = nexoPage.orquestrador;
  const total = t.modulos.length;

  return (
    <section id="orquestrador" className="border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.eyebrow}</p>
          <h2 className="mt-4 max-w-[18ch] text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl">
            {t.titulo[0]} <span className="text-fg-muted">{t.titulo[1]}</span>
          </h2>
        </Reveal>

        {/* Centro: o lockup do Nexo, reaproveitado do hero. */}
        <div className="mt-14 lg:hidden">
          <div className="flex items-center gap-4 border-b border-line-strong pb-6">
            <Image src="/nexo-app-icon.svg" alt="" width={512} height={512} className="size-12" />
            <div>
              <p className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.centro.nome}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.centro.papel}</p>
            </div>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {t.modulos.map((m) => (
              <li key={m.id}>
                <Modulo id={m.id} nome={m.nome} href={"href" in m ? m.href : undefined} />
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-16 hidden h-[720px] w-full max-w-[1000px] lg:block" role="list">
          {/* Anéis de fundo, elípticos como a órbita dos rótulos: só hairlines,
              sem preenchimento — a página é um dossiê. */}
          <div aria-hidden="true" className="absolute inset-x-[16%] inset-y-[8%] rounded-full border border-line" />
          <div aria-hidden="true" className="absolute inset-x-[36%] inset-y-[30%] rounded-full border border-line-strong" />

          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
            <Image src="/nexo-app-icon.svg" alt="" width={512} height={512} className="size-20" />
            <p className="text-2xl font-medium tracking-[-0.02em] text-fg">{t.centro.nome}</p>
            <p className="-mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">{t.centro.papel}</p>
          </div>

          {t.modulos.map((m, i) => (
            <div key={m.id} role="listitem" className="absolute" style={posicao(i, total)}>
              <Modulo id={m.id} nome={m.nome} href={"href" in m ? m.href : undefined} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
