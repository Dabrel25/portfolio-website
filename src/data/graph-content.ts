import type { GraphNode, GraphEdge } from "./graph";

/**
 * Hand-authored graph content: hobby/community/project nodes with real
 * writeups, extra skills beyond the resume's skill list, per-node overrides
 * for the resume-derived job/education nodes, and the explicit edge map
 * (which node uses which skills, which projects belong to which job, etc.).
 *
 * This replaced the old fuzzy stack-string matching in graph-builders —
 * every relationship here is deliberate, because the detail card now
 * surfaces them as connection tags.
 */

// ---------------------------------------------------------------------------
// Hobbies
// ---------------------------------------------------------------------------

export const hobbyNodes: GraphNode[] = [
  {
    id: "hobby-basketball",
    layer: "hobby",
    category: "interest",
    label: "Basketball",
    description:
      "I didn't grow up loving basketball. It was forced on me as a kid because I was tall, and the sport felt brutish, even simplistic — like it all came down to who had more talent and could physically overpower the other. Without real passion behind it, I struggled to improve. I couldn't see the results I wanted, and I wasn't willing to put in the time for something I didn't love. But when I got the chance to play again years later, something had changed. I found myself loving, even obsessing over, the game: the analysis, the strategy, the way it rewards thinking and skill as much as talent. I was hooked by the beauty of sports — the coalescence of strategy, instinct, and execution at the highest level. I haven't looked back since.",
    images: ["/photos/Basketball_1.jpg"],
  },
  {
    id: "hobby-learning",
    layer: "hobby",
    category: "interest",
    label: "Learning",
    description:
      "I know it can sound somewhat pretentious and cliché, but I genuinely do love learning about anything and everything. I grew up on YouTube videos from Crash Course, Kurzgesagt, and Veritasium. To me, learning feels like gaining a new perspective — like I've taken a step into a new world I can infinitely explore. Here are some of the worlds I explore through:",
    images: ["/photos/LEARNING_1.png", "/photos/Learning_2.jpeg", "/photos/Learning_3.jpg", "/photos/Learning_4.png"],
    imagePlacement: "bottom",
  },
  {
    id: "hobby-games",
    layer: "hobby",
    category: "interest",
    label: "Games",
    description:
      "I love playing games and the sense of wonder they bring. Games are a beautiful way for people to express their creativity, and they involve one of the best ways to exercise our mental muscle.",
    meta: { favorites: ["Breath of the Wild", "Hades", "Jeopardy"] },
    images: ["/photos/Games_1.jpg"],
  },
];

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export const communityNodes: GraphNode[] = [
  {
    id: "community-misa",
    layer: "community",
    category: "community",
    label: "MISA",
    description:
      "My time at my home org was truly invaluable. It was less about the skills, experiences, and opportunities I gained there — of which there were genuinely many — and more about the meaningful friendships and relationships I built through this amazing community. From hosting and joining events, to leading initiatives, and even just enjoying the everyday time spent together in the research lab, every moment added up to something special. Thank you so much, MISA!!",
    meta: {
      roles: [
        "AVP for IT Skills Training and Evaluation",
        "Officer — Marketing",
        "Officer — Finance",
      ],
    },
    images: ["/photos/Ateneo_MISA_1.png", "/photos/Ateneo_MISA_2.jpg"],
  },
  {
    id: "community-barefoot",
    layer: "community",
    category: "community",
    label: "Barefoot",
    description:
      "Here at Barefoot I met so many inspiring people. Our advocacy, geared toward children in rural communities, introduced me to people who thrived in the direst of situations. While I haven't had the chance to be as involved recently, I continue to want to empower and serve the children I've had the privilege to meet here.",
    images: ["/photos/barefoot_photo_1.jpg", "/photos/barefoot_photo_2.avif"],
  },
];

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projectNodes: GraphNode[] = [
  {
    id: "project-iclinicsys",
    layer: "professional",
    category: "project",
    label: "iClinicSys",
    description:
      "My thesis group and I worked with the DepEd Schools Division Office of Batangas City and the Department of Health to implement an electronic medical record system, transforming how student health records are kept. It earned the ASCEND Awards Excellence Award for Best College Project Thesis (2024–2025).",
    highlights: [
      "Replaced an archaic paper-based recording system with an electronic medical record system connected to the DOH's national database.",
      "Enabled tracking of over 1,200 students and 200+ staffers — where previously only staff records (and no students) could be tracked at all.",
      "Coordinated across three institutions — DepEd, the Schools Division Office of Batangas City, and the Department of Health — to ship a system that fit real public-sector workflows.",
    ],
    meta: {
      award: "ASCEND Awards Excellence Awardee — Best College Project Thesis (2024–2025)",
      partners: ["DepEd — SDO Batangas City", "Department of Health"],
    },
    images: ["/photos/Ascend_award_1.jpeg", "/photos/Ascend_award_2.jpeg"],
  },
  {
    id: "project-stock-sage",
    layer: "professional",
    category: "project",
    label: "Stock Sage",
    description:
      "An algorithmic paper-trading platform in Go (~10k LOC) that screens equity universes for statistically abnormal price moves and uses LLM judgment (pluggable Anthropic/OpenAI/Gemini/xAI providers) to identify mean-reversion opportunities, executing through the Alpaca brokerage API with automated position sizing, mechanical exits, and a multi-rule risk layer.",
    highlights: [
      "Screens for beta-adjusted, volatility-normalized abnormal price moves, then uses LLM judgment to separate behavioral overreaction from justified moves — executing via Alpaca with automated position sizing, stop-loss/profit-target exits, and a 7-rule risk layer.",
      "Research-grade observability pipeline (SQLite) persisting every screening decision, filter verdict, and full LLM prompt/response — powering a replay engine that scores historical signals against realized market data and benchmarks each trade's alpha vs. the S&P 500, without re-incurring LLM costs.",
      "Real-time web dashboard (server-rendered Go templates, WebSocket event streaming, JSON API) plus a CLI suite for experiment comparison (Sharpe, win rate, max drawdown), with YAML-overlay experiment configs for A/B testing strategy parameters.",
    ],
    meta: { stack: ["Go", "Alpaca API", "SQLite", "WebSockets", "Multi-provider LLM"] },
    images: ["/photos/Stock_sage.png"],
  },
  {
    id: "project-agent-reed",
    layer: "professional",
    category: "project",
    label: "Agent_REED",
    description:
      "A command-line coding agent in the spirit of Claude Code, built from scratch in Python on Gemini. REED reads a codebase, plans changes, and carries them out through a tool-use loop — listing and reading files, writing edits, and executing Python — demonstrating the full agentic pattern end to end: structured tool schemas, iterative plan-act-observe cycles, and guardrails around what the agent is allowed to touch and run. Recognized as an Outstanding Coursework Project.",
    meta: { recognition: "Outstanding Coursework Project", stack: ["Python", "Gemini", "Boot.dev"] },
    link: "https://github.com/Dabrel25/Agent_REED",
    images: ["/photos/Agent_REED_photo.png"],
  },
  {
    id: "project-internal-automations",
    layer: "professional",
    category: "project",
    label: "Internal Automations",
    description:
      "The rest of my GoTyme Bank work — automating compliance workflows that used to be fully manual, and pressure-testing the architecture decisions behind them.",
    highlights: [
      "Redesigned a 9-call-per-customer adverse-media screening pipeline into a hybrid single-search plus local Python classifier, cutting API calls ~89% and per-customer cost ~76% while reducing false positives ~76% and maintaining ~95% recall. Client systems, internal data, and full implementation details withheld under NDA — described here at the same level of detail already disclosed publicly for this role.",
      "Built an automated SAR-to-STR pipeline on Databricks that converts Suspicious Activity Reports into AMLC-formatted regulatory filings for BSP compliance — orchestrating Claude (via AWS Bedrock) for structured extraction, Unity Catalog lookups for enrichment, and SharePoint delivery, eliminating a fully manual analyst workflow.",
      "Engineered the pipeline for concurrency and auditability — isolating threading to I/O-bound work, consolidating Spark calls, and logging every case to a queryable results table for compliance review.",
      "Evaluated and ruled out alternative LLM backends (Gemini, LiteLLM proxy, Databricks serving) against concrete compliance and security constraints, documenting trade-offs to guide the architecture decision.",
    ],
    meta: {
      stack: ["Python", "LLM orchestration", "AWS Bedrock", "Databricks", "Apache Spark", "Unity Catalog"],
    },
    images: ["/photos/internal-automation.jpeg"],
  },
  {
    id: "project-cashout",
    layer: "professional",
    category: "project",
    label: "CashOut",
    description:
      "A Boot.dev hackathon project that turns a photo of a receipt into clean expense data. Images are denoised and contrast-enhanced (OpenCV, CLAHE, adaptive thresholding) before OCR ever touches them, then run through Google Cloud Vision's document text detection, then handed to an OpenAI model to normalize the mess into four clean fields — merchant, item, date, amount — exported as CSV. Usable for expense tracking, bookkeeping, or tax filing straight out of the box.",
    meta: { stack: ["Python", "OpenCV", "Google Cloud Vision", "OpenAI", "Boot.dev"] },
    images: ["/photos/CashOut.png"],
  },
  {
    id: "project-showtyme",
    layer: "professional",
    category: "project",
    label: "ShowTyme Marketing Studio",
    description:
      "An internal AI marketing platform that replaced manual, ad hoc asset creation for the marketing team with an on-demand, self-serve system.",
    highlights: [
      "Trained and fine-tuned custom AI models via LoRA to generate on-brand illustration styles automatically — engineering the training dataset and captioning strategy so visual style was learned purely from images (not text hints), tuning hyperparameters to keep outputs stylistically consistent rather than photorealistic, and building a prompt-expansion engine to programmatically vary pose, framing, and composition while staying on-model.",
      "Architected and built a full-stack internal production platform (React/TypeScript, serverless backend) unifying image generation, video editing, and poster design into one tool.",
      "Shipped inpainting/mask-based image editing, AI-assisted poster design with automated copywriting, a timeline-based video editor with undo/redo, and a node-graph visual pipeline builder.",
    ],
    meta: { stack: ["React", "TypeScript", "Serverless", "FLUX LoRA"] },
    images: ["/photos/showtyme-logo.png", "/photos/showtyme-studio-2.png"],
  },
  {
    id: "project-portfolio-website",
    layer: "professional",
    category: "project",
    label: "Portfolio Website",
    description:
      "The site you're on right now — a personal knowledge graph. Instead of a static page, my work, education, and life are rendered as an explorable 3D graph (Next.js, React, Three.js) with physics-driven layout and choreographed camera framing. A Claude-powered chat guide (LangChain) answers questions about me, grounded in this same graph data, and navigates the graph to whatever it's talking about. Designed and built end to end.",
    meta: { stack: ["Next.js", "React", "TypeScript", "Three.js", "LangChain", "Claude API", "Vercel"] },
    images: ["/photos/Portfolio_Website.png"],
  },
];

// ---------------------------------------------------------------------------
// Extra skills (beyond resume.ts's skill list)
// ---------------------------------------------------------------------------

const skill = (id: string, label: string): GraphNode => ({
  id,
  layer: "professional",
  category: "skill",
  label,
});

export const extraSkillNodes: GraphNode[] = [
  skill("skill-neo4j", "Neo4j"),
  skill("skill-langchain", "LangChain"),
  skill("skill-aws-console", "AWS Console"),
  skill("skill-data-modelling", "Data modelling"),
  skill("skill-cross-functional-collaboration", "Cross-functional collaboration"),
  skill("skill-product-architecting", "Product architecting"),
  skill("skill-strategic-thinking", "Strategic thinking"),
  skill("skill-analytical-reasoning", "Analytical reasoning"),
  skill("skill-intellectual-curiosity", "Intellectual curiosity"),
];

// ---------------------------------------------------------------------------
// Learning platforms (hand-authored education nodes beyond the resume)
// ---------------------------------------------------------------------------

export const learningNodes: GraphNode[] = [
  {
    id: "education-boot-dev",
    layer: "professional",
    category: "education",
    label: "Boot.dev",
    description:
      "An online platform for learning backend development through hands-on courses and projects.",
    link: "https://www.boot.dev",
  },
];

// ---------------------------------------------------------------------------
// Overrides for resume-derived job/education nodes
// ---------------------------------------------------------------------------

export const professionalOverrides: Record<string, Partial<GraphNode>> = {
  "job-gotyme-bank": {
    description:
      "I'm currently an AI Engineer at GoTyme Bank, building production GenAI systems end to end — from re-architecting AML compliance screening around a hybrid LLM + classifier design, to automated regulatory-filing pipelines on Databricks, to a generative marketing studio running custom-trained models.",
    highlights: [
      "Re-architected the bank's adverse-media screening system (AML compliance) into a hybrid single-search + local classifier design — cutting API calls ~89% and per-customer cost ~76% while maintaining ~95% recall.",
      "Built an automated SAR-to-STR pipeline on Databricks orchestrating Claude (via AWS Bedrock) — converting Suspicious Activity Reports into AMLC-formatted regulatory filings and eliminating a fully manual analyst workflow.",
      "Designed and shipped ShowTyme Marketing Studio — a multi-studio React app with two production brand LoRAs and a multi-model generation pipeline (FLUX, Kling, GPT Image, Claude API).",
    ],
  },
  "job-it-group-inc": {
    description:
      "A first taste of enterprise systems — optimizing financial workflows in Oracle NetSuite and building real-time analytics for performance reporting.",
    images: ["/photos/itg_1.png"],
  },
  "education-ateneo-de-manila-university": {
    description:
      "B.S. Management Information Systems — graduated with Honorable Mention. Coursework: Business Process Re-Engineering, Enterprise Architecture, Data & Information Security, IT Project Management, Introduction to AI, Human-Computer Interaction.",
    meta: {
      program: "B.S. Management Information Systems | QPI: 3.37 — Graduated with Honorable Mention",
      location: "Quezon City",
      dates: "08/2021 – 06/2025",
    },
    images: ["/photos/Ateneo_Uni_1.png"],
  },
  "education-waseda-university": {
    images: ["/photos/Waseda_1.png"],
  },
};

// ---------------------------------------------------------------------------
// Explicit edges: me-links, skill usage, and cross-links
// ---------------------------------------------------------------------------

const uses = (source: string, skillIds: string[]): GraphEdge[] =>
  skillIds.map((target) => ({ source, target, label: "used" }));

export const contentEdges: GraphEdge[] = [
  // me → hobbies / community / projects
  { source: "me", target: "hobby-basketball", label: "plays" },
  { source: "me", target: "hobby-learning", label: "loves" },
  { source: "me", target: "hobby-games", label: "enjoys" },
  { source: "me", target: "community-misa", label: "member of" },
  { source: "me", target: "community-barefoot", label: "volunteers with" },
  { source: "me", target: "project-iclinicsys", label: "built" },
  { source: "me", target: "project-stock-sage", label: "built" },
  { source: "me", target: "project-agent-reed", label: "built" },
  { source: "me", target: "project-internal-automations", label: "built" },
  { source: "me", target: "project-cashout", label: "built" },
  { source: "me", target: "project-showtyme", label: "built" },
  { source: "me", target: "project-portfolio-website", label: "built" },

  // hobbies → trait skills
  { source: "hobby-basketball", target: "skill-strategic-thinking", label: "sharpens" },
  { source: "hobby-basketball", target: "skill-analytical-reasoning", label: "sharpens" },
  { source: "hobby-learning", target: "skill-intellectual-curiosity", label: "fuels" },
  { source: "hobby-games", target: "skill-intellectual-curiosity", label: "fuels" },
  { source: "hobby-games", target: "skill-analytical-reasoning", label: "sharpens" },

  // projects → skills
  ...uses("project-iclinicsys", [
    "skill-cross-functional-collaboration",
    "skill-sql-nosql",
    "skill-product-architecting",
    "skill-data-modelling",
  ]),
  ...uses("project-stock-sage", [
    "skill-go",
    "skill-llm-orchestration-agentic-ai",
    "skill-openai-gemini-apis",
    "skill-claude-api",
    "skill-sql-nosql",
    "skill-data-modelling",
    "skill-strategic-thinking",
    "skill-data-visualization",
    "skill-product-architecting",
  ]),
  ...uses("project-agent-reed", [
    "skill-python",
    "skill-openai-gemini-apis",
    "skill-llm-orchestration-agentic-ai",
    "skill-prompt-engineering",
  ]),
  // projects → learning platforms
  { source: "project-agent-reed", target: "education-boot-dev", label: "coursework from" },
  { source: "project-cashout", target: "education-boot-dev", label: "hackathon at" },
  ...uses("project-internal-automations", [
    "skill-python",
    "skill-databricks",
    "skill-apache-spark",
    "skill-unity-catalog",
    "skill-aws-bedrock",
    "skill-claude-api",
    "skill-llm-orchestration-agentic-ai",
  ]),
  ...uses("project-cashout", ["skill-python"]),
  ...uses("project-showtyme", [
    "skill-diffusion-model-flux-lora-training",
    "skill-react",
    "skill-fastapi",
    "skill-product-architecting",
    "skill-prompt-engineering",
    "skill-cross-functional-collaboration",
  ]),
  ...uses("project-portfolio-website", [
    "skill-react",
    "skill-javascript",
    "skill-html-css",
    "skill-claude-api",
    "skill-langchain",
    "skill-vercel",
  ]),

  // jobs → skills
  ...uses("job-gotyme-bank", [
    "skill-llm-orchestration-agentic-ai",
    "skill-aws-bedrock",
    "skill-databricks",
    "skill-apache-spark",
    "skill-unity-catalog",
    "skill-prompt-engineering",
  ]),
  ...uses("job-it-group-inc", ["skill-erp-oracle-netsuite", "skill-data-visualization"]),

  // cross-links: where projects happened
  { source: "project-internal-automations", target: "job-gotyme-bank", label: "built at" },
  { source: "project-showtyme", target: "job-gotyme-bank", label: "built at" },
  { source: "project-iclinicsys", target: "education-ateneo-de-manila-university", label: "thesis at" },
  { source: "project-agent-reed", target: "education-ateneo-de-manila-university", label: "coursework at" },
  { source: "community-misa", target: "education-ateneo-de-manila-university", label: "org at" },
  { source: "community-barefoot", target: "education-ateneo-de-manila-university", label: "org at" },
];
