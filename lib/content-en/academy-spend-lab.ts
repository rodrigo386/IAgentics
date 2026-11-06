import type * as pt from "@/lib/content";
import type { Traducao } from "@/lib/i18n";
import { PRECO_MENSAL } from "@/lib/content";

/* English version of `academy` and `spendLab` (lib/content.ts). Same shape,
   same order: changed a Portuguese string, change this one too. The online
   course subscription (/cursos) is sold in Brazil in reais and stays in
   Portuguese, so links there keep the Portuguese route. */

export const academy: Traducao<typeof pt.academy> = {
  assinatura: {
    titulo: "Prefer to learn at your own pace?",
    texto:
      `IAgentics Academy programs are also available on Solution, the online learning platform of Pecege, from USP/Esalq. ${PRECO_MENSAL} per month, no commitment (courses in Portuguese).`,
    cta: "See the courses (in Portuguese)",
  },
  hero: {
    slides: [
      {
        primary: false,
        headline: "A school of hands-on AI experiences",
        subtext:
          "A business school built to spark new perspectives, new methods and immediate application.",
      },
      {
        primary: true,
        headline: "AI where the business needs to move forward",
        subtext:
          "AI Fundamentals, Assistants and Agents: practical learning paths that move off the slide and into operations.",
      },
      {
        primary: false,
        headline: "Design the solution with us",
        subtext:
          "Tailored courses, immersions, talks and mentoring to transform people, processes and businesses.",
      },
    ],
  },

  platform: {
    label: "Online learning platform",
    body: `IAgentics applied AI programs and Solution learning paths from Pecege, by subscription: ${PRECO_MENSAL} per month (in Portuguese).`,
    appLabel: "Explore the courses",
    appHref: "/cursos",
  },

  supporters: {
    kicker: "Supporters",
    title: "Companies and institutions that believe in us",
    logos: [
      { name: "Founders Club", src: "/academy/founders-club-logo.png", w: 600, h: 339 },
      { name: "Oracle", src: "/academy/oracle-logo.png", w: 600, h: 78 },
      { name: "Microsoft AI Cloud Partner", src: "/academy/microsoft-ai-cloud-partner.png", w: 600, h: 188 },
      { name: "Desk Manager", src: "/academy/deskmanager-logo.png", w: 600, h: 253 },
      { name: "Claude Partner Network", src: "/academy/claude-partner-network.png", w: 600, h: 232 },
      { name: "Sebrae for Startups", src: "/academy/sebrae-for-startups-v2.png", w: 556, h: 178 },
      { name: "NVIDIA Inception Program", src: "/partner-nvidia-inception.png", w: 451, h: 166 },
    ],
  },

  pillars: {
    kicker: "Our pillars",
    title: "Why IAgentics Academy",
    items: [
      {
        name: "Everything is co-created",
        body: "The education of the future must be built together with everyone.",
        list: null,
      },
      {
        name: "We practice what we teach",
        body: "We bring real life into every class, because we only teach what we have tested and applied in our own daily work.",
        list: null,
      },
      {
        name: "We love to teach",
        body: null,
        list: [
          "Love what you do",
          "Love the process",
          "Love people",
          "Love change",
          "Love transformation",
        ],
      },
      {
        name: "100% hands-on",
        body: "We make learning easier through andragogy and the best educational practices.",
        list: null,
      },
    ],
  },

  manifesto: [
    "We turn learning into action",
    "AI applied to the corporate world",
    "People, processes & business",
    "Immediate application",
  ],

  enterprise: {
    kicker: "For companies",
    title: "Design the solution with us",
    cta: "Talk to a specialist",
  },

  formats: {
    kicker: "Learning formats",
    title: "An experience that transforms people, processes & business",
    cta: "I want to know more",
    items: [
      {
        name: "Courses",
        body: "Tailored content for business areas that want to develop people, processes and technology with best practices and modern methodologies.",
      },
      {
        name: "Immersions",
        body: "Immersive, hands-on experiences that encourage creativity, collaboration and innovation. Co-creating with our facilitators and corporate learning enthusiasts is part of the experience.",
      },
      {
        name: "Talks",
        body: "Sessions with provocations, deep reflection and a genuine wish to raise awareness. Moments that connect people to ideas, always delivered in an empathetic and engaging way that encourages people to act and change.",
      },
      {
        name: "Mentoring",
        body: "A special program for groups of executives and specialists from different business areas, helping turn initiatives into real business results. We also build AI knowledge so leaders can make decisions and sustain the business.",
      },
    ],
  },

  clients: {
    title: "Companies that have already transformed their teams with IAgentics Academy",
    lead: "More than 9 companies and hundreds of professionals reached",
    logos: [
      { name: "Tenda", src: "/academy/tenda.png", w: 600, h: 148 },
      { name: "Marluvas", src: "/academy/marluvas.png", w: 600, h: 96 },
      { name: "CTC", src: "/academy/ctc.png", w: 600, h: 334 },
      { name: "Santa Helena", src: "/academy/santa-helena.png", w: 600, h: 315 },
      { name: "Abreu & Silva", src: "/academy/abreu-silva.png", w: 600, h: 383 },
      { name: "Sebrae", src: "/academy/sebrae.png", w: 600, h: 424 },
      { name: "Britânia", src: "/academy/britania.png", w: 600, h: 600 },
    ],
  },

  courses: {
    kicker: "Course portfolio",
    title: "Featured courses",
    lead: "For professionals who want to take the lead and who dream of a different, engaging way to learn.",
    cta: "Talk to a consultant",
    items: [
      {
        hours: "8 hours",
        mode: "On demand",
        tags: ["Beginner", "On demand", "Business"],
        name: "Fundamentals of AI Applied to Business",
        image: "/academy/fundamentos-ia-negocios.jpg",
        body: "A solid foundation in Artificial Intelligence, focused on real applications in the corporate world.",
      },
      {
        hours: "6 hours",
        mode: "On demand",
        tags: ["Beginner", "Copilot", "Hands-on"],
        name: "AI Fundamentals with Copilot",
        image: "/academy/copilot-course.jpg",
        body: "Master Microsoft Copilot to speed up everyday tasks with generative AI.",
      },
      {
        hours: "16 hours",
        mode: "In person",
        tags: ["Intermediate", "Immersion", "Hands-on"],
        name: "AI Assistants for Business Immersion",
        image: "/academy/imersao-assistentes-ia.jpg",
        body: "Build custom AI assistants to raise your team's productivity.",
      },
      {
        hours: "16 hours",
        mode: "In person",
        tags: ["Intermediate", "Data", "Strategy"],
        name: "Data Analysis with AI Immersion",
        image: "/academy/imersao-analise-dados-ia.jpg",
        body: "Turn data into strategic decisions with AI applied to analysis.",
      },
      {
        hours: "20 hours",
        mode: "Hybrid",
        tags: ["Processes", "Lean", "Automation"],
        name: "Lean Thinking: from mapping to automation",
        image: "/academy/lean-thinking-course.jpg",
        body: "Map processes, eliminate waste and automate with AI following Lean principles.",
      },
      {
        hours: "20 hours",
        mode: "In person",
        tags: ["Leadership", "Digital", "Strategy"],
        name: "Digital Transformation in Business Immersion",
        image: "/academy/transformacao-digital-course.jpg",
        body: "Lead your company's digital transformation journey with modern methodologies.",
      },
      {
        hours: "12 hours",
        mode: "In person",
        tags: ["Innovation", "UX", "Creativity"],
        name: "Design Thinking Applied with AI",
        image: "/academy/design-thinking-ia-course.jpg",
        body: "Combine Design Thinking and AI to build user-centered solutions faster.",
      },
      {
        hours: "16 hours",
        mode: "In person",
        tags: ["Procurement", "Finance", "AI"],
        name: "Spend Management with AI Immersion",
        image: "/academy/spend-management-course.jpg",
        body: "Optimize corporate spend and the supply chain with specialized AI agents.",
      },
      {
        hours: "12 hours",
        mode: "On demand + In person",
        tags: ["People", "Productivity", "Behavior"],
        name: "Neuroscience & Productivity",
        image: "/academy/neurociencia-produtividade-course.jpg",
        body: "How to produce effectively across People, Processes and Technology, in the light of neuroscience.",
      },
    ],
  },

  testimonials: {
    kicker: "People who learned with us",
    title: "Those who learn with us become fans",
    items: [
      {
        quote:
          "The Immersion showed how AI applied to procurement can make the function run in a far more automated way. Still, the biggest differentiator was the emphasis that the differentiator lies in the professional's knowledge, and not necessarily in the AI being used.",
        role: "Participant · Immersion",
      },
      {
        quote:
          "Taking the AI in Procurement course was an extremely enriching experience. The content is practical, current and fully aligned with the reality of people working in supply. I leave the course with a new mindset, better prepared to innovate and create value in procurement.",
        role: "Participant · AI in Procurement course",
      },
      {
        quote:
          "The Immersion made it much clearer how I can apply AI to my procurement routine in a simple and effective way.",
        role: "Participant · Immersion",
      },
    ],
  },

  depoimento: {
    eyebrow: "Testimonial",
    nome: "Gabriela Junqueira",
    cargo: "Head of Procurement",
    empresa: "Santa Helena",
    citacao:
      "It really is a training that transforms, and it was built around our needs.",
    duracao: "Video in Portuguese · 2 min 30",
    src: "/academy/depoimento-gabriela.mp4",
    poster: "/academy/depoimento-gabriela-poster.jpg",
    label:
      "Video testimonial in Portuguese by Gabriela Junqueira, Head of Procurement at Santa Helena, 2 minutes and 30 seconds, with Portuguese captions burned into the image",
    transcricaoLabel: "Read the transcript (English translation)",
    notaTranscricao:
      "English translation of a transcript generated by speech recognition, with proper names reviewed. The video is in Portuguese, with Portuguese captions burned into the image.",
    transcricao: [
      "It really is a training that transforms, and it was built around our needs. I had the pleasure of meeting the IAgentics guys in an in-depth procurement training, which was amazing. From then on I kept in close touch with Rodrigo and with Vinícius.",
      "I was starting a new challenge here at Santa Helena, as head of supply. When I did my mapping, my diagnosis of the area, I understood that I needed to work on developing my buyers with a more strategic view. The team was very focused on issuing purchase orders. My team used to joke that we were the bakery: they thought the purchase had to come out right away, and they had no strategic view of how to deliver it better for the company.",
      "In that context, Vinícius came in to run a development path for our buyers, which is only just beginning and is already paying off. We are developing all of the department's procedures, documenting them so we can optimize our processes and make our day-to-day work easier. We are contracting systems, and the team is working on bigger, more strategic projects, already delivering very good results in cost reduction.",
      "All of it was shaped in that first conversation we had with Vinícius. It was one day of training, out of six days still ahead of us, and it is already transformative. It is recognition for the team that we are investing in their development, and of how that will also impact the company.",
      "I think one really great thing about the training was bringing it into practice: how we take what we are learning here and turn it into real transformation, because having the concept is worthless if we don't bring it into our daily work. Vinícius went through a whole process of mapping and getting to know each buyer to understand their needs and development opportunities, and he built the learning path on top of that, aligned with me, so that we could generate the best result for the company and deliver something that made sense, rather than something off the shelf. It was truly designed and developed for our needs.",
      "Thank you, guys. And if any new clients interested in hiring them want to talk, I'm available to have a conversation too.",
    ],
  },

  articles: {
    kicker: "Free samples",
    title: "Ideas you can apply tomorrow",
    cta: "More articles",
    items: [
      { tag: "Applied AI", name: "3 agent patterns that already work in Procurement" },
      { tag: "Leadership", name: "How to prepare your leadership for the AI era" },
      { tag: "Operations", name: "From pilot to process: scaling AI without drama" },
      { tag: "Culture", name: "Continuous learning: the new competitive edge" },
    ],
  },

  closing: {
    title: "Want to talk to us?",
    body: "We are happy to talk, hear your ideas and help you find the right course or experience for you, your company or your team.",
    quote: "We believe a good coffee and a good conversation light up the possibilities",
  },

  convite: {
    eyebrow: "Invitation",
    titulo: "The school, in six minutes",
    lead: "How IAgentics Academy builds a program with your company: the diagnosis with HR and leadership, the formats that come out of it, and what happens after class. Video in Portuguese, with Portuguese captions.",
    velocidade: 1.25,
    src: "/academy/academy-convite.mp4",
    poster: "/academy/academy-convite-poster.jpg",
    legendas: "/academy/academy-convite.vtt",
    label: "IAgentics Academy video invitation in Portuguese, 7 minutes and 31 seconds, with Portuguese captions",
  },

  faq: {
    eyebrow: "Frequently asked questions",
    titulo: "What people ask about the Academy",
    itens: [
      {
        pergunta: "Who is IAgentics Academy for?",
        resposta:
          "The Academy is a business school for people who need immediate results with AI in their daily work: leadership and C-level, business and operations teams, companies without mature data infrastructure, and lean budgets.",
      },
      {
        pergunta: "Do we need mature data infrastructure to get started?",
        resposta:
          "No. Companies without mature data infrastructure are part of the Academy's audience. The programs connect strategy, culture and practical tools, with no ready-made data foundation required.",
      },
      {
        pergunta: "What does the Academy teach, in practice?",
        resposta:
          "AI fundamentals applied to business, data analysis with AI, automation with AI assistants and agents, safe use and governance, and culture and change management.",
      },
      {
        pergunta: "In which formats does the training happen?",
        resposta:
          "From executive immersions to training entire teams: in-company learning paths, hands-on workshops, an online platform and executive mentoring.",
      },
      {
        pergunta: "Does the program end in theory or in something applied?",
        resposta:
          "Every learning path ends in an applied project. The Academy exists for people who need results in their daily work, and content to watch is never the end goal.",
      },
      {
        pergunta: "Can I study without hiring a learning path for my company?",
        resposta:
          "Yes. The online platform is one of the Academy's formats: a monthly subscription with access to the full program library, at your own pace and with a certificate on completion. The courses are in Portuguese.",
      },
    ],
  },
};

export const spendLab: Traducao<typeof pt.spendLab> = {
  hero: {
    kicker: "IA Spend Lab",
    headline: "Implement AI with Mindset, Method and Culture",
    subtext:
      "An IAgentics Academy solution that combines learning, consulting, maturity assessment and applied training so companies can use AI with expertise, governance and results.",
    ctaPrimary: "AI maturity assessment",
    ctaSecondary: "Let's talk",
    logo: "/spend-lab/academy-lockup.png",
    videoSrc: "/spend-lab/ai-spend-lab-header-video.mp4",
    videoPoster: "/spend-lab/ai-spend-lab-header-poster.jpg",
  },

  pillars: {
    title: "AI is a pillar of Digital Transformation",
    items: [
      { name: "Assessment & Maturity", body: "Interviews, questionnaires and a strategic view of the business" },
      { name: "Design & Mapping", body: "Workflows, procedures, waste and Culture" },
      { name: "Digital Transformation", body: "Data, repositories, statistical models and new processes" },
      { name: "AI First", body: "Automation, mentoring, assistants and training" },
    ],
  },

  syllabus: {
    kicker: "Syllabus",
    title: "What you learn in 8 weeks",
    lead: "Each week combines a live class, one-on-one mentoring and a concrete deliverable applied to your real context.",
    items: [
      {
        name: "AI maturity assessment and governance",
        body: "Assess the current stage of AI in your company: active uses, operational risks, the team's AI literacy and cultural readiness.",
        deliverable: "AI maturity assessment",
      },
      {
        name: "Tool and risk inventory and criteria",
        body: "Map and classify the tools in use, identify overlaps, and assess cost, legal risk and criteria for responsible adoption.",
        deliverable: "Tool inventory and criteria",
      },
      {
        name: "Use cases and value prioritization",
        body: "Select the AI initiatives with the highest ROI potential, aligned with strategy and with the team's capacity to execute.",
        deliverable: "Prioritized use case portfolio",
      },
      {
        name: "Data, prompts and context engineering",
        body: "Structure databases, prompt libraries and context standards for consistent and safe use of AI.",
        deliverable: "Prompt library and standards",
      },
      {
        name: "Workflow automation and AI agents",
        body: "Design and implement agents and automations that solve real bottlenecks in processes and business areas.",
        deliverable: "Agent or automation pilot",
      },
      {
        name: "Metrics, ROI and ongoing governance",
        body: "Define the indicators, usage policies, committees and routines that sustain AI adoption safely and with results.",
        deliverable: "Metrics dashboard and usage policy",
      },
      {
        name: "Culture, training and AI leadership",
        body: "Prepare leaders and teams to work with AI every day, with an experimental mindset and accountability.",
        deliverable: "Training and communication plan",
      },
      {
        name: "12-month roadmap and scale plan",
        body: "Consolidate what was learned into an actionable AI roadmap for the next 12 months, with targets and owners.",
        deliverable: "12-month AI roadmap",
      },
    ],
  },

  practice: {
    title: "See IA Spend Lab in practice",
    lead: "Method, governance and culture: see how we turn AI use in your company into measurable results. Video in Portuguese.",
    src: "/spend-lab/spend-lab-na-pratica.mp4",
    poster: "/spend-lab/spend-lab-na-pratica-poster.jpg",
    label: "IA Spend Lab video presentation in Portuguese, 2 minutes and 37 seconds",
  },

  partners: {
    title: "Partners who support and add value",
    logos: [
      { name: "Desk Manager", src: "/spend-lab/deskmanager.png", w: 600, h: 253 },
      { name: "Claude Partner Network", src: "/spend-lab/claude-partner-network.png", w: 600, h: 232 },
      { name: "Microsoft AI Cloud Partner", src: "/spend-lab/microsoft.png", w: 600, h: 600 },
      { name: "Oracle", src: "/spend-lab/oracle.png", w: 600, h: 78 },
      { name: "NVIDIA Inception Program", src: "/partner-nvidia-inception.png", w: 451, h: 166 },
    ],
  },

  method: {
    title: "How does IA Spend Lab work?",
    cta: "I want the assessment",
    items: [
      { name: "AI maturity assessment", body: "Assess the current state of AI use in your company, understanding the resources in use, existing risks, your people's level of knowledge and overall costs." },
      { name: "Policies and Procedures", body: "Develop a best-practice policy describing what should be used, what should not be used, who is accountable and how it is applied." },
      { name: "Training and AI First Culture", body: "Design learning paths by business area that truly drive adoption, with a sense of ownership and governance." },
      { name: "Tools and Risks", body: "Map and classify the tools in use, identify overlaps, and assess costs, legal risks and criteria for responsible adoption." },
      { name: "Prioritization Committee", body: "Create criteria to decide which initiatives to prioritize, based on feasibility, effort, risk and strategic alignment." },
      { name: "Use case implementation mentoring", body: "Mentor the real AI initiatives that come out of the prioritization committee and the learning paths." },
      { name: "100-day AI Roadmap", body: "Turn what was learned into an execution plan for the AI initiatives, with a timeline, owners and performance indicators." },
      { name: "AI Summit: Project Pitches & Results", body: "Consolidate the prioritized projects into an executive presentation for stakeholders." },
    ],
  },

  comparison: {
    title: "We start with context, processes and people.",
    subtitle: "Tools matter, but method is essential.",
    columnA: "Existing formats",
    columnB: "IA Spend Lab",
    rows: [
      ["Generic tool training", "Tailored training applied to each business area"],
      ["Pilots started with no follow-through", "Continuity for initiatives that prove their value"],
      ["Individual use with no governance", "Governance and policy for collective practice"],
      ["Focus on prompts and other companies' cases", "Focus on your own challenges and pain points"],
      ["Engagement only at the start", "Motivation that lasts: we stay with you to the end"],
    ],
  },

  audience: {
    title: "Who IA Spend Lab was built for",
    lead: "Areas that need to build awareness and to put a method for applying AI in place, without improvisation",
    items: [
      "People & L&D",
      "IT & Digital Transformation",
      "Finance, Spend Management & Procurement",
      "Business Areas",
      "Leadership & Executives",
    ],
  },

  closing: {
    title: "Want to talk to us?",
    body: "We are happy to talk, hear your ideas and help you find the right format or experience for you, your company or your team.",
    quote: "We believe a good coffee and a good conversation light up the possibilities",
  },

  faq: {
    eyebrow: "Frequently asked questions",
    titulo: "What people ask about IA Spend Lab",
    itens: [
      {
        pergunta: "Where does an IA Spend Lab project start?",
        resposta:
          "With the maturity assessment: process mapping, an evaluation of data quality and availability and of team and technology readiness, delivered as a report of prioritized quick wins.",
      },
      {
        pergunta: "How does IA Spend Lab choose where to apply AI first?",
        resposta:
          "Use cases are designed by ROI and organized into an implementation roadmap in waves. It starts with what pays back fastest, ahead of what looks best in a demo.",
      },
      {
        pergunta: "Who takes care of AI usage rules and governance?",
        resposta:
          "IA Spend Lab delivers a governance model and usage policies together with the implementation, because safe use is part of the method from day one, never an appendix at the end of the project.",
      },
      {
        pergunta: "How do we know the implementation delivered results?",
        resposta:
          "The project defines savings and productivity indicators, so results are measured in the operation's numbers rather than in the team's perception.",
      },
      {
        pergunta: "What happens after AI goes into operation?",
        resposta:
          "Applied training follows: hands-on training by role, procurement playbooks and prompts, post-implementation support and continuous improvement of the agents.",
      },
      {
        pergunta: "Is IA Spend Lab consulting or training?",
        resposta:
          "Both, on the same front: the assessment and applied consulting design the path, and the training gets the procurement team working with AI every day.",
      },
    ],
  },
};
