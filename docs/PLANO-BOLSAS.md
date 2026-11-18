# Desafio Prova Real (/bolsas): plano

Refeito em 2026-11-18. Fonte: o mapa da campanha ("Desafio PROVA REAL", HTML e
mapa mental) e as respostas do Rodrigo no mesmo dia: o mapa substitui o
"Desafio das 50 Bolsas" por inteiro; **50 bolsas**; os vídeos da campanha
(chamada e instruções) ainda serão produzidos; o preço de fundador vale **12
meses**; o perfil da Academy é **@iagenticsacademy**.

O plano anterior (Desafio das 50 Bolsas, 2026-11-03, com vídeo de entrada,
banca de dois avaliadores, cotas 30/10/10 e quatro posts semanais) está no git.
A URL `/bolsas` ficou, porque já foi divulgada e indexada.

## Calendário

| Data | Marco |
|---|---|
| 23/11 | Início da campanha (WhatsApp, Instagram, LinkedIn) |
| 23/11 a 05/12 | Inscrições, até 23h59 de 05/12 (a página fecha sozinha; o prazo não se estende, por credibilidade) |
| 24/12 | Divulgação dos vencedores, por e-mail e post |
| até 10/01/2027 | E-mail com o voucher exclusivo (R$ 29,90 por mês, 12 meses, válido por 15 dias) para os não selecionados |
| 02/01 a 02/02/2027 | Cadastro dos vencedores e os 30 dias de bolsa; depois, voucher de assinatura de R$ 29,90 |

## Metas do mapa

400 inscrições; 10% de conversão em assinatura (40); depoimentos reais para as
redes (@iagenticsacademy e @iagentics); receita das assinaturas reinvestida em
divulgação (tráfego pago, "Campanha 2").

## Seleção

Quatro critérios: clareza do problema e entendimento da solução em 30 dias
(pela resposta da inscrição), seguir a @iagenticsacademy e publicar o post
"Eu estou participando do Desafio Prova Real" (pelo perfil público). Os 50 de
melhor avaliação recebem a bolsa; empate pela data de inscrição (decisão a
validar com o advogado).

## Feito (2026-11-18)

Página `/bolsas`, `/bolsas/regulamento` (rascunho), formulário (nome, empresa,
e-mail, WhatsApp, Instagram e/ou LinkedIn, problema, cinco caixas),
`POST /api/bolsas`, e-mail de confirmação, `/admin/bolsas` com CSV para a
avaliação, migração 0016, datas e textos, testes.

## Falta

1. **Fase 0 (fora do código)**: regulamento validado por advogado; Pecege
   confirma 50 acessos, preço de fundador e uso da marca; plano do Resend para
   os e-mails de confirmação e do resultado.
2. **O post editável** (arquivo da arte): preencher `criterios.postEditavel`
   em content.ts; o e-mail de confirmação passa a levar o link.
3. **Os dois vídeos** (chamada e instruções) e o **grupo de WhatsApp**.
4. **Importar a avaliação e enviar o resultado** (até 24/12): CSV preenchido de
   volta no /admin/bolsas, status `selecionado`/`nao_selecionado`, e-mails do
   resultado (selecionados e não selecionados).
5. **Voucher de R$ 29,90**: página `/bolsas/voucher/[token]` com o mesmo
   formulário da /cursos, valor decidido no servidor pelo token, assinatura
   criada no Asaas a R$ 29,90 e, depois da 12ª mensalidade, passagem para o
   preço público (`PUT /subscriptions/{id}`) com aviso antes. `assinaturas`
   ganha `origem` e `preco_fundador_ate`. A receita recorrente do
   /admin/cursos passa a somar o valor de cada assinatura. **Prazo real:
   antes de 24/12**, quando os vouchers saem.
6. **Pesquisa** com os inscritos (o mapa pede; o que perguntar ainda não foi
   definido) e a **análise crítica** do fechamento (inscrições, assinaturas,
   seguidores, depoimentos, faturamento, despesas, respondentes).
