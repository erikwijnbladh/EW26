export const profile = {
  name: "Erik Wijnbladh",
  role: "Software Engineer",
  location: "Stockholm, Sweden",
  email: "wijnbladherik@gmail.com",
  tagline: "I build clean, considered software — interfaces first, systems underneath.",
  bio: [
    "I'm a software engineer who cares more about how things feel than how they're built — though I obsess over both. Most of my work lives at the intersection of product, design, and infrastructure.",
    "Outside of client work I build small tools, write about the craft of software, and try to keep things simple in a field that rewards complexity.",
  ],
  social: [
    { label: "GitHub", href: "https://github.com" },
    { label: "X", href: "https://x.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
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
    period: "2024 — Now",
    role: "Senior Software Engineer",
    org: "Independent",
    description: "Designing and building product for early-stage teams — full stack, from systems design to the last pixel.",
  },
  {
    period: "2022 — 2024",
    role: "Software Engineer",
    org: "Northwind Labs",
    description: "Owned the core web platform end to end. Shipped the design system still in use across the product today.",
  },
  {
    period: "2020 — 2022",
    role: "Frontend Engineer",
    org: "Studio Halvfjords",
    description: "Built marketing and product surfaces for clients across fintech and media. First hire on the engineering team.",
  },
  {
    period: "2019 — 2020",
    role: "Junior Developer",
    org: "Kiosk AB",
    description: "Started out building internal tools and learned to ship fast without breaking things.",
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
    slug: "monolith",
    title: "Monolith",
    year: "2025",
    tags: ["Next.js", "Postgres"],
    description: "A writing tool for people who think better in outlines than in pages.",
    href: "https://github.com",
  },
  {
    slug: "fieldnotes",
    title: "Fieldnotes",
    year: "2024",
    tags: ["React Native", "SQLite"],
    description: "Offline-first journaling app built for long stretches without signal.",
    href: "https://github.com",
  },
  {
    slug: "lowtide",
    title: "Lowtide",
    year: "2024",
    tags: ["TypeScript", "WebGL"],
    description: "A small rendering experiment turned into a generative art toy.",
    href: "https://github.com",
  },
  {
    slug: "atlas",
    title: "Atlas",
    year: "2023",
    tags: ["Go", "Redis"],
    description: "Internal tool for tracking infrastructure costs across a growing fleet of services.",
    href: "https://github.com",
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
