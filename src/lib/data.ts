export const profile = {
  name: "Erik Wijnbladh",
  role: "Frontend Engineer & Interaction Designer",
  location: "Stockholm, Sweden",
  email: "wijnbladherik@gmail.com",
  tagline: "I build interfaces and the systems behind them — design and frontend, treated as one craft.",
  bio: [
    "I'm a frontend engineer with a design eye, currently doing a master's in Human-Computer Interaction at Uppsala University. My work sits between interaction design, prototyping, and shipped product — most recently four years owning frontend delivery for an AI-driven SaaS platform at BrightBid.",
    "I care about the same problem from both sides: what a product should feel like, and what it actually takes to build that. Outside of client work I build small tools and prototypes that explore that overlap, from AI-assisted interfaces to component-level dev tooling.",
  ],
  social: [
    { label: "GitHub", href: "https://github.com/erikwijnbladh" },
    { label: "LinkedIn", href: "https://linkedin.com/in/erikwijnbladh" },
  ],
};

export type WorkItem = {
  period: string;
  role: string;
  org: string;
  description: string;
};

export const work: WorkItem[] = [
  {
    period: "Jun 2026 — Now",
    role: "Frontend Engineer",
    org: "Compileit",
    description: "Shipping world-class product, end to end.",
  },
  {
    period: "Sep 2025 — Now",
    role: "MSc Human-Computer Interaction",
    org: "Uppsala University",
    description: "Studying interaction design, service design, ethics in IT and AI, and user-centered design. Design projects with Biotopia and Uppsala Kvinnojour.",
  },
  {
    period: "Feb 2022 — Jan 2025",
    role: "Frontend Developer",
    org: "BrightBid (formerly Speqta)",
    description: "Owned frontend delivery for an AI-driven SaaS platform — UI architecture, design collaboration, and daily releases in Vue, Tailwind, and Node.js. Led the frontend build of BrightBid Audit and mentored the team as it grew to three engineers.",
  },
  {
    period: "Jul 2021 — Feb 2022",
    role: "Frontend Developer & Project Manager",
    org: "Selfcheck",
    description: "Built a mobile-first, QR-code-based interface for industrial safety workflows in Vue and Tailwind, and led customer workshops to shape onboarding and deployment.",
  },
  {
    period: "Jul 2020 — Jul 2021",
    role: "KTP Project Lead — Frontend",
    org: "Högskolan Dalarna / Selfcheck",
    description: "Joined through a structured academia-industry programme to build a customer-facing dashboard and onboarding process for enterprise deployments, ahead of the product's market launch.",
  },
];

export type Project = {
  slug: string;
  title: string;
  year: string;
  tags: string[];
  description: string;
  href?: string;
};

export const projects: Project[] = [
  {
    slug: "pane",
    title: "Pane",
    year: "2026",
    tags: ["React", "Vite", "CodeMirror"],
    description: "An infinite canvas for developing React components visually, while keeping each component a real .tsx file — spatial organization, live previews, and local-first editing.",
    href: "https://github.com/erikwijnbladh",
  },
  {
    slug: "dnd-campaign-generator",
    title: "D&D Campaign Generator",
    year: "2026",
    tags: ["React", "TypeScript", "Multi-agent AI"],
    description: "A multi-agent workflow for generating complete tabletop campaigns from a single prompt, with an interface for directing, reviewing, and controlling generated content.",
    href: "https://github.com/erikwijnbladh",
  },
];

export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  shade: string;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "on-doing-less",
    title: "On doing less",
    date: "2026-04-12",
    excerpt: "Most of the work I'm proud of is what I chose not to build.",
    shade: "linear-gradient(160deg, #2b2a27 0%, #6b6a64 55%, #d8d6d1 100%)",
    body: [
      "Most of the work I'm proud of is what I chose not to build. The feature that stayed a draft, the integration that got cut, the settings page that never shipped because the default was already right.",
      "Restraint doesn't show up in a changelog, which is exactly why it's undervalued. Every line of code is a liability — something to maintain, explain, and eventually delete. The best engineers I know spend as much energy arguing things out of scope as they do shipping.",
      "I've started treating 'no' as a deliverable. It has its own quality bar, the same way a pull request does.",
    ],
  },
  {
    slug: "a-quiet-stack",
    title: "A quiet stack",
    date: "2026-02-03",
    excerpt: "Why boring infrastructure is the most exciting decision you can make.",
    shade: "linear-gradient(160deg, #15140f 0%, #4a4943 45%, #b8b6b0 100%)",
    body: [
      "Every new project tempts you with the same question: what if this is the one where you finally use the new database, the new framework, the new everything?",
      "I've learned to be suspicious of that feeling. The projects I'm happiest with run on the most boring stack I could find — tools old enough to have stopped surprising me.",
      "Boring doesn't mean lazy. It means the interesting decisions are reserved for the part of the system that's actually novel, instead of being spent re-litigating how to run a database.",
    ],
  },
  {
    slug: "designing-in-the-browser",
    title: "Designing in the browser",
    date: "2025-11-19",
    excerpt: "I stopped designing in Figma a year ago. Here's what changed.",
    shade: "linear-gradient(160deg, #3a392f 0%, #847f6e 50%, #e4e0d6 100%)",
    body: [
      "I stopped designing in Figma a year ago. Not because the tool got worse, but because the gap between what I drew and what I shipped kept growing.",
      "Working directly in the browser means every decision is made under the real constraints — real type rendering, real motion, real data. It's slower at first and faster by the third iteration.",
      "The side effect I didn't expect: the work looks less designed. Less composed. I think that's a good sign.",
    ],
  },
  {
    slug: "notes-on-craft",
    title: "Notes on craft",
    date: "2025-08-27",
    excerpt: "A running list of things I believe about making software, revised often.",
    shade: "linear-gradient(160deg, #1c1b17 0%, #5c5a52 55%, #cfccc4 100%)",
    body: [
      "A running list, revised often. Right now: software should feel considered, not assembled. Most bugs are communication failures wearing a stack trace. The fastest way to learn a system is to try to delete part of it.",
      "Constraints are a gift if you choose them, and a cage if they're chosen for you — the work is telling the difference.",
      "None of this is fixed. I'll disagree with half of it by next year, which is sort of the point of writing it down.",
    ],
  },
];
