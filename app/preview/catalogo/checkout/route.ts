import { NextResponse } from "next/server";
import { catalogo, site } from "@/lib/content";
import { calcularPedido, PRECO_TESTE_CENTAVOS, PRECO_TESTE_PACK_CENTAVOS } from "@/lib/catalogo/preco";
import { validarPedido, vencimentoEm } from "@/lib/catalogo/pedido";
import { anexarCobranca, criarVenda, marcarFalha } from "@/lib/catalogo/vendas";
import { criarCliente, criarCobranca, redigirCpfs } from "@/lib/asaas/cliente";

/**
 * Checkout da PRÉVIA do catálogo.
 *
 * Mora dentro de /preview/catalogo de propósito: é o CAMINHO que fixa o modo
 * "teste" e o preço de R$ 5 — nada do que o navegador manda escolhe isso. Na
 * publicação, /cursos ganha a sua rota com o preço real (e limite de
 * tentativas: sem senha, qualquer um que ache esta rota cria cliente e
 * cobrança no Asaas).
 *
 * Ordem: grava a venda ANTES de falar com o Asaas. Se o Asaas falhar ANTES de
 * criar a cobrança, a venda vira "falhou" e o painel mostra a tentativa. Mas
 * se a cobrança já foi criada e só o passo seguinte (gravar o id dela na
 * venda) falhar, a venda NÃO pode virar "falhou" — a cobrança já existe no
 * Asaas, com fatura já mandada ao comprador, e "falhou" faria o webhook
 * perder o pagamento (só transiciona de "pendente"/"cancelado" para "pago").
 * Nesse caso a venda fica "pendente" e a resposta ainda devolve a URL da
 * fatura — dinheiro sem dono é exatamente o que essa ordem evita.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Cursos E packs são itens válidos; o preço de cada um sai de calcularPedido.
  const validos = [...catalogo.cursos.map((c) => c.slug), ...catalogo.packs.map((p) => p.slug)];
  const validacao = validarPedido(payload, validos);
  if (!validacao.ok) return NextResponse.json({ error: validacao.motivo }, { status: 422 });
  const { nome, email, telefone, cpf, slugs } = validacao.dados;

  const carrinho = calcularPedido(slugs, catalogo.cursos, catalogo.packs, {
    cursoCentavos: PRECO_TESTE_CENTAVOS,
    packCentavos: PRECO_TESTE_PACK_CENTAVOS,
  });
  /* Pack entra na venda como item próprio, com o nome dizendo quantos cursos
     cobre — é o que o Pecege lê no CSV para liberar o nível inteiro. */
  const itens = [
    ...carrinho.packs.map((p) => ({
      slug: p.slug,
      nome: catalogo.pack.nomeVenda(catalogo.niveis[p.nivel], p.cursos),
      descontoPct: 0,
      precoCentavos: p.precoCentavos,
    })),
    ...carrinho.itens.map((item) => ({
      ...item,
      nome: catalogo.cursos.find((c) => c.slug === item.slug)!.nome,
    })),
  ];

  let id: string;
  try {
    id = await criarVenda({ nome, email, telefone, itens, totalCentavos: carrinho.totalCentavos, modo: "teste" });
  } catch (erro) {
    // Mensagem fixa: erro do Drizzle inclui a query com nome/email/telefone
    // ("Failed query ... params: ..."), e isso não pode ir para o log.
    console.error("[checkout] falha ao gravar a venda", (erro as { code?: string })?.code ?? "sem_codigo");
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  let cobranca: { id: string; urlFatura: string } | undefined;
  try {
    const cliente = await criarCliente({ nome, email, cpf, telefone });
    cobranca = await criarCobranca({
      clienteId: cliente.id,
      valorCentavos: carrinho.totalCentavos,
      vencimento: vencimentoEm(3),
      descricao: `IAgentics · ${itens.map((i) => i.nome).join(", ")}`,
      referencia: id,
      urlRetorno: `${site.url}/preview/catalogo/pedido/${id}`,
    });
    await anexarCobranca(id, { clienteId: cliente.id, cobrancaId: cobranca.id, urlFatura: cobranca.urlFatura });
    return NextResponse.json({ url: cobranca.urlFatura });
  } catch (erro) {
    if (cobranca) {
      /* A cobrança já existe no Asaas (e o Asaas já mandou a fatura por
         e-mail) — só `anexarCobranca` falhou. Marcar a venda "falhou" aqui
         seria dinheiro sem dono: o webhook casa por `externalReference` e só
         transiciona de "pendente"/"cancelado" para "pago", nunca de "falhou".
         Deixa a venda em "pendente" (o estado em que `criarVenda` já a
         gravou) e devolve a URL da fatura para quem está comprando —
         a venda continua encontrável pelo id quando o pagamento chegar. */
      // Só ids e código do erro no log — a mensagem do Drizzle pode trazer
      // nome/email/telefone embutidos na query.
      console.error(
        "[checkout] anexarCobranca falhou após cobrança criada no Asaas",
        id,
        cobranca.id,
        (erro as { code?: string })?.code ?? "sem_codigo",
      );
      return NextResponse.json({ url: cobranca.urlFatura });
    }
    await marcarFalha(id).catch((erroMarcar) => {
      console.error(
        "[checkout] marcarFalha falhou",
        id,
        erroMarcar instanceof Error ? erroMarcar.message : erroMarcar,
      );
    });
    console.error("[checkout] falha no Asaas", redigirCpfs(erro instanceof Error ? erro.message : String(erro)));
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
}
