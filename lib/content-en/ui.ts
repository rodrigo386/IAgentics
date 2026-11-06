import type * as pt from "@/lib/content";
import type { Traducao } from "@/lib/i18n";

export const ui: Traducao<typeof pt.ui> = {
  inicio: "IAgentics, home",
  principal: "Main",
  pularConteudo: "Skip to content",
  certificacoes: "Certifications",
  duracaoVideoSpendLab: "Video · 2 min 37 · in Portuguese",
  turmaAcademy: "Tell us which program interests you and we will build a cohort for your team.",
  abrirMenu: "Open menu",
  fecharMenu: "Close menu",
  rodape: "Footer",
  temaClaro: "Switch to light theme",
  temaEscuro: "Switch to dark theme",
  idioma: { rotulo: "PT", nome: "Ler esta página em português", lingua: "pt-BR" },
};

export const paginas: Traducao<typeof pt.paginas> = {
  nexo: {
    titulo: "Nexo: AI agents for Procurement and spend management",
    og: "Nexo · IAgentics",
  },
  spendLab: {
    titulo: "IA Spend Lab: AI maturity assessment",
    og: "IA Spend Lab · IAgentics",
    descricao: "Implement AI with Mindset, Method and Culture. Maturity assessment, consulting and applied training in 8 weeks.",
  },
  academy: {
    titulo: "Academy: AI training for teams and leaders",
    og: "IAgentics Academy",
    descricao:
      "IAgentics' applied AI school: in-company learning tracks, workshops and executive mentoring for teams and leaders, with an applied project at the end of each program.",
  },
};
