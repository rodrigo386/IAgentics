/**
 * Injeta um bloco JSON-LD no HTML.
 *
 * O `<` vira `<` antes de entrar na página: título de curso é texto que
 * o admin digita e vai para cá vindo do banco. Um "</script>" no meio de um
 * título fecharia a tag e o resto do JSON viraria HTML executável - a rota
 * clássica de XSS em dado estruturado. JSON.stringify sozinho NÃO protege
 * disso; escapar o "<" protege, e o JSON continua válido.
 */
export function JsonLd({ dados }: { dados: object }) {
  const json = JSON.stringify(dados).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
