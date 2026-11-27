/**
 * Dados FICTÍCIOS do Nexo Demo (2026-11-27, segunda versão: "mais realista
 * com relação ao Nexo real", os doze itens aprovados pelo Rodrigo).
 *
 * Tudo aqui é inventado: empresas, pessoas, itens, preços e números de
 * operação. Os domínios de e-mail terminam em .example, que não existe.
 * Mexeu em preço, fator ou catálogo? Os testes de lib/nexo-demo conferem as
 * contas ao centavo e avisam.
 */

export type Cotado = { fator: number; prazoDias: number };

export type ItemCatalogo = {
  id: string;
  nome: string;
  tipo: string;
  categoria: string;
  unidade: string;
  /** Preço de referência por unidade, em centavos: vira o "valor estimado" da RC. */
  referenciaCentavos: number;
  /** Palavras (sem acento) que a MIA usa para reconhecer o item num texto livre. */
  chaves: string[];
  /** Fornecedor da base que nunca responde convite quando este item abre a RC. */
  naoResponde: string;
  /** Preço (fator sobre a referência) e prazo de cada fornecedor da base; `null` = não trabalha com o item. */
  fornecedores: Record<string, Cotado | null>;
};

export type Fornecedor = {
  id: string;
  nome: string;
  email: string;
  pagamento: string;
  homologado: boolean;
  /** Quanto baixa numa rodada de negociação por e-mail (fração). */
  descontoRodada: number;
  /** Até quanto aceita num pedido de ajuste na seleção (em %). */
  tetoAjuste: number;
  /** Só para quem não está na base de preços do catálogo (busca com IA e fornecedor novo). */
  padrao?: Cotado;
};

/** A base homologada. */
export const FORNECEDORES: Fornecedor[] = [
  { id: "alfa", nome: "Alfa Suprimentos Ltda", email: "comercial@alfasuprimentos.example", pagamento: "28 dias", homologado: true, descontoRodada: 0.035, tetoAjuste: 3 },
  { id: "horizonte", nome: "Distribuidora Horizonte", email: "vendas@horizonte.example", pagamento: "30 dias", homologado: true, descontoRodada: 0.02, tetoAjuste: 2 },
  { id: "prisma", nome: "Prisma Comércio e Serviços", email: "cotacao@prisma.example", pagamento: "45 dias", homologado: true, descontoRodada: 0.055, tetoAjuste: 5 },
  { id: "nortesul", nome: "Norte Sul Atacado", email: "propostas@nortesul.example", pagamento: "21 dias", homologado: true, descontoRodada: 0.03, tetoAjuste: 4 },
];

/** O que a "Busca com IA" encontra fora da base: não homologados, cotam tudo. */
export const FORNECEDORES_IA: Fornecedor[] = [
  { id: "vertice", nome: "Vértice Distribuição", email: "contato@verticedistribuicao.example", pagamento: "30 dias", homologado: false, descontoRodada: 0.04, tetoAjuste: 3, padrao: { fator: 0.955, prazoDias: 16 } },
  { id: "lume", nome: "Lume Comercial", email: "vendas@lumecomercial.example", pagamento: "14 dias", homologado: false, descontoRodada: 0.025, tetoAjuste: 2, padrao: { fator: 1.012, prazoDias: 6 } },
];

/** Fornecedor que a pessoa cadastra na hora ("Novo fornecedor"): responde com este preço. */
export const PADRAO_NOVO: Cotado = { fator: 0.978, prazoDias: 11 };
export const NOVO = { pagamento: "30 dias", descontoRodada: 0.03, tetoAjuste: 3, maximo: 2 };

const c = (fator: number, prazoDias: number): Cotado => ({ fator, prazoDias });

export const CATALOGO: ItemCatalogo[] = [
  {
    id: "notebook",
    nome: "Notebook 14 polegadas, i7, 32 GB",
    tipo: "Ativo",
    categoria: "TI e Equipamentos",
    unidade: "UN",
    referenciaCentavos: 720_000,
    chaves: ["notebook", "laptop"],
    naoResponde: "nortesul",
    fornecedores: { alfa: c(0.968, 12), horizonte: c(0.942, 20), prisma: c(1.035, 7), nortesul: c(0.99, 15) },
  },
  {
    id: "monitor",
    nome: "Monitor LED 27 polegadas",
    tipo: "Ativo",
    categoria: "TI e Equipamentos",
    unidade: "UN",
    referenciaCentavos: 134_700,
    chaves: ["monitor"],
    naoResponde: "nortesul",
    fornecedores: { alfa: c(0.925, 10), horizonte: c(0.981, 18), prisma: null, nortesul: c(0.96, 14) },
  },
  {
    id: "cadeira",
    nome: "Cadeira ergonômica com apoio lombar",
    tipo: "Ativo",
    categoria: "Administrativo e Escritório",
    unidade: "UN",
    referenciaCentavos: 145_000,
    chaves: ["cadeira"],
    naoResponde: "prisma",
    fornecedores: { alfa: c(0.985, 10), horizonte: c(1.04, 6), prisma: c(0.97, 14), nortesul: c(0.931, 18) },
  },
  {
    id: "luva",
    nome: "Luva de segurança nitrílica (par)",
    tipo: "Uso e Consumo",
    categoria: "EPI e Segurança",
    unidade: "PAR",
    referenciaCentavos: 1_890,
    chaves: ["luva"],
    naoResponde: "horizonte",
    fornecedores: { alfa: c(1.02, 5), horizonte: c(0.99, 9), prisma: c(0.915, 12), nortesul: c(0.957, 8) },
  },
  {
    id: "toner",
    nome: "Toner para impressora laser, ciano",
    tipo: "Uso e Consumo",
    categoria: "Administrativo e Escritório",
    unidade: "UN",
    referenciaCentavos: 68_900,
    chaves: ["toner", "cartucho"],
    naoResponde: "nortesul",
    fornecedores: { alfa: c(0.949, 9), horizonte: c(0.992, 4), prisma: c(1.06, 11), nortesul: c(0.97, 10) },
  },
  {
    id: "papel",
    nome: "Papel sulfite A4, caixa com 10 resmas",
    tipo: "Uso e Consumo",
    categoria: "Administrativo e Escritório",
    unidade: "CX",
    referenciaCentavos: 28_900,
    chaves: ["papel", "sulfite", "resma"],
    naoResponde: "prisma",
    fornecedores: { alfa: c(0.962, 4), horizonte: c(0.938, 7), prisma: c(1.01, 9), nortesul: c(0.99, 5) },
  },
  {
    id: "licenca",
    nome: "Licença de software de design, plano anual",
    tipo: "Licença — Aquisição",
    categoria: "Software e Licenças",
    unidade: "UN",
    referenciaCentavos: 289_000,
    chaves: ["licenca", "software"],
    naoResponde: "alfa",
    fornecedores: { alfa: c(1, 3), horizonte: c(0.975, 2), prisma: c(0.948, 5), nortesul: null },
  },
  {
    id: "manutencao",
    nome: "Manutenção preventiva de empilhadeira",
    tipo: "Manutenção",
    categoria: "Manutenção",
    unidade: "SV",
    referenciaCentavos: 187_500,
    chaves: ["manutencao", "empilhadeira"],
    naoResponde: "horizonte",
    fornecedores: { alfa: c(0.99, 8), horizonte: c(0.97, 12), prisma: c(0.925, 15), nortesul: c(1.045, 5) },
  },
  {
    id: "frete",
    nome: "Frete rodoviário, carga fracionada, SP para MG",
    tipo: "Frete",
    categoria: "Fretes",
    unidade: "SV",
    referenciaCentavos: 264_000,
    chaves: ["frete", "transporte"],
    naoResponde: "prisma",
    fornecedores: { alfa: c(0.953, 4), horizonte: c(1.02, 3), prisma: c(0.98, 6), nortesul: c(0.934, 5) },
  },
];

export const URGENCIAS = ["Baixa", "Média", "Alta", "Crítica"] as const;
export const CENTROS = ["TI-001 · Tecnologia", "ADM-010 · Administrativo", "OPS-020 · Operações", "FAC-030 · Facilities", "LOG-040 · Logística"] as const;

/** Alçada de valor: quem aprova a seleção do vencedor, pelo total. */
export const ALCADAS = [
  { ateCentavos: 1_000_000, aprovador: "Gestor da área", faixa: "até R$ 10.000,00" },
  { ateCentavos: 10_000_000, aprovador: "Gerente de Compras", faixa: "de R$ 10.000,01 a R$ 100.000,00" },
  { ateCentavos: Number.POSITIVE_INFINITY, aprovador: "Diretoria Financeira", faixa: "acima de R$ 100.000,00" },
] as const;

/**
 * A operação que já existe quando a pessoa entra: cotações em estágios
 * diferentes (as do Nexo real têm essa cara: dias em aberto, urgência,
 * fornecedores e propostas). `ate` diz até onde a cotação andou; o estado de
 * cada uma é montado pelas MESMAS regras da demonstração (regras.ts).
 */
export type Semente = {
  numero: string;
  itens: { item: string; qtd: number }[];
  urgencia: (typeof URGENCIAS)[number];
  centro: (typeof CENTROS)[number];
  /** Dias até a data necessária (negativo = atrasada). */
  necessarioEm: number;
  solicitante: string;
  comprador: string;
  diasAberto: number;
  ate: "setup" | "convites" | "propostas" | "aprovacao" | "oc";
  negociada?: boolean;
};

export const SEMENTES: Semente[] = [
  { numero: "0138", itens: [{ item: "luva", qtd: 400 }], urgencia: "Crítica", centro: "OPS-020 · Operações", necessarioEm: 3, solicitante: "Rafael Antunes", comprador: "Marina Prado", diasAberto: 9, ate: "convites" },
  { numero: "0141", itens: [{ item: "frete", qtd: 6 }], urgencia: "Alta", centro: "LOG-040 · Logística", necessarioEm: 6, solicitante: "Bianca Rezende", comprador: "Caio Teixeira", diasAberto: 2, ate: "setup" },
  { numero: "0137", itens: [{ item: "cadeira", qtd: 24 }, { item: "monitor", qtd: 24 }], urgencia: "Média", centro: "FAC-030 · Facilities", necessarioEm: 18, solicitante: "Lívia Moraes", comprador: "Marina Prado", diasAberto: 6, ate: "propostas" },
  { numero: "0135", itens: [{ item: "licenca", qtd: 12 }], urgencia: "Média", centro: "TI-001 · Tecnologia", necessarioEm: 12, solicitante: "Otávio Brandão", comprador: "Helena Duarte", diasAberto: 11, ate: "propostas", negociada: true },
  { numero: "0133", itens: [{ item: "manutencao", qtd: 4 }], urgencia: "Alta", centro: "OPS-020 · Operações", necessarioEm: 5, solicitante: "Rafael Antunes", comprador: "Caio Teixeira", diasAberto: 13, ate: "aprovacao", negociada: true },
  { numero: "0130", itens: [{ item: "papel", qtd: 60 }, { item: "toner", qtd: 18 }], urgencia: "Baixa", centro: "ADM-010 · Administrativo", necessarioEm: 20, solicitante: "Sueli Nogueira", comprador: "Helena Duarte", diasAberto: 15, ate: "oc" },
  { numero: "0128", itens: [{ item: "notebook", qtd: 35 }], urgencia: "Alta", centro: "TI-001 · Tecnologia", necessarioEm: 9, solicitante: "Otávio Brandão", comprador: "Marina Prado", diasAberto: 19, ate: "oc", negociada: true },
  { numero: "0126", itens: [{ item: "toner", qtd: 30 }], urgencia: "Baixa", centro: "ADM-010 · Administrativo", necessarioEm: 25, solicitante: "Sueli Nogueira", comprador: "Caio Teixeira", diasAberto: 4, ate: "convites" },
];

/** RCs que ainda não viraram cotação: duas esperando gestor e uma que a MIA devolveu. */
export const RCS_NA_FILA = [
  { numero: "0143", itens: [{ item: "papel", qtd: 40 }], urgencia: "Baixa", centro: "ADM-010 · Administrativo", solicitante: "Sueli Nogueira", situacao: "aguardando" },
  { numero: "0140", itens: [{ item: "manutencao", qtd: 2 }], urgencia: "Média", centro: "LOG-040 · Logística", solicitante: "Bianca Rezende", situacao: "aguardando" },
  { numero: "0139", descricao: "Material para o setor", urgencia: "Média", centro: "FAC-030 · Facilities", solicitante: "Lívia Moraes", situacao: "devolvida" },
] as const;

/** Spend dos últimos 12 meses (centavos). */
export const SPEND = {
  categorias: [
    { nome: "TI e Equipamentos", centavos: 184_300_000 },
    { nome: "Manutenção", centavos: 126_750_000 },
    { nome: "Administrativo e Escritório", centavos: 73_420_000 },
    { nome: "Software e Licenças", centavos: 58_900_000 },
    { nome: "EPI e Segurança", centavos: 41_980_000 },
    { nome: "Fretes", centavos: 28_610_000 },
  ],
  meses: [
    ["dez", 38_200_000],
    ["jan", 35_900_000],
    ["fev", 41_300_000],
    ["mar", 44_800_000],
    ["abr", 39_600_000],
    ["mai", 47_100_000],
    ["jun", 42_500_000],
    ["jul", 45_900_000],
    ["ago", 49_300_000],
    ["set", 43_700_000],
    ["out", 44_200_000],
    ["nov", 41_460_000],
  ] as [string, number][],
  fornecedores: [
    { nome: "Alfa Suprimentos Ltda", centavos: 96_400_000, pedidos: 214 },
    { nome: "Prisma Comércio e Serviços", centavos: 81_250_000, pedidos: 163 },
    { nome: "Distribuidora Horizonte", centavos: 74_900_000, pedidos: 188 },
    { nome: "Norte Sul Atacado", centavos: 52_300_000, pedidos: 141 },
    { nome: "Outros 308 fornecedores", centavos: 209_110_000, pedidos: 1_962 },
  ],
  fornecedoresAtivos: 312,
  tailSpend: 0.184,
  maverick: 0.062,
} as const;

/** Sala de comando. */
export const SALA = {
  savingAnoCentavos: 41_230_000,
  slaDias: 2.4,
  funil: [
    ["RCs abertas", 148],
    ["Aprovadas pelo gestor", 131],
    ["Cotadas", 119],
    ["OCs geradas", 104],
  ] as [string, number][],
  compradores: [
    { nome: "Marina Prado", carteira: "TI, Facilities e EPI", saving: 0.071 },
    { nome: "Caio Teixeira", carteira: "Logística e Manutenção", saving: 0.052 },
    { nome: "Helena Duarte", carteira: "Administrativo e Software", saving: 0.064 },
  ],
} as const;
