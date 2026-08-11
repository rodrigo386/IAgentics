import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

/**
 * Configuração do Remotion. Só vale para `npm run video` e `npm run video:render` -
 * o Next.js nunca lê este arquivo, e o Remotion nunca lê o next.config.ts. São dois
 * bundlers vivendo no mesmo repositório, o que é suportado, mas exige que a ponte
 * entre eles seja explícita. É o que este arquivo faz, em dois pontos.
 */

Config.setEntryPoint("./remotion/index.ts");

/* O estúdio abre na 3000 por padrão, que é a porta do `next dev`. Com os dois no
   mesmo repositório o choque é questão de tempo, e ele aparece como um erro de porta
   ocupada ou, pior, como o estúdio abrindo o site. 3100 fica fora da faixa 3000-3009
   que o Next usa quando tenta a porta seguinte. */
Config.setStudioPort(3100);

/* O render sobrescreve o arquivo anterior em vez de abortar com "already exists".
   Sem isso, a segunda renderização do mesmo composition falha. */
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((atual) => {
  /* PONTE 1: Tailwind v4. O Remotion usa webpack, não o pipeline do Next, então o
     @tailwindcss/postcss precisa ser plugado à mão. Sem isto, remotion/style.css
     entra como CSS cru e nenhuma classe utilitária existe no vídeo. */
  const comTailwind = enableTailwind(atual);

  return {
    ...comTailwind,
    resolve: {
      ...comTailwind.resolve,
      alias: {
        ...comTailwind.resolve?.alias,
        /* PONTE 2: o alias "@" do tsconfig. O webpack do Remotion não lê
           compilerOptions.paths, então sem esta linha `import { site } from
           "@/lib/content"` quebra o bundle. Com ela, uma composição pode importar
           qualquer coisa do site - inclusive um componente de seção inteiro. */
        "@": path.resolve(process.cwd()),
      },
      /* PONTE 3: URLs que começam com "/". O globals.css tem
         mask-image: url("/iagentics-lockup.png"), que o Next resolve contra public/
         e o webpack cru tenta resolver como módulo - o build morria com
         "/iagentics-lockup.png doesn't exist". `roots` é o mecanismo do próprio
         webpack para isso e vale para qualquer asset de public/ citado em CSS,
         então não precisa de manutenção a cada arquivo novo. */
      roots: [path.resolve(process.cwd(), "public")],
    },
  };
});
