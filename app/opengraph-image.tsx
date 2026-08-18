import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/content";

/**
 * A imagem que aparece quando um link do site é colado no WhatsApp, LinkedIn
 * ou Slack. Fica na raiz do app, então vale para TODA rota que não declare a
 * sua (o certificado declara a dele).
 *
 * Segue docs/DESIGN.md: fundo ink, texto paper, violeta só como preenchimento
 * (nunca como texto - reprova contraste), cantos retos e Space Grotesk. As
 * fontes vivem em app/fonts/ porque next/font não expõe o arquivo para o
 * gerador de imagem; ler do disco funciona porque isto roda no build.
 *
 * Nenhuma copy nova: nome e tagline vêm de lib/content.ts.
 */
export const alt = `${site.name} · ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#131723";
const PAPER = "#F8F8F8";
const VIOLETA = "#7607E8";

export default async function Image() {
  const [medium, bold] = await Promise.all([
    readFile(join(process.cwd(), "app/fonts/SpaceGrotesk-Medium.ttf")),
    readFile(join(process.cwd(), "app/fonts/SpaceGrotesk-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 28, height: 28, background: VIOLETA }} />
          <div style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 40, color: PAPER }}>
            {site.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 120, height: 8, background: VIOLETA, marginBottom: 36 }} />
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 500,
              fontSize: 68,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: PAPER,
              maxWidth: 900,
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div style={{ display: "flex", fontFamily: "Space Grotesk", fontSize: 26, color: "rgba(248,248,248,0.62)" }}>
          {site.domain}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: medium, weight: 500, style: "normal" },
        { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
