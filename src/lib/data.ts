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
  current?: boolean;
};

export const work: WorkItem[] = [
  {
    period: "Jun 2026 — Now",
    role: "Frontend Engineer",
    org: "Compileit",
    description: "Shipping world-class product, end to end.",
    current: true,
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

/** An entry in the home page list. `href` absent = not clickable (e.g. work). */
export type HomeListItem = {
  id: string;
  title: string;
  subtitle?: string;
  preview: string;
  href?: string;
  external?: boolean;
  /** Adds a divider/spacing above this row in the list. */
  separated?: boolean;
};

/** The current role row, rendered as plain text with no link. */
export const currentRoleItem: HomeListItem = (() => {
  const role = work.find((item) => item.current) ?? work[0];
  return {
    id: "current-role",
    title: role.org.toLowerCase(),
    subtitle: role.description.toLowerCase(),
    preview: "linear-gradient(160deg, #0f0f10 0%, #3730a3 50%, #818cf8 100%)",
  };
})();
