export const profile = {
  name: "Darrel Ethan C. Ong",
  title: "AI Engineer",
  location: "Manila, Philippines",
  phone: "+63 969 276 1256",
  email: "darrelethanong@gmail.com",
  github: "https://github.com/Dabrel25",
  linkedin: "https://linkedin.com/in/darrelong",
  summary:
    "AI engineer and hands-on builder who ships production GenAI systems end to end — from agentic LLM pipelines and custom diffusion-model training to cloud data architecture on Databricks and AWS. Comfortable owning a problem from prototype to deployment, optimizing for cost and reliability, and working across Python, Go, and JavaScript. Driven by building working solutions fast and learning new technologies by doing.",
};

export type Job = {
  company: string;
  location: string;
  role: string;
  dates: string;
  highlights: string[];
  images?: string[];
};

export const experience: Job[] = [
  {
    company: "GoTyme Bank",
    location: "Metro Manila, Philippines",
    role: "AI Engineer",
    dates: "09/2025 – Present",
    images: ["/photos/gotyme_image_1.jpeg", "/photos/GoTyme_image_2.webp"],
    highlights: [
      "Re-architected the bank's adverse-media screening system (AML compliance), replacing a 9-call-per-customer LLM design with a hybrid single-search plus a local Python classifier — cutting API calls ~89% and per-customer cost ~76% while reducing false positives ~76% and maintaining ~95% recall.",
      "Evaluated and ruled out alternative LLM backends (Gemini, LiteLLM proxy, Databricks serving) against concrete compliance and security constraints, documenting trade-offs to guide the architecture decision.",
      "Built an automated SAR-to-STR pipeline on Databricks that converts Suspicious Activity Reports into AMLC-formatted regulatory filings for BSP compliance — orchestrating Claude (via AWS Bedrock) for structured extraction, Unity Catalog lookups for enrichment, and SharePoint delivery, eliminating a fully manual analyst workflow.",
      "Engineered the pipeline for concurrency and auditability — isolating threading to I/O-bound work, consolidating Spark calls, and logging every case to a queryable results table for compliance review.",
      "Designed and shipped ShowTyme Marketing Studio, a multi-studio React app (Vercel) for AI marketing content; trained two production brand LoRAs on FLUX and built a multi-model generation pipeline (FLUX, Kling, GPT Image, Claude API) with compositing workarounds for typography and object-identity limits.",
    ],
  },
  {
    company: "IT Group Inc.",
    location: "Quezon City, Philippines",
    role: "Intern — Information Systems & Financial Process Improvement",
    dates: "01/2024 – 03/2024",
    highlights: [
      "Optimized financial data workflows in Oracle NetSuite ERP and built a real-time analytics dashboard, shifting performance reporting from a biweekly cycle to instant access and cutting report generation from ~3 hours to under 15 minutes.",
      "Authored a data-governance manual with AI-driven validation techniques, improving data accuracy ~34%, and ran a CRM workshop that lifted successful lead engagements ~27%.",
    ],
  },
];

export type Project = {
  name: string;
  description: string;
  stack: string;
  link?: string;
  highlights: string[];
};

export const projects: Project[] = [
  {
    name: "Stock Sage",
    description: "LLM-driven contrarian trading research platform",
    stack: "Go, Alpaca, SQLite, Claude",
    highlights: [
      "Built a daily pipeline that flags abnormal single-day stock moves, runs mechanical filters, then uses an LLM to judge whether each move is behavioral overreaction or justified — sizing small positions against the unjustified ones.",
      "Designed a full data-capture and replay architecture: every candidate, filter verdict, and LLM judgment is persisted so new strategies can be backtested against months of history without re-querying the model.",
    ],
  },
  {
    name: "CashOut",
    description: "Receipt-to-CSV expense extraction, built for a Boot.dev hackathon",
    stack: "Python, OpenCV, Google Cloud Vision, OpenAI",
    highlights: [
      "Denoises and contrast-enhances receipt photos (OpenCV, CLAHE, adaptive thresholding) before OCR, runs them through Google Cloud Vision's document text detection, then uses an OpenAI model to normalize the result into four clean fields — merchant, item, date, amount — exported as CSV.",
      "Usable for expense tracking, bookkeeping, or tax filing straight out of the box.",
    ],
  },
  {
    name: "Agent_REED",
    description: "Gemini-powered Python coding agent",
    stack: "Python, Gemini",
    link: "https://github.com/Dabrel25/Agent_REED",
    highlights: [
      "Built an agentic assistant that understands, edits, and executes Python code through tool-use, demonstrating hands-on experience with LLM orchestration and agentic AI patterns.",
    ],
  },
];

export type EducationEntry = {
  school: string;
  location: string;
  program: string;
  dates: string;
  detail: string;
};

export const education: EducationEntry[] = [
  {
    school: "Ateneo de Manila University",
    location: "Quezon City",
    program: "B.S. Management Information Systems | QPI: 3.37",
    dates: "08/2021 – 06/2025",
    detail:
      "Coursework: Business Process Re-Engineering, Enterprise Architecture, Data & Information Security, IT Project Management, Introduction to AI, Human-Computer Interaction.",
  },
  {
    school: "Waseda University",
    location: "Shinjuku City, Japan",
    program: "Junior Term Abroad — Student Exchange",
    dates: "03/2024 – 09/2024",
    detail:
      "Coursework: Operating Systems, Information Network Systems, Computer Language Processors, Windows/Linux Administration.",
  },
];

export const skills: { category: string; items: string[] }[] = [
  {
    category: "Languages",
    items: ["Python", "Go", "JavaScript", "SQL & NoSQL", "HTML/CSS"],
  },
  {
    category: "AI / ML",
    items: [
      "LLM orchestration & agentic AI",
      "AWS Bedrock",
      "OpenAI & Gemini APIs",
      "Claude API",
      "Diffusion-model (FLUX) LoRA training",
      "Prompt engineering",
    ],
  },
  {
    category: "AI / ML — Foundations",
    items: [
      "Tokenization",
      "Transformer architecture",
      "Attention mechanisms",
      "Pretraining & optimization",
      "Fine-tuning (SFT)",
      "RLHF & alignment",
      "Model evaluation",
      "OCR modeling",
    ],
  },
  {
    category: "Cloud & Data",
    items: [
      "AWS (Bedrock, S3)",
      "Databricks",
      "Apache Spark",
      "Unity Catalog",
      "FastAPI",
      "Vercel",
      "ERP (Oracle NetSuite)",
    ],
  },
  {
    category: "Tools",
    items: ["Git", "MySQL", "React", "Data visualization"],
  },
];

export const awards: { title: string; detail: string }[] = [
  {
    title: "ASCEND Awards Excellence Awardee (2024–2025)",
    detail:
      "Best College Project Thesis, Ateneo Socio-Civic Engagement for National Development.",
  },
];
