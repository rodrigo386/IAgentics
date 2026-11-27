import type * as pt from "@/lib/content";
import type { Traducao } from "@/lib/i18n";
import { PRECO_MENSAL } from "@/lib/content";

/* Versão em inglês dos textos gerais de lib/content.ts (ver lib/i18n.ts).
   Mesmo formato, mesmas chaves, mesma ordem: mudou o português, mude aqui. */

export const site: Traducao<typeof pt.site> = {
  name: "IAgentics",
  domain: "iagentics.com.br",
  url: "https://iagentics.com.br",
  tagline: "Intelligent Automation for Procurement and Spend Management",
  titulo: "IAgentics · AI Agents for Procurement and Spend Management",
  description:
    "IAgentics runs AI agents inside the platform your company already uses, across Procurement and Spend Management. Your data stays on your company's servers.",
};

export const cta: Traducao<typeof pt.cta> = {
  contact: "Let's talk",
  solutions: "See the solutions",
};

export const naoEncontrada: Traducao<typeof pt.naoEncontrada> = {
  eyebrow: "Error 404",
  titulo: "This page does not exist.",
  texto: "The address may have changed or the code you entered does not match. Check the link and try again.",
  voltar: "Go to the home page",
};

export const privacidade: Traducao<typeof pt.privacidade> = {
  meta: {
    titulo: "Privacy Policy",
    descricao:
      "Privacy Policy: how IAgentics handles personal data on its website and in the Solution platform subscription, with Pecege, under Brazil's LGPD.",
  },
  hero: {
    eyebrow: "Privacy",
    titulo: "Privacy Policy",
    atualizado: "Last updated November 27, 2026",
    lead: "This is a translation; the Portuguese version prevails. This page explains which data IAgentics collects, why, who we share it with, and how you can ask us to delete it. It is written in plain language, without unnecessary legalese.",
  },
  secoes: [
    {
      titulo: "Who is responsible for your data",
      paragrafos: [
        "The controller of the personal data processed on this website is IAgentics LTDA, registered under CNPJ no. 56.920.339/0001-60, with its registered office at Rua Barão de Teffé, 160, conjunto 505, anexo V140, Jardim Ana Maria, Jundiaí/SP, CEP 13.208-760, Brazil.",
        "Any question or request about your data can be sent through the channels at the end of this page.",
      ],
      itens: [],
    },
    {
      titulo: "What we collect, and nothing more",
      paragrafos: [
        "We collect the minimum needed for each purpose. Nothing is sold, and nothing is used for third-party advertising.",
      ],
      itens: [
        {
          termo: "Contact form",
          texto:
            "Your name, business email and the message you write. We use them to reply to you, and they reach us by email. If you do not start a conversation, nothing is collected.",
        },
        {
          termo: "Solution platform subscription",
          texto:
            "Name, email, mobile number, the status of each monthly payment, the date until which access is paid, and the date on which you authorized the billing and the sharing with Pecege. We use them to charge the monthly fee, to send the welcome email once payment is confirmed, and so that Pecege can grant and end your access to Solution. Your CPF (Brazilian taxpayer ID) is requested because Asaas, which issues the charges, requires it: it goes straight to Asaas and is not stored on our website.",
        },
        {
          termo: "Procurement Diagnostic (Diagnose de Compras)",
          texto:
            "Name, work email, company, job title, WhatsApp number (if you provide it), your role in the department and the score you give each process. The IAgentics Academy team uses them to prepare your diagnostic and talk to you about it, and they are only sent if you check the authorization box. They reach us by email and are not stored on the website. While you answer, your progress is kept only in your browser, so you can stop and come back later; starting over deletes those answers.",
        },
        {
          termo: "Prova Real Challenge (Desafio Prova Real)",
          texto:
            "Name, email, WhatsApp number, company, the Instagram and LinkedIn profiles you provide, the problem you describe and the date of each authorization. We use them to evaluate your application and talk to you about it, and they are stored in our database. Communications after the challenge, joining the exclusive WhatsApp group and the use of your name and image in promotion only happen if you check the optional authorizations. To check the selection criteria, we look at your public Instagram or LinkedIn profile.",
        },
        {
          termo: "Case 2026 prize draw (Sorteio no Case 2026)",
          texto:
            "Name, email, WhatsApp, field of work, company and job title (if you provide them), your lucky number, your statement that you follow IAgentics on Instagram or LinkedIn and the date you accepted the rules. We use them to run the draw, to email you your number and to notify the winner, and they are stored in our database. IAgentics content and news only go to people who checked that option when signing up.",
        },
        {
          termo: "Nexo Demo",
          texto:
            "Name, email, company, mobile number and the LinkedIn profile you provide to enter the Nexo demonstration, the date of your acknowledgment and the furthest step you reached in it (for example, whether you opened the requisition or got to the purchase order). We use them to grant access, to email you the link back and for IAgentics sales contact, and they are stored in our database. What you type and click inside the demonstration stays in your browser only: its data is fictitious.",
        },
        {
          termo: "Tax Reform calculator (Calculadora da Reforma Tributária)",
          texto:
            "While you calculate, nothing leaves your browser. If you ask for the comparison by email, we receive your name, work email, company, job title (if you provide it), the scenario you calculated and the date of your authorization, and, if you check it, your request for a notice about the tax rates. We use them to send the comparison and so that IAgentics can talk to you about Procurement and the Tax Reform, and they are stored in our database.",
        },
        {
          termo: "Waiting list and past individual purchases",
          texto:
            "People who joined the launch waiting list (until October 2026) or bought an individual course have the data provided at that time kept for record purposes, with the same care. The waiting list and individual course sales are no longer available.",
        },
        {
          termo: "Website visit measurement",
          texto:
            "We count how many visits each public page receives per day. This counter records only the date and the page address, with no cookie, no IP address and no identifier of any person.",
        },
        {
          termo: "Where you came from",
          texto:
            "On the first page of each visit, we record the TYPE of site that brought you here: search, social network, AI assistant, a link from another site, or none. Your browser sends us only the referring domain (for example, google.com), never the full address or the term you searched for, and that domain is turned into a category before it is stored. The category is kept; the domain is not.",
        },
        {
          termo: "What happens on the courses and Challenge pages",
          texto:
            "On the courses and Prova Real Challenge pages, we count a few actions to learn where the page needs improvement: how many times someone scrolls halfway or to the end, clicks subscribe or join, starts or submits the form, is taken to the invoice or completes the sign-up. On the Challenge form, we also count which required field stopped the submission and why a sign-up was refused (for example, an invalid e-mail). Each action only adds one to the day's total: we do not keep who did it, what was typed, or anything that identifies you or your browser.",
        },
        {
          termo: "Google Analytics",
          texto:
            "We use Google Analytics on public pages to understand how the website is used. It sets cookies in your browser and processes data under Google's policy.",
        },
        {
          termo: "Metricool",
          texto:
            "Public pages load an invisible image from Metricool, which we use to measure where visits come from and match them with our social media. When the image loads, your browser sends Metricool technical data about the visit, such as IP address, browser and the page you came from, processed under Metricool's policy.",
        },
      ],
    },
    {
      titulo: "Who we share data with",
      paragrafos: [
        "We share data only with the services the website needs to work, and only what each of them needs to do its job:",
      ],
      itens: [
        {
          termo: "Pecege and the Solution platform",
          texto:
            "If you subscribed to Solution, your name, email, mobile number and subscription status are shared with Pecege, which runs the platform, so it can grant and end your access. Data from people who joined the waiting list or bought an individual course was shared with Pecege under the same conditions. Because of this sharing, the form asks for an explicit authorization: if it is not checked, we neither store nor share anything. The authorization can be withdrawn at any time through the channels at the end of this page; withdrawing it ends the subscription.",
        },
        {
          termo: "Asaas",
          texto: "Issues and processes the monthly subscription charges: it receives your name, email, mobile number and CPF to generate the charges, sends each month's invoice to your email, and receives the payment details you enter there.",
        },
        { termo: "Resend", texto: "Sends the website's emails: contact form messages, Procurement Diagnostic answers, the Prova Real Challenge emails, the Case 2026 lucky numbers, the Nexo Demo access link and the Tax Reform calculator comparison." },
        { termo: "Google Analytics", texto: "Measures usage of the public pages." },
        { termo: "Metricool", texto: "Measures visits to the public pages and their origin on social media." },
        { termo: "Railway and Cloudflare", texto: "Application hosting and website delivery, with all traffic over HTTPS." },
      ],
    },
    {
      titulo: "How long we keep data",
      paragrafos: [
        "Subscription data is kept while the subscription exists and, after cancellation, for the period the law requires for billing records. Contact form messages and Procurement Diagnostic answers stay in our mailbox for as long as the support, the diagnostic and the business relationship last. Tax Reform calculator requests are kept while the business relationship lasts, or until you ask to be removed. Nexo Demo sign-ups are kept for the same period: while the business relationship lasts, or until you ask to be removed. Prova Real Challenge applications are kept until the end of the scholarship and the voucher offer, in February 2027; after that, we keep only those of people who became subscribers or authorized sales contact. Case 2026 prize draw sign-ups are kept until the prize is delivered and, after that, only those of people who accepted IAgentics content and news. Billing records follow the legal deadlines and the payment processor's rules.",
      ],
      itens: [],
    },
    {
      titulo: "How we protect data",
      paragrafos: [
        "All website traffic is encrypted with HTTPS. Subscription data is kept in a restricted-access database, and the website stores no passwords at all: there is no login area. Email addresses and CPF numbers do not appear in technical logs.",
      ],
      itens: [],
    },
    {
      titulo: "Your rights",
      paragrafos: [
        "Brazil's General Data Protection Law (LGPD) gives you the right, at any time and at no cost, to confirm whether we process your data, access it, correct it, request anonymization or deletion of unnecessary data, request portability, know who we share it with, and withdraw consent.",
        "To exercise any of these rights, contact us through the channels below. We reply as quickly as possible.",
      ],
      itens: [],
    },
    {
      titulo: "Cookies",
      paragrafos: [
        "On public pages, Google Analytics sets cookies, and Metricool, whose measurement image is loaded from its own domain, may set its own. There is no login area and therefore no session cookie. You can block cookies in your browser settings without any loss in using the website.",
      ],
      itens: [],
    },
    {
      titulo: "Changes to this policy",
      paragrafos: [
        "If what we do with data changes, this page changes with it, and the update date at the top reflects the most recent revision.",
      ],
      itens: [],
    },
  ],
  contato: {
    titulo: "Questions about your data",
    texto: "For any request related to personal data, use one of these channels:",
    email: "contato@iagentics.com.br",
  },
};

export const nav: Traducao<typeof pt.nav> = {
  links: [
    { label: "Solutions", href: "/en#solucoes" },
    { label: "Nexo", href: "/en/nexo" },
    { label: "Academy", href: "/en/academy" },
    { label: "Courses", href: "/cursos" },
    { label: "Spend Lab", href: "/en/spend-lab" },
    { label: "Articles", href: "/artigos" },
  ],
};

export const hero: Traducao<typeof pt.hero> = {
  headline: ["Intelligent Automation for", "Procurement & Spend Management"],
  subtext:
    "The first Brazilian company offering multi-agent AI solutions for spend management, integrated with your ERP and running inside the Microsoft environment and Desk Manager's Space, with ISO/IEC 27001 certified security and data governance.",
  descricao:
    "Nexo orchestrates nine modules of AI agents for Procurement and Spend Management, inside the platform your company already uses. Data stays on your company's servers.",
  imageAlt:
    "Corporate building lit up at night, with dozens of workstations visible through the windows",
};

export const problema: Traducao<typeof pt.problema> = {
  eyebrow: "The problem",
  paineis: [
    {
      numero: "57%",
      legenda: "of work hours can already be automated with current technology",
      fonte: "McKinsey Global Institute, “Agents, robots, and us” (2025)",
      titulo: ["Procurement teams are", "stuck in operational work"],
      lead: "Hours spent every day on manual, repetitive tasks",
      itens: [
        { nome: "Internal requests", texto: "Internal customers constantly asking for status updates" },
        { nome: "Managing in Excel", texto: "Requisitions, purchase orders, contracts, savings" },
        { nome: "Manual outreach", texto: "Emails, RFQs, follow-ups" },
      ],
    },
    {
      numero: "70%",
      legenda: "of a company's total cost can sit in external spend with suppliers",
      fonte: "McKinsey & Company, Procurement insights (2017, 2019)",
      titulo: ["Spend management is the", "biggest value lever"],
      lead: "Managing spend well is the most underestimated opportunity in the organization",
      itens: [
        { nome: "Low visibility", texto: "Spend scattered across spreadsheets, with no view by category" },
        { nome: "Direct impact on margin", texto: "Every 1% saved in procurement goes straight to the bottom line" },
        { nome: "Uncaptured potential", texto: "Digital solutions unlock 3% to 10% in annual savings" },
      ],
    },
  ],
};

export const partners: Traducao<typeof pt.partners> = {
  label: "Partnerships",
  logos: [
    { name: "Microsoft AI Cloud Partner", src: "/partner-microsoft-v2.png", w: 888, h: 182 },
    { name: "Oracle Partner", src: "/partner-oracle.png", w: 721, h: 233 },
    { name: "SAP Partner", src: "/partner-sap-v2.png", w: 600, h: 595 },
    { name: "Desk Manager Partners", src: "/partner-deskmanager.png", w: 1057, h: 347 },
    { name: "NVIDIA Inception Program", src: "/partner-nvidia-inception.png", w: 451, h: 166 },
  ],
  anthropic: { name: "Anthropic" },
};

export const credenciais: Traducao<typeof pt.credenciais> = {
  titulo: "Credentials",
  claudePartner: {
    src: "/selo-claude-partner-v1.png",
    w: 600,
    h: 600,
    alt: "Claude Partner (Claude Code) badge, issued by Anthropic to Jesse Guimarães, COO of IAgentics",
    legenda: "Team certified by Anthropic · Claude Partner (Claude Code)",
    verificar: "Verify on Credly",
    href: "https://www.credly.com/badges/a34b4c93-a461-4c7e-8484-ce1b2403a2f1/public_url",
  },
};

export const solutions: Traducao<typeof pt.solutions> = {
  assinaturaAcademy: {
    texto: `IAgentics Academy is also available online, by subscription: ${PRECO_MENSAL} per month.`,
    cta: "Explore the learning tracks (in Portuguese)",
  },
  eyebrow: "Business models",
  headline: "The 3 IAgentics solutions",
  faq: {
    eyebrow: "Frequently asked questions",
    titulo: "What people ask before the first conversation",
  },
  items: [
    {
      id: "nexo",
      filme: "/solucoes/solucao-nexo.mp4",
      capa: "/solucoes/solucao-nexo-poster.jpg",
      name: "Nexo",
      promise: "Spend management orchestrator",
      platform: "Microsoft · Desk Manager",
      scope: ["Procurement", "Assets", "Logistics", "Invoices", "Accounts Payable", "Retail", "Budget", "Contracts", "Supplier Qualification"],
      href: "/en/nexo",
      image: "/agent-contratos.jpg",
      imageAlt: "Hands reviewing and annotating a printed document",
    },
    {
      id: "academy",
      filme: "/solucoes/solucao-academy-v2.mp4",
      capa: "/solucoes/solucao-academy-v2-poster.jpg",
      name: "Academy",
      promise: "Training for you and your team",
      platform: "AI business school",
      scope: ["In-Company", "Mentoring", "Online"],
      href: "/en/academy",
      image: "/academy-formacao.jpg",
      imageAlt: "Four professionals gathered around a laptop screen, analyzing it",
    },
    {
      id: "spend-lab",
      filme: "/solucoes/solucao-spend-lab.mp4",
      capa: "/solucoes/solucao-spend-lab-poster.jpg",
      name: "IA Spend Lab",
      promise: "AI Implementation Consulting for Procurement",
      platform: "From maturity to results",
      scope: ["Assessment", "Consulting", "Training"],
      href: "/en/spend-lab",
      image: "/agent-spend.jpg",
      imageAlt: "Hands examining printed spend reports with a magnifying glass",
    },
  ],
};

export const contact: Traducao<typeof pt.contact> = {
  headline: "Let's talk",
  lead: "Tell us where your procurement team loses the most time today. We will reply with a concrete next step.",
  social: [
    { label: "WhatsApp", href: "https://wa.me/5515998714091?text=Hi%21%20I%20found%20IAgentics%20through%20the%20website." },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/iagentics/" },
    { label: "Instagram", href: "https://www.instagram.com/iagentics/" },
  ],
  whatsapp: { label: "WhatsApp", numero: "(15) 99871-4091" },
  form: {
    name: { label: "Name", placeholder: "What should we call you" },
    email: { label: "Business email", placeholder: "you@yourcompany.com" },
    company: { label: "Company", placeholder: "Company name" },
    message: {
      label: "Where your team loses the most time",
      placeholder: "Quotations, contracts, spend analysis, supplier onboarding",
      helper: "The more specific you are, the more directly we can respond.",
    },
    submit: "Let's talk",
    sending: "Sending",
    success: "Message received. We will get back to you within one business day.",
    errors: {
      name: "Please enter your name.",
      email: "Please enter a valid email.",
      message: "Briefly tell us where your team loses time today.",
      submit: "We could not send your message right now. Please try again in a moment.",
    },
  },
};

export const footer: Traducao<typeof pt.footer> = {
  note: "AI agents for Procurement and Spend Management.",
};
