import Image from "next/image";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { academy } from "@/lib/content";

/**
 * Apoiadores, clientes e depoimentos.
 *
 * O manifesto NÃO está mais aqui: subiu para o hero, onde as quatro frases
 * correndo dão movimento à primeira tela. Duas fileiras restam nesta seção,
 * apoiadores e clientes. Ambas param no cursor e no foco, e não existem sob
 * prefers-reduced-motion. A mecânica do laço está em globals.css.
 *
 * Os doze logotipos são marcas de terceiros e seguem a regra da casa: nunca
 * recoloridos, sempre nas cores originais sobre placa de papel. Por isso os
 * clientes ficam em placa clara MESMO sobre o vídeo escuro - logotipo colorido
 * solto sobre imagem some.
 *
 * O `empresas-bg.mp4` NÃO fica aqui, e isso foi um erro meu por um tempo. O nome
 * do arquivo diz "empresas" e eu deduzi que era esta faixa - "Empresas que já
 * transformaram suas equipes". Fui medir onde ele está no site de vocês: cobre a
 * seção "PARA EMPRESAS / Desenhe junto conosco a solução", que é outra. Ele vive
 * em Approach.tsx agora. Nome de arquivo não é evidência de posição.
 */
export function AcademyProof() {
  /**
   * A LARGURA DA PLACA NÃO É ESTÉTICA, É O QUE IMPEDE LOGO REPETIDO NA TELA.
   *
   * O laço anda -50%, então a mesma marca reaparece a cada UMA cópia da fileira.
   * Se essa cópia for mais estreita que a janela, o começo da segunda entra em
   * cena junto com o fim da primeira e a marca aparece duas vezes ao mesmo tempo
   * - foi o que aconteceu aqui com o Oracle: 5 placas de 220px davam 1100px numa
   * janela de 1440px.
   *
   * Com 6 apoiadores a 268px, uma cópia mede ~1608px e cobre telas até aí. Acima
   * disso o problema volta; quem for mexer, mexa na largura, não na duração.
   */
  const placa =
    "flex h-20 w-48 shrink-0 items-center justify-center border border-line bg-brand-paper px-5 sm:w-64";

  return (
    <>
      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
              {academy.supporters.kicker}
            </p>
            <h2 className="mt-6 max-w-[20ch] text-2xl font-medium tracking-[-0.03em] text-fg sm:text-3xl">
              {academy.supporters.title}
            </h2>
          </Reveal>
        </div>

        {/* Corre de borda a borda: contida na coluna, a fileira teria pouco
            percurso e o laço ficaria evidente. */}
        <Reveal className="mt-10">
          <Marquee duration="42s">
            {academy.supporters.logos.map((logo) => (
              <div key={logo.name} className={placa}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.w}
                  height={logo.h}
                  sizes="208px"
                  /* eager, não lazy: a segunda cópia da trilha nasce a até
                     2800px à direita, fora da viewport, e o observador do lazy
                     nunca dispara para ela. Medido: cópia 1 carregava 12/12 e
                     cópia 2 apenas 2/12, ou seja, meia fileira vazia entrava em
                     cena a cada volta. As duas cópias usam o mesmo src, então o
                     navegador busca uma vez só. */
                  loading="eager"
                  className={`w-auto max-w-full object-contain ${
                    logo.w / logo.h > 2 ? "max-h-10" : "max-h-14"
                  }`}
                />
              </div>
            ))}
          </Marquee>
        </Reveal>

      </section>

      <section className="assurance-band py-20 sm:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <h2 className="max-w-[26ch] text-2xl font-medium leading-tight tracking-[-0.03em] sm:text-3xl lg:text-4xl">
              {academy.clients.title}
            </h2>
            <p className="mt-4 opacity-80">{academy.clients.lead}</p>
          </Reveal>
        </div>

        <Reveal className="mt-10">
          <Marquee duration="58s">
            {academy.clients.logos.map((logo) => (
              <div key={logo.name} className={placa}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={logo.w}
                  height={logo.h}
                  sizes="208px"
                  /* eager, não lazy: a segunda cópia da trilha nasce a até
                     2800px à direita, fora da viewport, e o observador do lazy
                     nunca dispara para ela. Medido: cópia 1 carregava 12/12 e
                     cópia 2 apenas 2/12, ou seja, meia fileira vazia entrava em
                     cena a cada volta. As duas cópias usam o mesmo src, então o
                     navegador busca uma vez só. */
                  loading="eager"
                  className={`w-auto max-w-full object-contain ${
                    logo.w / logo.h > 2 ? "max-h-8" : "max-h-14"
                  }`}
                />
              </div>
            ))}
          </Marquee>
        </Reveal>

        <div className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
              {academy.testimonials.kicker}
            </p>
            <h2 className="mt-5 max-w-[18ch] text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
              {academy.testimonials.title}
            </h2>
          </Reveal>

          <ul className="mt-12 grid grid-cols-1 gap-x-10 lg:grid-cols-3">
            {academy.testimonials.items.map((item) => (
              <Reveal key={item.role + item.quote.slice(0, 24)}>
                <li
                  className="flex h-full flex-col border-t py-8"
                  style={{ borderColor: "rgb(248 248 248 / 0.28)" }}
                >
                  <blockquote className="text-lg leading-relaxed">
                    {item.quote}
                  </blockquote>
                  {/* Sem nome: são anônimos. A atribuição em mono diz de qual
                      formação a pessoa fala, que é o que dá contexto sem inventar
                      um cargo. Uma linha vazia onde vinha o nome leria como
                      informação faltando. */}
                  <p className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-[0.14em] opacity-80">
                    {item.role}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
