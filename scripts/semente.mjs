import { readFileSync } from "fs";
import pg from "pg";

// Carregar .env.local
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2];
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  // Inserir curso demo "fundamentos-ia-copilot"
  const demoCourseResult = await client.query(
    `INSERT INTO public.courses (slug, titulo, descricao, capa_url, nivel, carga_horas, publicado, ordem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [
      "fundamentos-ia-copilot",
      "Fundamentos de IA com Copilot",
      "Domine o Microsoft Copilot para acelerar tarefas do dia a dia com IA generativa.",
      "/plataforma/cursos/copilot-course.png",
      "Iniciante",
      6,
      true,
      1,
    ]
  );

  // Se não retornou (já existia), buscar o ID
  let demoCourseId;
  if (demoCourseResult.rows.length > 0) {
    demoCourseId = demoCourseResult.rows[0].id;
  } else {
    const existing = await client.query(
      `SELECT id FROM public.courses WHERE slug = $1`,
      ["fundamentos-ia-copilot"]
    );
    demoCourseId = existing.rows[0].id;
  }

  // Inserir 3 módulos do curso demo (idempotente: verifica antes de inserir)
  const modulos = [];
  const modulosTitulos = [
    "Começando com o Copilot",
    "Copilot no dia a dia",
    "Boas práticas e próximos passos",
  ];

  for (let i = 0; i < 3; i++) {
    // Verificar se módulo já existe (por course_id e ordem)
    const existing = await client.query(
      `SELECT id FROM public.modules WHERE course_id = $1 AND ordem = $2`,
      [demoCourseId, i + 1]
    );

    let modId;
    if (existing.rows.length > 0) {
      modId = existing.rows[0].id;
    } else {
      const modResult = await client.query(
        `INSERT INTO public.modules (course_id, titulo, ordem)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [demoCourseId, modulosTitulos[i], i + 1]
      );
      modId = modResult.rows[0].id;
    }
    modulos.push(modId);
  }

  // Inserir 8 aulas
  const aulas = [
    {
      module_id: modulos[0],
      slug: "boas-vindas",
      titulo: "Boas-vindas e panorama do curso",
      descricao: "O que você vai aprender e como tirar o máximo das aulas.",
      duracao_seg: 420,
      ordem: 1,
      gratuita: true,
    },
    {
      module_id: modulos[0],
      slug: "o-que-e-copilot",
      titulo: "O que é o Copilot e onde ele vive",
      descricao:
        "Word, Excel, Outlook, Teams: onde o Copilot aparece e o que muda em cada um.",
      duracao_seg: 780,
      ordem: 2,
      gratuita: false,
    },
    {
      module_id: modulos[0],
      slug: "primeiro-prompt",
      titulo: "Seu primeiro prompt bem escrito",
      descricao: "A anatomia de um pedido claro: contexto, tarefa e formato.",
      duracao_seg: 900,
      ordem: 3,
      gratuita: false,
    },
    {
      module_id: modulos[1],
      slug: "copilot-word",
      titulo: "Documentos com o Copilot no Word",
      descricao: "Rascunhos, resumos e revisão de tom em documentos reais.",
      duracao_seg: 960,
      ordem: 1,
      gratuita: false,
    },
    {
      module_id: modulos[1],
      slug: "copilot-excel",
      titulo: "Análise com o Copilot no Excel",
      descricao:
        "Fórmulas explicadas, tabelas e primeiras análises guiadas.",
      duracao_seg: 1080,
      ordem: 2,
      gratuita: false,
    },
    {
      module_id: modulos[1],
      slug: "copilot-outlook-teams",
      titulo: "E-mail e reuniões: Outlook e Teams",
      descricao: "Resumo de threads, rascunho de respostas e atas de reunião.",
      duracao_seg: 840,
      ordem: 3,
      gratuita: false,
    },
    {
      module_id: modulos[2],
      slug: "limites-privacidade",
      titulo: "Limites, revisão humana e privacidade",
      descricao:
        "O que não delegar, como revisar saídas e o que nunca colar num prompt.",
      duracao_seg: 720,
      ordem: 1,
      gratuita: false,
    },
    {
      module_id: modulos[2],
      slug: "plano-de-pratica",
      titulo: "Seu plano de prática de 30 dias",
      descricao:
        "Como transformar o curso em hábito na sua rotina de trabalho.",
      duracao_seg: 540,
      ordem: 2,
      gratuita: false,
    },
  ];

  const aulasIds = [];
  for (const aula of aulas) {
    const aulResult = await client.query(
      `INSERT INTO public.lessons (module_id, slug, titulo, descricao, duracao_seg, ordem, gratuita)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (module_id, slug) DO NOTHING
       RETURNING id`,
      [
        aula.module_id,
        aula.slug,
        aula.titulo,
        aula.descricao,
        aula.duracao_seg,
        aula.ordem,
        aula.gratuita,
      ]
    );

    let aulId;
    if (aulResult.rows.length > 0) {
      aulId = aulResult.rows[0].id;
    } else {
      const existing = await client.query(
        `SELECT id FROM public.lessons WHERE module_id = $1 AND slug = $2`,
        [aula.module_id, aula.slug]
      );
      aulId = existing.rows[0].id;
    }
    aulasIds.push(aulId);
  }

  // Inserir mídia para todas as aulas
  for (const aulId of aulasIds) {
    await client.query(
      `INSERT INTO public.lesson_media (lesson_id, video_provider, video_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (lesson_id) DO NOTHING`,
      [aulId, "youtube", "M7lc1UVf-VE"]
    );
  }

  // Inserir 8 cursos cascas (shell courses)
  const cascas = [
    {
      slug: "fundamentos-ia-negocios",
      titulo: "Fundamentos de IA aplicado aos Negócios",
      descricao:
        "Base sólida em Inteligência Artificial com foco em aplicações reais no mundo corporativo.",
      capa_url: "/plataforma/cursos/fundamentos-ia-negocios.png",
      nivel: "Iniciante",
      carga_horas: 8,
      ordem: 2,
    },
    {
      slug: "imersao-assistentes-ia",
      titulo: "Imersão de Assistentes de IA para Negócios",
      descricao:
        "Crie assistentes de IA sob medida para aumentar a produtividade da sua equipe.",
      capa_url: "/plataforma/cursos/imersao-assistentes-ia.png",
      nivel: "Intermediário",
      carga_horas: 16,
      ordem: 3,
    },
    {
      slug: "imersao-analise-dados-ia",
      titulo: "Imersão de Análise de Dados com IA",
      descricao:
        "Transforme dados em decisões estratégicas com o poder da IA aplicada à análise.",
      capa_url: "/plataforma/cursos/imersao-analise-dados-ia.png",
      nivel: "Intermediário",
      carga_horas: 16,
      ordem: 4,
    },
    {
      slug: "lean-thinking",
      titulo: "Lean Thinking — do mapeamento à automação",
      descricao:
        "Mapeie processos, elimine desperdícios e automatize com IA seguindo princípios Lean.",
      capa_url: "/plataforma/cursos/lean-thinking-course.png",
      nivel: "Intermediário",
      carga_horas: 20,
      ordem: 5,
    },
    {
      slug: "transformacao-digital",
      titulo: "Imersão de Transformação Digital nos Negócios",
      descricao:
        "Lidere a jornada de transformação digital da sua empresa com metodologias de vanguarda.",
      capa_url: "/plataforma/cursos/transformacao-digital-course.png",
      nivel: "Avançado",
      carga_horas: 20,
      ordem: 6,
    },
    {
      slug: "design-thinking-ia",
      titulo: "Design Thinking aplicado com IA",
      descricao:
        "Combine Design Thinking e IA para criar soluções centradas no usuário com mais velocidade.",
      capa_url: "/plataforma/cursos/design-thinking-ia-course.png",
      nivel: "Intermediário",
      carga_horas: 12,
      ordem: 7,
    },
    {
      slug: "spend-management-ia",
      titulo: "Imersão de Spend Management com IA",
      descricao:
        "Otimize gastos corporativos e a cadeia de suprimentos com agentes de IA especializados.",
      capa_url: "/plataforma/cursos/spend-management-course.png",
      nivel: "Avançado",
      carga_horas: 16,
      ordem: 8,
    },
    {
      slug: "neurociencia-produtividade",
      titulo: "Neurociência & Produtividade",
      descricao:
        "Como produzir com eficácia na tríade Pessoas, Processos e Tecnologia à luz da neurociência.",
      capa_url: "/plataforma/cursos/neurociencia-produtividade-course.png",
      nivel: "Intermediário",
      carga_horas: 12,
      ordem: 9,
    },
  ];

  for (const casca of cascas) {
    await client.query(
      `INSERT INTO public.courses (slug, titulo, descricao, capa_url, nivel, carga_horas, publicado, ordem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO NOTHING`,
      [
        casca.slug,
        casca.titulo,
        casca.descricao,
        casca.capa_url,
        casca.nivel,
        casca.carga_horas,
        false,
        casca.ordem,
      ]
    );
  }

  // Imprimir contagens
  const courseCount = await client.query(
    `SELECT COUNT(*) FROM public.courses`
  );
  const lessonCount = await client.query(
    `SELECT COUNT(*) FROM public.lessons`
  );
  const mediaCount = await client.query(
    `SELECT COUNT(*) FROM public.lesson_media`
  );
  const publishedCount = await client.query(
    `SELECT COUNT(*) FROM public.courses WHERE publicado = true`
  );

  console.log(`
Semente inserida:
  courses: ${courseCount.rows[0].count}
  lessons: ${lessonCount.rows[0].count}
  lesson_media: ${mediaCount.rows[0].count}
  publicados: ${publishedCount.rows[0].count}
  `);
} finally {
  await client.end();
}
