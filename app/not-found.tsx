import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { naoEncontrada } from "@/lib/content";

/** 404 global com a marca: sem ele o Next renderiza a página crua em inglês.
 *  Também é o destino de códigos de certificado inválidos (notFound() em
 *  app/certificados/[codigo]), então o texto cobre os dois casos. */
export default function NaoEncontrada() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="mx-auto flex min-h-[60dvh] max-w-[1400px] items-center px-5 sm:px-8">
        <div className="max-w-2xl py-24">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">{naoEncontrada.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-medium tracking-tighter text-fg sm:text-6xl">{naoEncontrada.titulo}</h1>
          <p className="mt-6 max-w-[52ch] leading-relaxed text-fg-muted">{naoEncontrada.texto}</p>
          <Link
            href="/"
            className="mt-10 inline-flex items-center rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover"
          >
            {naoEncontrada.voltar}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
