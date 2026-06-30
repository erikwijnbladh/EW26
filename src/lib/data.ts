export const profile = {
  name: "Erik Wijnbladh",
  role: "Fullstack Engineer & Interaction Designer",
  location: "Stockholm, Sweden",
  email: "hello@erikwijnbladh.com",
  tagline: "I build interfaces and the systems behind them — design and engineering, treated as one craft.",
  bio: [
    "I'm a fullstack engineer and interaction designer based in Stockholm, currently building at Compileit. I like working across the whole surface of a product — interaction design, frontend, and the systems underneath.",
    "Before Compileit I spent four years owning frontend for an AI-driven SaaS platform at BrightBid, alongside a master's in Human-Computer Interaction at Uppsala. On the side I build small tools and prototypes — from AI-assisted interfaces to component-level dev tooling — to explore where design and engineering meet.",
  ],
};

/** Contact list for the About page. */
export const contacts = [
  { label: "hello@erikwijnbladh.com", href: "mailto:hello@erikwijnbladh.com" },
  {
    label: "linkedin",
    href: "https://www.linkedin.com/in/erik-wijnbladh",
    external: true,
  },
  {
    label: "github",
    href: "https://github.com/erikwijnbladh",
    external: true,
  },
];

export type Experience = { year: string; org: string; role: string };

/** Curated experience for the About page — start year, company, role. */
export const experience: Experience[] = [
  { year: "2026", org: "compileit", role: "fullstack engineer" },
  { year: "2022", org: "brightbid", role: "frontend engineer" },
  { year: "2020", org: "selfcheck", role: "frontend engineer" },
];

export type Education = {
  year: string;
  org: string;
  degree: string;
  note?: string;
};

/** Education for the About page. */
export const education: Education[] = [
  {
    year: "2025",
    org: "uppsala university",
    degree: "msc human-computer interaction",
    note: "highest grade",
  },
];

/** An entry in the home page list. `href` absent = not clickable (e.g. work). */
export type HomeListItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Hover preview gradient. Omit to show no thumbnail on hover. */
  preview?: string;
  href?: string;
  external?: boolean;
  /** Adds a divider/spacing above this row in the list. */
  separated?: boolean;
};

/** The current role row, rendered as plain text with no link. */
export const currentRoleItem: HomeListItem = (() => {
  return {
    id: "current-role",
    title: "compileit",
    subtitle: "shipping world-class product, end to end.",
    preview: "linear-gradient(160deg, #0f0f10 0%, #3730a3 50%, #818cf8 100%)",
  };
})();
