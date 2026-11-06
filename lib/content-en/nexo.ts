import type * as pt from "@/lib/content";
import type { Traducao } from "@/lib/i18n";

/** English version of `nexo` (lib/content.ts). Same shape; see lib/i18n.ts. */
export const nexo: Traducao<typeof pt.nexo> = {
  kicker: "IAgentics Nexo",
  assurance: "Your data stays protected on your company's own server.",
  platforms: [
    { name: "Desk Manager Partners", src: "/partner-deskmanager.png", w: 1057, h: 347 },
  ],
  certificacoes: {
    selos: [
      {
        name: "Certified Company ISO/IEC 27001 · QMS Certification",
        src: "/selo-iso27001-v1.jpg",
        w: 800,
        h: 1080,
      },
      {
        name: "ITIL Accredited Tool Vendor Assessor · by PeopleCert",
        src: "/selo-itil-v1.jpg",
        w: 587,
        h: 307,
      },
    ],
  },
  product: {
    src: "/nexo-deskmanager.jpg",
    alt: "Nexo screen open inside Desk Manager, showing a new purchase requisition and the agents in the side navigation",
    caption: "Nexo running inside Desk Manager",
  },
  fluxo: {
    titulo: "The Procurement process in Nexo",
    lead: "From requisition to purchase order in the ERP: seven steps run by Nexo's agents.",
    passos: [
      {
        n: "01",
        nome: "Purchase requisition",
        texto: "The MIA chatbot opens the requisition from a plain-language description, and the AI checks the data before sending it to Procurement.",
        src: "/nexo-print-rc-v2.png", w: 1917, h: 1078, inicio: 5.6,
      },
      {
        n: "02",
        nome: "Triage and approval",
        texto: "The AI classifies the request by category, sets the approval chain by spending authority and audits the requisition on its own.",
        src: "/nexo-fluxo-triagem-v1.png", w: 1917, h: 1078, inicio: 21.6,
      },
      {
        n: "03",
        nome: "RFQ: supplier selection",
        texto: "The AI searches the registered supplier base and finds new suppliers online, then sends out the request for quotation.",
        src: "/nexo-print-rfp-v2.png", w: 1917, h: 1078, inicio: 37.6,
      },
      {
        n: "04",
        nome: "Bids through a web form",
        texto: "Invitation by link, no password and no account: the Supplier Portal receives the bid and its attachments.",
        src: "/nexo-fluxo-portal-v1.jpg", w: 1568, h: 688, inicio: 46.6,
      },
      {
        n: "05",
        nome: "AI-assisted negotiation",
        texto: "The AI reads the attachments, builds the bid comparison with scores and suggests the next negotiation message.",
        src: "/nexo-fluxo-mapa-v1.jpg", w: 1568, h: 688, inicio: 55.6,
      },
      {
        n: "06",
        nome: "Final selection and approval",
        texto: "The winning bid is approved with the approver's name and reason recorded, and the audit trail stays in the history.",
        src: "/nexo-fluxo-aprovacao-v1.jpg", w: 1568, h: 688, inicio: 65.6,
      },
      {
        n: "07",
        nome: "Purchase order in the ERP",
        texto: "The PO is created automatically: requisition, RFQ and winning bid consolidated, ready for the client's ERP.",
        src: "/nexo-fluxo-oc-v1.jpg", w: 1568, h: 688, inicio: 72.6,
      },
    ],
    video: {
      legenda: "Step by step · 1:29 · in Portuguese · 100 laptops for the IT team, from the chat with MIA to the purchase order",
      irPara: "Jump to:",
      src: "/nexo/nexo-passo-a-passo.mp4",
      label: "Step-by-step video of Nexo Procurement: requisition, triage, manager, quotation, bid comparison, approval and purchase order.",
    },
  },
  controlesVideo: {
    pausar: "Pause video",
    continuar: "Resume video",
    ligarSom: "Watch from the start with sound",
    desligarSom: "Turn sound off",
  },
};

/** English version of `nexoPage` (lib/content.ts). Same shape; see lib/i18n.ts. */
export const nexoPage: Traducao<typeof pt.nexoPage> = {
  videoComercial: {
    eyebrow: "Nexo Procurement in 1 minute",
    titulo: "Request. Quote. Approve.",
    lead: "The whole purchase in one minute: the request made in a chat with MIA, the quotation answered as easily as in Excel and the approval routed by value threshold. Nobody approves their own request.",
    src: "/nexo/nexo-comercial.mp4",
    label: "One-minute commercial video of Nexo Procurement, in Portuguese.",
  },
  differentiators: {
    title: "What makes Nexo different",
    items: [
      {
        title: "Runs inside your environment",
        body: "The agents operate within the Desk Manager your company already uses. Your team has no new system to learn.",
      },
      {
        title: "Sensitive data stays put",
        body: "Information remains on your company's server throughout the agents' operation.",
      },
      {
        title: "Connects to what you already have",
        body: "Integrates with your current ERP and e-procurement tools, without rebuilding your supply operation.",
      },
      {
        title: "Built for Procurement",
        body: "Designed for requisitions, quotations, spend, suppliers and contracts. Built for Procurement work only.",
      },
    ],
  },

  steps: {
    title: "How we get started",
    lead: "From the first conversation to live operation in four steps.",
    closing: "Weeks, not years. No rebuild of your company's operation.",
    items: [
      { name: "Assessment", body: "We map where time is lost today." },
      { name: "Configuration", body: "We design agents tailored to you." },
      { name: "Integration", body: "We connect them to your current systems." },
      { name: "Operation", body: "The agents take over and start generating data." },
    ],
  },

  results: {
    title: "Results in production",
    items: [
      {
        metric: "−50%",
        unit: "in contract cycle time",
        client: "Brazilian chemical manufacturer",
        area: "Procurement and Legal",
        before: "Manual review of contracts with hundreds of suppliers.",
        after:
          "The agent reviews and flags clauses, assesses risk against internal policy and suggests improvements.",
      },
      {
        metric: "−90%",
        unit: "of time spent on spend analysis",
        client: "Brazilian food manufacturer",
        area: "Procurement",
        before: "A monthly report reviewing more than 10,000 spreadsheet rows.",
        after:
          "The agent classifies each row by category using the UNSPSC taxonomy and learns from the team's feedback.",
      },
    ],
  },

  hero: {
    headline: ["Nexo orchestrates", "all of spend management"],
    subtext:
      "Nine modules of AI agents, from Procurement to Budgeting, running inside your company's environment, with governance, security and data management.",
    platform: "Embedded delivery, integrated with the client's ERP. ISO/IEC 27001 certified.",
    ctaSecundario: "See it in action",
    grafoAlt: "Nexo, the orchestrator, connected to nine modules: Procurement, Asset Management, Logistics Spend, Invoice-Based Spend, Accounts Payable, Retail Price Benchmark, Budgeting, Contracts and Supplier Qualification.",
  },

  orquestrador: {
    eyebrow: "The platform",
    titulo: ["Nexo orchestrates", "all of spend management"],
    centro: { nome: "Nexo", papel: "Orchestrator" },
    modulos: [
      { id: "compras", nome: "Procurement", href: "#fluxo-compras" },
      { id: "ativos", nome: "Asset Management" },
      { id: "logistico", nome: "Logistics Spend Optimization", href: "#na-pratica-logistico" },
      { id: "nf", nome: "Spend from Invoice Data", href: "#na-pratica-nf" },
      { id: "contas", nome: "Accounts Payable" },
      { id: "varejo", nome: "Retail Price Benchmark", href: "#na-pratica-varejo" },
      { id: "orcamento", nome: "Budgeting", href: "#na-pratica-orcamento" },
      { id: "contratos", nome: "Contracts" },
      { id: "homologacao", nome: "Supplier Qualification" },
    ],
  },

  camadas: {
    eyebrow: "How Nexo is built",
    titulo: "Three layers",
    itens: [
      {
        numero: "Layer 1",
        nome: "Agents",
        texto:
          "Nine modules of AI agents, one for each front of spend management, from Procurement to Budgeting. In every one, AI supports people throughout the process: the decision stays with a person.",
        modulos: [
          { nome: "Procurement", papel: "Requisitions, quotations, contracts, supplier qualification and spend analysis" },
          { nome: "Asset Management" },
          { nome: "Logistics Spend Optimization", papel: "Routes, vehicle and transport mode optimized per load" },
          { nome: "Spend from Invoice Data", papel: "Every invoice becomes procurement intelligence" },
          { nome: "Accounts Payable" },
          { nome: "Retail Price Benchmark", papel: "Real market reference prices per product" },
          { nome: "Budgeting", papel: "A single source, with no parallel spreadsheets" },
          { nome: "Contracts", papel: "End-to-end contract lifecycle" },
          { nome: "Supplier Qualification", papel: "Supplier onboarding and qualification" },
        ],
      },
      {
        numero: "Layer 2",
        nome: "Orchestration",
        texto: "Anthropic reasoning engine. Nexo uses Claude to read, classify and recommend, while the decision stays with a person.",
        selo: "Claude · Anthropic",
      },
      {
        numero: "Layer 3",
        nome: "Client environment",
        texto: "Embedded delivery, integrated with the client's ERP. ISO/IEC 27001 certified.",
        placas: [
          { src: "/partner-microsoft-v2.png", alt: "Microsoft AI Cloud Partner", w: 888, h: 182 },
          { src: "/partner-deskmanager.png", alt: "Desk Manager", w: 640, h: 200 },
          { src: "/selo-iso27001-v1.jpg", alt: "ISO/IEC 27001 certification", w: 400, h: 400 },
        ],
      },
    ],
  },

  naPratica: {
    eyebrow: "In practice",
    itens: [
      {
        id: "logistico",
        nome: ["Nexo", "Logistics Spend"],
        passos: [
          { nome: "Takes in the load data", texto: "Orders, weights, cities and the SLA for each delivery" },
          { nome: "Optimizes routes, vehicle and mode", texto: "More than 900 scenarios of route, load factor and FTL vs. LTL calculated in minutes" },
          { nome: "Delivers the most profitable load", texto: "Optimizing freight cost for your company" },
        ],
        prova: {
          rotulo: "Savings through optimization",
          numero: "+900",
          unidade: "scenarios compared per dispatch cutoff",
          texto: "The engine picks the scenario with the lowest total cost and highest margin, within the SLA and any constraints the client adds.",
        },
        video: {
          src: "/nexo/nexo-logistico.mp4",
          label: "Logistics Spend video: the orders for the cutoff come in, the engine compares more than 900 scenarios and draws the route for Load 22, and the FTL loads appear with the load factor of each one.",
          legenda: "Logistics Spend in 22 seconds",
        },
        telas: [
          { src: "/nexo/logistico-rota.jpg", alt: "Network drawn by the engine: optimized route with 6 stops and 3,107 km", w: 1800, h: 1154, legenda: "Optimized route · 6 stops · 3,107 km" },
          { src: "/nexo/logistico-ocupacao.jpg", alt: "Chart of FTL load factor, averaging 86.6%", w: 1800, h: 1718, legenda: "FTL load factor" },
        ],
      },
      {
        id: "varejo",
        nome: ["Nexo", "Retail Price Benchmarking"],
        passos: [
          { nome: "Takes in the purchase price", texto: "SKUs, manufacturers and the client's acquisition cost" },
          { nome: "Scans the major e-commerce sites", texto: "Collects offers from established stores and calculates the lowest, median and highest price per product" },
          { nome: "Shows where the gain is", texto: "Compares market prices with the purchase price and reveals margin and opportunities" },
        ],
        prova: {
          rotulo: "Savings identified",
          numero: "28%",
          unidade: "price dispersion for the same product",
          texto: "The engine shows the real market reference and how much the client can save per SKU. Built for retailers, distributors and e-commerce businesses.",
        },
        video: {
          src: "/nexo/nexo-varejo.mp4",
          label: "Retail Price Benchmarking video: the purchase price comes in, the engine scans the offers and shows the lowest, median and highest price, then points out the possible savings and the 28% dispersion.",
          legenda: "Retail Price Benchmarking in 22 seconds",
        },
        telas: [
          { src: "/nexo/varejo-painel.jpg", alt: "Benchmarking dashboard with the lowest, median and highest price per product", w: 1800, h: 925, legenda: "Benchmarking dashboard · lowest, median and highest price" },
          { src: "/nexo/varejo-faixa.jpg", alt: "Price range per product, from the lowest to the highest found", w: 1800, h: 754, legenda: "Price range per product" },
        ],
      },
      {
        id: "nf",
        nome: ["Nexo", "Invoice-Based Spend"],
        passos: [
          { nome: "Takes in the invoice", texto: "Reads the invoice data and records supplier, items and amounts in the database" },
          { nome: "Classifies every expense", texto: "Assigns category, subcategory, country and purchase frequency automatically" },
          { nome: "Generates savings insights", texto: "Detects consolidation and recurrence and recommends prioritized sourcing actions" },
        ],
        prova: {
          rotulo: "Opportunity mapped",
          numero: "$216k",
          unidade: "of addressable spend across 6 consolidation opportunities",
          texto: "The agent turns invoices into procurement intelligence: it consolidates suppliers, formalizes contracts and lowers process cost.",
        },
        video: {
          src: "/nexo/nexo-spend-nf.mp4",
          label: "Invoice-Based Spend video: the invoice is read, each expense is classified, sourcing recommendations appear along with the $216k total in opportunities.",
          legenda: "Invoice-Based Spend in 22 seconds",
        },
        telas: [
          { src: "/nexo/nf-visao-geral.jpg", alt: "Overview of spend by country, category and supplier", w: 1800, h: 793, legenda: "Overview · spend by country, category and supplier" },
          { src: "/nexo/nf-recomendacoes.jpg", alt: "Sourcing recommendations ranked by opportunity score", w: 1800, h: 800, legenda: "Sourcing recommendations by score" },
        ],
      },
      {
        id: "orcamento",
        nome: ["Nexo", "Budgeting"],
        passos: [
          { nome: "Organizes the annual cycle", texto: "Structured input by department, with deadlines, versions and approvals in one place" },
          { nome: "Removes spreadsheets", texto: "Automatic consolidation replaces spreadsheets and the finance team's manual rework" },
          { nome: "Gives leadership visibility", texto: "Dashboards with AI-driven insights and analytics: variances, trends and recommendations" },
        ],
        prova: {
          rotulo: "Single source",
          numero: "100%",
          unidade: "of the budget consolidated with no parallel spreadsheets",
          texto: "The AI reads the consolidated budget and delivers insights and analytics to leadership: variances, trends and recommendations in real time.",
        },
        video: {
          src: "/nexo/nexo-orcamento.mp4",
          label: "Budgeting video: each department's spreadsheets give way to a form in the system, the budget goes through approval, arrives consolidated and Finance sees the dashboard by department with the AI alert.",
          legenda: "Budgeting in 22 seconds · illustrative figures",
        },
        telas: [],
      },
    ],
  },

  comparativo: {
    eyebrow: "Competition and differentiators",
    titulo: ["They sell software.", "We deliver agents in operation."],
    colunas: ["Procurement SaaS", "IAgentics Nexo"],
    linhas: [
      { criterio: "Where the data lives", saas: "In the vendor's database, outside the company", nexo: "In the client's ERP and on the client's server" },
      { criterio: "Entry cost", saas: "Annual license and a long implementation", nexo: "No platform license" },
      { criterio: "Time to value", saas: "12 to 18 months of implementation", nexo: "Agent in operation within 90 days" },
      { criterio: "Proven ROI", saas: "Not demonstrated", nexo: "Hours of manual work eliminated" },
      { criterio: "ISO/IEC 27001", saas: "No", nexo: "Certified" },
    ],
  },

  faq: {
    eyebrow: "Frequently asked questions",
    titulo: "What people ask about Nexo",
    itens: [
      {
        pergunta: "Is Nexo one more system for the Procurement team to learn?",
        resposta:
          "No. Nexo runs inside the Desk Manager the company already uses, and the final order is created in the client's ERP, so the team keeps working on the same screens as always.",
      },
      {
        pergunta: "How is a purchase requisition opened in Nexo?",
        resposta:
          "The MIA chatbot opens the requisition from a plain-language description through a simple form, and the AI checks that the requisition is correct before sending it to Procurement.",
      },
      {
        pergunta: "Does the AI approve purchases on its own?",
        resposta:
          "No. The AI classifies the request by category, sets the approval chain by spending authority and audits the data; final approval belongs to a person, and the system requires who approved and why, with the trail recorded in the history.",
      },
      {
        pergunta: "Does the supplier need an account or password to submit a quote?",
        resposta:
          "No. Each supplier receives a unique, trackable link to the Supplier Portal, with no password and no account, and answers price, lead time and terms right there, with attachments.",
      },
      {
        pergunta: "How does Nexo compare supplier bids?",
        resposta:
          "The AI reads the attachments and builds the bid comparison on its own, scoring each supplier on price, lead time and terms, and it also suggests the next negotiation message.",
      },
      {
        pergunta: "Does the order have to be retyped into the ERP at the end of the process?",
        resposta:
          "No. One click on Package PO consolidates the requisition, the quotation and the winning bid into a purchase order ready for the client's ERP.",
      },
      {
        pergunta: "Does Nexo show the company's consolidated spend?",
        resposta:
          "Yes. Spend Analysis consolidates total spend, average ticket and supplier concentration by category and period, and points out opportunities and risks for the next negotiation.",
      },
      {
        pergunta: "Which AI powers Nexo?",
        resposta: "Nexo uses Claude, by Anthropic, and operates inside Desk Manager.",
      },
    ],
  },
};
