import type { ReactNode } from "react";

/**
 * Uma fileira que corre. Server Component - o laço é CSS puro, sem JavaScript.
 *
 * A regra que faz isso funcionar: a trilha contém os filhos DUAS vezes e a
 * animação anda até -50%, que é exatamente onde a segunda cópia começa. No
 * salto de volta a imagem é idêntica, então não há costura. Ver globals.css.
 *
 * A segunda cópia é `aria-hidden` e não recebe foco: ela existe só para o olho.
 * Sem isso, um leitor de tela leria a lista de clientes duas vezes seguidas.
 *
 * `duration` é o tempo de uma volta inteira. Fileiras com mais itens precisam de
 * mais tempo para manter a mesma velocidade aparente - 40s para cinco placas e
 * 55s para sete não é capricho, é a mesma velocidade.
 *
 * A JANELA É LIMITADA A 1400px, E ISSO É CORREÇÃO, NÃO ESTILO.
 *
 * A mesma marca reaparece a cada uma cópia da fileira. Se a cópia for mais
 * estreita que a janela, o começo da segunda entra em cena junto com o fim da
 * primeira e a marca aparece DUAS VEZES ao mesmo tempo - o defeito que tirou o
 * marquee da home. Medido nesta página: com placas mais largas o problema sumia
 * em 1280 e 1440 e voltava em 1600 e 1920.
 *
 * Engordar a placa não resolve: para cobrir 1920px com seis logos eu precisaria
 * de placas de 320px. Limitar a janela resolve em qualquer largura de tela, e de
 * quebra alinha a fileira ao mesmo max-w-[1400px] do resto do site. A máscara
 * nas bordas faz a fileira entrar e sair, então a janela contida lê como janela.
 */
export function Marquee({
  children,
  duration = "40s",
  className = "",
  gap = "gap-3",
}: {
  children: ReactNode;
  duration?: string;
  className?: string;
  gap?: string;
}) {
  return (
    <div
      className={`marquee mx-auto max-w-[1400px] ${className}`}
      style={{ "--marquee-duration": duration } as React.CSSProperties}
    >
      <div className="marquee-track">
        <div className={`flex shrink-0 ${gap} pr-3`}>{children}</div>
        <div className={`flex shrink-0 ${gap} pr-3`} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
