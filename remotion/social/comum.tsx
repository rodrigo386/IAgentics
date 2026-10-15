import { AbsoluteFill } from "remotion";
import { cursos } from "@/lib/content";
import { aparece, COR, FONTE, Marcas, MONO, Preco } from "../hero-cursos/base";

/**
 * O fecho dos vídeos de lançamento (2026-10-14): frase opcional, o preço,
 * "Cancele quando quiser.", as três marcas e o endereço. O endereço vai
 * grande e em violeta porque post não tem link clicável no vídeo: quem quer
 * assinar precisa conseguir ler e digitar. Coluna centrada, então serve ao
 * 9:16 e ao 4:5 sem posição fixa.
 */
const f = cursos.filmesSocial;

export function FechoSocial({ t, ini, frase }: { t: number; ini: number; frase?: string }) {
  if (t < ini - 0.05) return null;
  const d = frase ? 0.4 : 0;
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 56, padding: "0 70px", fontFamily: FONTE, color: COR.tinta, textAlign: "center" }}>
      {frase ? (
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.02, textWrap: "balance", ...aparece(t, ini) }}>{frase}</div>
      ) : null}
      <Preco t={t} ini={ini + d} tamanho={170} />
      <div style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-0.02em", ...aparece(t, ini + d + 0.5) }}>{f.cancele}</div>
      <Marcas academy style={aparece(t, ini + d + 0.8)} />
      <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 44, letterSpacing: "0.01em", color: COR.violeta, ...aparece(t, ini + d + 1.1) }}>{f.url}</div>
    </AbsoluteFill>
  );
}
