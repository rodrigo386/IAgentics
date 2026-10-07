---
titulo: "O que é mapa de cotação — e por que o menor preço nem sempre ganha"
descricao: "Mapa de cotação é a tabela que põe lado a lado as propostas dos fornecedores para os mesmos itens. O que vai nele, como comparar quem não cotou tudo e onde ele costuma errar."
slug: "o-que-e-mapa-de-cotacao"
data: 2026-10-07
autor: "IAgentics"
categoria: "Processo de Compras"
produto: "nexo"
status: "rascunho"
---

**Mapa de cotação** — também chamado de mapa comparativo ou quadro comparativo
de preços — é a tabela que coloca lado a lado as propostas de vários
fornecedores para os mesmos itens, com o objetivo de decidir de quem comprar.
Cada linha é um item da requisição; cada coluna é um fornecedor; cada célula é
o que aquele fornecedor ofereceu para aquele item.

Dito assim parece uma planilha qualquer. Não é. O mapa é o documento em que a
decisão de compra fica visível: quem foi convidado, quem respondeu, quanto cada
um pediu e por que um deles ganhou. É ele que o aprovador olha antes de
assinar, e é ele que a auditoria pede seis meses depois.

O exemplo abaixo mostra o mapa de uma compra pequena sendo montado, passo a
passo.

<!-- explicador:mapa-de-cotacao -->

## O que vai num mapa de cotação

O mínimo é o que aparece no exemplo: os itens, as quantidades e o preço
unitário de cada fornecedor. Na prática, um mapa que serve para decidir traz
também tudo o que muda o custo real ou o risco da compra:

- **Prazo de entrega** de cada fornecedor, por item quando for o caso.
- **Condição de pagamento** — 28 dias e à vista não são o mesmo preço.
- **Frete**: incluso ou não, e em que modalidade (CIF ou FOB).
- **Impostos**: se o preço informado já os inclui, e o NCM do item quando a
  tributação muda com ele.
- **Validade da proposta**, para o mapa não ser aprovado com preço vencido.
- **Itens não cotados**, marcados como tal — e não como zero.

E fecha com duas coisas que não são colunas: **a escolha** e **o motivo dela**.

## Menor total ou melhor preço por item?

É a pergunta que o exemplo responde. Dos três fornecedores, só um cotou todos
os itens. Comparar os três pelo total seria comparar compras diferentes: quem
não cotou o dock parece mais barato só porque a conta dele tem um item a menos.

Há duas leituras honestas do mesmo mapa:

1. **Menor total entre os fornecedores completos.** Só o fornecedor C cotou
   tudo: R$ 500.280. Um pedido, um fornecedor, uma entrega.
2. **Melhor preço por item.** Notebook do A, monitor do C, dock do B:
   R$ 485.280 — R$ 15.000 a menos.

A segunda é mais barata e não é automaticamente melhor. Dividir a compra
significa três pedidos, três entregas, três notas e três relacionamentos para
gerenciar, e às vezes um pedido mínimo ou um frete que come a diferença. O
mapa não decide isso sozinho; ele deixa a conta à vista para que alguém decida
sabendo o que está trocando por quê.

Por isso o último passo do exemplo é o prazo. O monitor mais barato chega em
25 dias. Se a requisição precisa dele em 30, cabe; se precisa em 15, o preço
mais baixo é irrelevante. O mapa bom tem as duas informações na mesma tela.

## Onde o mapa costuma dar errado

Quase nunca na conta. O erro mora antes dela, na hora de colocar propostas
diferentes na mesma base:

- **Bases que não se comparam.** Um fornecedor manda preço com imposto, outro
  sem; um inclui frete, outro não. Na tabela, os números ficam lado a lado e
  parecem comparáveis.
- **Unidades diferentes.** Caixa com 12 contra unidade, quilo contra tonelada.
  Um erro de unidade inverte o vencedor sem ninguém perceber.
- **Proposta parcial tratada como completa.** É o caso do exemplo, e é o mais
  comum: o total de quem cotou menos itens parece imbatível.
- **Copiar e colar.** As propostas chegam em PDF, e-mail e planilhas com
  formatos diferentes, e alguém redigita tudo numa planilha nova. Cada
  redigitação é uma chance de trocar uma casa decimal.
- **Motivo que ninguém escreveu.** A escolha foi certa, mas seis meses depois
  ninguém lembra por que o fornecedor mais caro ganhou aquele item. Para a
  auditoria, decisão sem motivo registrado é decisão sem justificativa.

## Mapa de cotação e aprovação

O mapa é também o que define quem precisa aprovar. Em boa parte das empresas a
alçada depende do valor da seleção: até certo limite, o próprio gestor de
Compras aprova; acima, a decisão sobe para a diretoria. Quanto mais claro o
mapa — o total, a divisão entre fornecedores, o motivo de cada escolha —, mais
rápido essa aprovação sai, porque o aprovador não precisa reconstruir a
análise para confiar nela.

## O que a IA já faz bem no mapa

A parte mecânica do mapa é exatamente a que a IA faz melhor que uma pessoa às
sete da noite:

- **Normalizar as propostas.** Ler o PDF, o e-mail e a planilha de cada
  fornecedor e colocar tudo na mesma base — mesma unidade, imposto e frete
  explícitos.
- **Marcar o que não foi cotado** em vez de deixar a célula vazia virar zero.
- **Comparar item a item e sugerir a combinação**, mostrando lado a lado o
  menor total com um fornecedor e o melhor preço por item, com a diferença
  entre os dois.

O que continua com o comprador é a decisão: aceitar ou não a divisão, pesar
prazo, histórico e relacionamento — e registrar o motivo. É a mesma divisão de
trabalho que aparece nos [sete passos do processo de
compras](/artigos/processo-de-compras-sete-passos-ia): a máquina monta e
confere, a pessoa decide e responde pela decisão.

Se você ainda monta o mapa à mão e quer acelerar a análise, o [prompt de mapa
comparativo](/artigos/prompts-para-compras) é um começo — com a ressalva, que
vale para qualquer prompt, de não colar ali dado que não pode sair da empresa.

## Perguntas rápidas

**Quantas cotações um mapa precisa ter?** Não há número mágico. Muitas
empresas adotam três como regra interna, com exceção justificada quando o
mercado não tem três fornecedores capazes. O que importa é a regra existir e a
exceção ficar registrada.

**Mapa de cotação e mapa comparativo são a mesma coisa?** Sim. Os nomes variam
de empresa para empresa — mapa de cotação, mapa comparativo, quadro
comparativo de preços —, e o documento é o mesmo.

**Posso escolher um fornecedor que não é o mais barato?** Pode, e muitas vezes
deve. O mapa existe para que essa escolha seja consciente e explicada, não
para obrigar a escolher o menor número.
