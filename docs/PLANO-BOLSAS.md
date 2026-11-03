# Desafio das 50 Bolsas: plano de implementação

Fonte: "Desafio das 50 Bolsas: como funciona a seleção" (Vinícius Ferreira, 2026-11-02).
Decisões do Rodrigo em 2026-11-03:

1. Seleção **por mérito**, nas 4 etapas do documento (não os 50 primeiros).
2. O bolsista **cria a assinatura ao aceitar o termo**, com a primeira cobrança
   no fim dos 30 dias. A conversão fica automática; o aceite pede CPF (vai
   direto ao Asaas, como na /cursos).
3. O preço de fundador, **R$ 29,90 por mês, vale por 12 meses**; depois, o
   preço público (hoje R$ 49,90). Vale para bolsistas e para os não
   selecionados que assinarem dentro da janela da oferta.
4. Endereço: **`/bolsas`** ("Prova Real" era nome de trabalho).

## Calendário

| Data | Marco |
|---|---|
| 05/11 a 11/11 | Inscrições (a página fecha sozinha às 23h59 de 11/11, horário de SP) |
| 05/11 a 15/11 | Vídeos de entrada, pelo link pessoal |
| 16 e 17/11 | Banca |
| 17/11, 19h | Resultado ao vivo e e-mails |
| 18/11 a 17/12 | Bolsa |
| 17/12 a 20/12 | Encerramento e oferta final |

## Fase 0: fora do código, antes de abrir

- Regulamento validado por advogado (o rascunho está em `bolsas.regulamento`, content.ts).
- Pecege confirma: 50 acessos de cortesia, preço de fundador e uso da marca.
- Conferir o plano do Resend: ~500 confirmações em uma semana e ~500 resultados na mesma hora.

## Fase 1: página e inscrição (até 05/11)

- `/bolsas`: capa, o que se ganha e o que se entrega, quem pode, cronograma,
  critérios e pesos (publicados: é o que sustenta o "processo seletivo"),
  roteiro do vídeo, formulário, perguntas, link do regulamento.
- `/bolsas/regulamento`.
- Formulário: nome, e-mail, WhatsApp, cargo, nível (alimenta as cotas),
  empresa, área, tamanho do time, Instagram e/ou LinkedIn, o problema (até
  600 caracteres) e quatro caixas: regulamento e 18 anos (obrigatória),
  ciência do uso na seleção (obrigatória), contato comercial depois do
  desafio (opcional), uso de nome e imagem (opcional).
- Tabela `bolsas_inscricoes` (migração 0015, aditiva). Uma inscrição por
  e-mail. Sem CPF.
- `POST /api/bolsas`: isca, limite por endereço, validação no servidor,
  e-mail de confirmação com o regulamento e o link pessoal do vídeo.
- `/admin/bolsas`: totais (inscritos, com vídeo, por dia, por área, por
  nível) e CSV para a banca com as colunas de nota vazias.

## Fase 2: vídeo (05 a 15/11)

- `/bolsas/video/[token]` (noindex): a pessoa cola o link do vídeo (Instagram,
  LinkedIn, YouTube ou Google Drive) até 23h59 de 15/11. Pode trocar o link
  até o prazo.
- Lembrete único em 13/11 para quem ainda não mandou (botão no /admin/bolsas).

## Fase 3: banca e resultado (16 e 17/11)

- A banca preenche o CSV (notas dos dois avaliadores por critério, frase de retorno).
- Importação do CSV no /admin/bolsas; o código aplica, com testes: média dos
  dois, aviso de divergência acima de 20 pontos, cotas 30/10/10, nota mínima
  60, no máximo 2 por empresa, desempate por clareza e depois data de
  inscrição, 20 na lista de espera.
- Botão "enviar resultado" com prévia e envio de teste: selecionados (termo +
  aceite em 48 h), lista de espera (posição), não selecionados (nota por
  critério, retorno e link do preço de fundador, válido por 7 dias).

## Fase 4: aceite e preço de fundador (a partir de 17/11)

- `/bolsas/aceite/[token]`: termo de adesão + formulário de assinatura (CPF).
  Cria a assinatura no Asaas a R$ 29,90 com a primeira cobrança em 18/12.
  O Pecege libera o acesso da bolsa pelo /admin, como hoje.
- `/bolsas/fundador/[token]`: mesmo formulário, R$ 29,90 com cobrança
  imediata, aberto por 7 dias para não selecionados.
- `assinaturas` ganha `origem` e `preco_fundador_ate`. O valor é decidido no
  servidor pelo token. Depois da 12ª mensalidade paga, o webhook passa a
  assinatura para o preço público (`PUT /subscriptions/{id}`), com aviso
  por e-mail antes.
- A receita recorrente do /admin/cursos passa a somar o valor de cada
  assinatura em vez de ativos × R$ 49,90.

## Fase 5: durante a bolsa

Acompanhamento dos posts e perda da vaga (01/12) na planilha do time. A lista
de espera é chamada pelo /admin/bolsas (gera o aceite para o próximo).
