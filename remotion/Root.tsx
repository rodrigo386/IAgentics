import { Composition } from "remotion";
import { cursos, site } from "@/lib/content";
import { AberturaMarca, type PropsAbertura } from "./AberturaMarca";
import { BannerBoasVindas } from "./BannerBoasVindas";
import { FilmeSpendNf } from "./nexo-nf/FilmeSpendNf";
import { FilmeLogistico } from "./nexo-logistico/FilmeLogistico";
import { FilmeVarejo } from "./nexo-varejo/FilmeVarejo";
import { FilmeOrcamento } from "./nexo-orcamento/FilmeOrcamento";
import { CapaFundamentos } from "./capas/CapaFundamentos";
import { CapaCurso, type PropsCapaCurso } from "./capas/CapaCurso";
import { ConceitoTudo } from "./hero-cursos/ConceitoTudo";
import { ConceitoCapaAula } from "./hero-cursos/ConceitoCapaAula";
import { ConceitoRotina } from "./hero-cursos/ConceitoRotina";
import { ConceitoMisto, DURACAO_MISTO } from "./hero-cursos/ConceitoMisto";
import { DURACAO_LANCAMENTO, Lancamento } from "./social/Lancamento";
import { DURACAO_DENTRO, Dentro } from "./social/Dentro";
import { Miniatura, type PropsMiniatura } from "./social/Miniatura";
import { Depoimento, duracaoDepoimento, type PropsDepoimento } from "./social/Depoimento";
import { DURACAO as DURACAO_HERO, FPS as FPS_HERO, H as H_HERO, W as W_HERO } from "./hero-cursos/base";
import { ALTURA_CAPA_VITRINE, CapaVitrine, LARGURA_CAPA_VITRINE, MOTIVOS, type PropsCapaVitrine } from "./capas/CapaVitrine";
import { DURACAO_SOLUCAO, FilmeSolucaoAcademy, FilmeSolucaoNexo, FilmeSolucaoSpendLab } from "./home-solucoes/FilmesSolucoes";
import { DURACAO as DURACAO_NF } from "./nexo-kit/cues";
import "./style.css";

/**
 * Catálogo de composições. Tudo que aparece na barra lateral do estúdio nasce aqui.
 *
 * A tagline e o domínio vêm de lib/content.ts, o mesmo arquivo que alimenta o site.
 * Isso é de propósito: a trava de copy da casa diz que toda string visível mora lá,
 * e um vídeo com a tagline digitada à mão sairia do ar junto com a primeira revisão
 * de texto sem ninguém perceber.
 *
 * As duas composições são o MESMO componente em dois formatos. O componente lê
 * width/height por useVideoConfig e se reorganiza, então não existe uma versão
 * "vertical" para manter em paralelo.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="abertura-marca"
        component={AberturaMarca}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={
          { tagline: site.tagline, dominio: site.domain } satisfies PropsAbertura
        }
      />

      <Composition
        id="abertura-marca-vertical"
        component={AberturaMarca}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          { tagline: site.tagline, dominio: site.domain } satisfies PropsAbertura
        }
      />

      {/* Fundo em vídeo do banner de boas-vindas do painel (/app). 10s a
          30fps, loop perfeito (ver nota em BannerBoasVindas.tsx) - o
          <video loop> na página nunca mostra um corte. Só motion abstrato
          (rampa da marca + blobs), sem props: logo e wordmark "Academy"
          são overlay HTML em app/app/page.tsx, não pixel de vídeo - um
          vídeo não consegue reagir ao crop de object-cover em cada
          viewport, um elemento HTML consegue (ver nota de topo em
          BannerBoasVindas.tsx). */}
      <Composition
        id="banner-boasvindas"
        component={BannerBoasVindas}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={640}
      />

      {/* Filme do módulo Spend via NF da /nexo (2026-10-06): loop mudo de 22 s
          a 60 fps, feito com a skill product-film. Ver remotion/nexo-nf/. */}
      <Composition
        id="nexo-spend-nf"
        component={FilmeSpendNf}
        durationInFrames={Math.round(DURACAO_NF * 60)}
        fps={60}
        width={1920}
        height={1080}
      />

      {/* Os irmãos do Spend via NF (2026-10-07): mesmo ritmo e mesmo kit
          (remotion/nexo-kit). */}
      <Composition id="nexo-logistico" component={FilmeLogistico} durationInFrames={Math.round(DURACAO_NF * 60)} fps={60} width={1920} height={1080} />
      <Composition id="nexo-varejo" component={FilmeVarejo} durationInFrames={Math.round(DURACAO_NF * 60)} fps={60} width={1920} height={1080} />
      <Composition id="nexo-orcamento" component={FilmeOrcamento} durationInFrames={Math.round(DURACAO_NF * 60)} fps={60} width={1920} height={1080} />

      {/* O palco das três soluções na home (2026-10-07): loops de 8 s, 4:3. */}
      <Composition id="solucao-nexo" component={FilmeSolucaoNexo} durationInFrames={DURACAO_SOLUCAO * 60} fps={60} width={1440} height={1080} />
      <Composition id="solucao-academy" component={FilmeSolucaoAcademy} durationInFrames={DURACAO_SOLUCAO * 60} fps={60} width={1440} height={1080} />
      <Composition id="solucao-spend-lab" component={FilmeSolucaoSpendLab} durationInFrames={DURACAO_SOLUCAO * 60} fps={60} width={1440} height={1080} />

      {/* Capa 600×900 do Fundamentos para a /cursos, no formato das capas da Solution (2026-10-14). */}
      <Composition id="capa-fundamentos" component={CapaFundamentos} durationInFrames={1} fps={30} width={600} height={900} />
      {/* Capa genérica dos cursos da IAgentics sem capa (2026-10-14): título e área via --props. */}
      <Composition id="capa-curso" component={CapaCurso} durationInFrames={1} fps={30} width={600} height={900} defaultProps={{ titulo: "Strategic Sourcing 4.0", area: "Compras" } satisfies PropsCapaCurso} />
      {/* Os três conceitos de filme para a hero da /cursos (2026-10-14), 4:5, 18 s, mudos. */}
      <Composition id="hero-cursos-tudo" component={ConceitoTudo} durationInFrames={DURACAO_HERO * FPS_HERO} fps={FPS_HERO} width={W_HERO} height={H_HERO} />
      <Composition id="hero-cursos-capa-aula" component={ConceitoCapaAula} durationInFrames={DURACAO_HERO * FPS_HERO} fps={FPS_HERO} width={W_HERO} height={H_HERO} />
      <Composition id="hero-cursos-misto" component={ConceitoMisto} durationInFrames={DURACAO_MISTO * FPS_HERO} fps={FPS_HERO} width={W_HERO} height={H_HERO} />
      <Composition id="hero-cursos-rotina" component={ConceitoRotina} durationInFrames={DURACAO_HERO * FPS_HERO} fps={FPS_HERO} width={W_HERO} height={H_HERO} />
      {/* Vídeos de lançamento para Instagram e LinkedIn (2026-10-14): cada um em
          9:16 (Reels, Stories) e 4:5 (feed). As cenas leem o tamanho do quadro. */}
      <Composition id="social-lancamento-vertical" component={Lancamento} durationInFrames={DURACAO_LANCAMENTO * FPS_HERO} fps={FPS_HERO} width={1080} height={1920} />
      <Composition id="social-lancamento-feed" component={Lancamento} durationInFrames={DURACAO_LANCAMENTO * FPS_HERO} fps={FPS_HERO} width={1080} height={1350} />
      <Composition id="social-dentro-vertical" component={Dentro} durationInFrames={DURACAO_DENTRO * FPS_HERO} fps={FPS_HERO} width={1080} height={1920} />
      <Composition id="social-dentro-feed" component={Dentro} durationInFrames={DURACAO_DENTRO * FPS_HERO} fps={FPS_HERO} width={1080} height={1350} />
      {/* Depoimentos do Vinícius (2026-10-15), conceito B "moldura da marca",
          em 9:16 e 4:5. O id leva a hora da gravação com hífens (o Remotion
          não aceita ponto em id). Precisam do bundle com --public-dir
          out/publico-depoimentos (scripts/depoimentos-social.sh). */}
      {cursos.depoimentos.videos.flatMap(({ id }) =>
        ([["vertical", 1920], ["feed", 1350]] as const).map(([formato, altura]) => (
          <Composition key={`${id}-${formato}`} id={`depoimento-${id.replaceAll(".", "-")}-${formato}`} component={Depoimento} durationInFrames={Math.ceil(duracaoDepoimento(id) * 30)} fps={30} width={1080} height={altura} defaultProps={{ id } satisfies PropsDepoimento} />
        )),
      )}
      {/* Miniaturas (capas) dos vídeos de lançamento, um quadro só. */}
      {(["lancamento", "dentro"] as const).flatMap((video) =>
        ([["vertical", 1920], ["feed", 1350]] as const).map(([formato, altura]) => (
          <Composition key={`${video}-${formato}`} id={`social-miniatura-${video}-${formato}`} component={Miniatura} durationInFrames={1} fps={30} width={1080} height={altura} defaultProps={{ video } satisfies PropsMiniatura} />
        )),
      )}
      {/* As capas geradas da vitrine da /cursos (2026-10-14): uma por curso
          marcado `gerada` em cursos.vitrine. O id leva o nome do arquivo de
          `capa`, e é por ele que `npm run capas:vitrine` sabe onde gravar. */}
      {capasGeradas().map(({ id, props }) => (
        <Composition key={id} id={id} component={CapaVitrine} durationInFrames={1} fps={30} width={LARGURA_CAPA_VITRINE} height={ALTURA_CAPA_VITRINE} defaultProps={props} />
      ))}
    </>
  );
}

/** Os tons da marca nas capas geradas da vitrine. Cor e desenho correm em
 *  ciclos de tamanhos diferentes (5 e 6), então capas vizinhas nunca repetem
 *  o par, e a ordem segue a da vitrine. */
const CORES_DAS_CAPAS = ["#7607e8", "#6693f8", "#6020ee", "#55afed", "#6c66f3"];

function capasGeradas() {
  let n = 0;
  return cursos.vitrine.linhas.flatMap((linha) =>
    linha.cursos.flatMap((c) => {
      if (!("gerada" in c)) return [];
      const i = n++;
      const formacao = cursos.formacoes.itens.find((f) => f.nome === c.nome);
      const props: PropsCapaVitrine = {
        titulo: c.nome,
        cor: CORES_DAS_CAPAS[i % CORES_DAS_CAPAS.length],
        motivo: MOTIVOS[i % MOTIVOS.length],
        emBreve: "emBreve" in c,
        rodape: "professor" in c ? c.professor : "",
        ...(formacao && "professor" in c ? { foto: formacao.foto, enquadre: formacao.enquadre } : {}),
      };
      return [{ id: `capa-vitrine-${c.capa.replace("/vitrine/", "").replace(".jpg", "")}`, props }];
    }),
  );
}
