import { NextResponse } from "next/server";
import { catalogo, site } from "@/lib/content";
import { calcularCarrinho, PRECO_TESTE_CENTAVOS } from "@/lib/catalogo/preco";
import { validarPedido, vencimentoEm } from "@/lib/catalogo/pedido";
import { anexarCobranca, criarVenda, marcarFalha } from "@/lib/catalogo/vendas";
import { criarCliente, criarCobranca, redigirCpfs } from "@/lib/asaas/cliente";

/**
 * Checkout da PRÉVIA do catálogo.
 *
 * Mora dentro de /preview/catalogo de propósito: é o CAMINHO que fixa o modo
 * "teste" e o preço de R$ 5 — nada do que o navegador manda escolhe isso — e
 * o Basic Auth do middleware cobre esta rota junto com a página. Na
 * publicação, /cursos ganha a sua rota com o preço real.
 *
 * Ordem: grava a venda ANTES de falar com o Asaas. Se o Asaas falhar, a venda
 * fica "falhou" e o painel mostra a tentativa; o contrário (cobrança criada
 * sem venda gravada) seria dinheiro sem dono.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const validos = catalogo.cursos.map((c) => c.slug);
  const validacao = validarPedido(payload, validos);
  if (!validacao.ok) return NextResponse.json({ error: validacao.motivo }, { status: 422 });
  const { nome, email, telefone, cpf, slugs } = validacao.dados;

  const carrinho = calcularCarrinho(slugs, validos, PRECO_TESTE_CENTAVOS);
  const itens = carrinho.itens.map((item) => ({
    ...item,
    nome: catalogo.cursos.find((c) => c.slug === item.slug)!.nome,
  }));

  let id: string;
  try {
    id = await criarVenda({ nome, email, telefone, itens, totalCentavos: carrinho.totalCentavos, modo: "teste" });
  } catch (erro) {
    console.error("[checkout] falha ao gravar a venda", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }

  try {
    const cliente = await criarCliente({ nome, email, cpf, telefone });
    const cobranca = await criarCobranca({
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
    await marcarFalha(id).catch(() => {});
    console.error("[checkout] falha no Asaas", redigirCpfs(erro instanceof Error ? erro.message : String(erro)));
    return NextResponse.json({ error: "falha" }, { status: 502 });
  }
}
