export const profile = {
  name: "Erik Wijnbladh",
  role: "Tech & Design",
  location: "Stockholm, Sweden",
  email: "hello@erikwijnbladh.com",
  tagline: "I design and build web products. Living in the blend of tech and design.",
  intro:
    "I work in the blend of tech and design — owning frontends, shaping products, sweating the details that most people never notice. Away from the screen I listen to heavy music, ski, play games and skateboard.",
  bio: [
    "I'm a designer and developer based in Stockholm, currently building stuff at Compileit. I both design and build the things I work on, and that blend of tech and design is the part I enjoy.",
    "Prior I've spent my time owning the frontend of an AI ad-bidding platform at BrightBid, then went back to study Human-Computer Interaction at Uppsala to get better at making technology feel human.",
    "On the side I build small tools, apps and workflows. With, for and because of AI.",
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

export type Track = {
  title: string;
  artist: string;
};

/** Latest playing — a static list, newest first. Edit by hand. */
export const nowPlaying: Track[] = [
  { title: "Don't Reach For Me", artist: "Knocked Loose" },
  { title: "Cellar Door", artist: "Spiritbox" },
  { title: "Two-Way Mirror", artist: "Loathe" },
  { title: "Silvera", artist: "Gojira" },
  { title: "Bleed", artist: "Meshuggah" },
];

export type Experience = {
  year: string;
  org: string;
  role: string;
  href?: string;
};

/** Curated experience for the About page — start year, company, role. */
export const experience: Experience[] = [
  {
    year: "2026",
    org: "compileit",
    role: "fullstack",
    href: "https://compileit.com/",
  },
  {
    year: "2026",
    org: "kth",
    role: "frontend",
    href: "https://www.kth.se/",
  },
  {
    year: "2022",
    org: "brightbid",
    role: "frontend",
    href: "https://brightbid.com/",
  },
  {
    year: "2020",
    org: "selfcheck",
    role: "frontend",
    href: "https://selfcheck.se/",
  },
];

export type Education = {
  year: string;
  org: string;
  degree: string;
  note?: string;
  href?: string;
};

/** Education for the About page. */
export const education: Education[] = [
  {
    year: "2025",
    org: "uppsala university",
    degree: "msc human-computer interaction",
    note: "highest grade",
    href: "https://www.uu.se/en/study/programme/masters-programme-human-computer-interaction",
  },
];

/** An entry in the home page list. `href` absent = not clickable (e.g. work). */
export type HomeListItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Hover preview gradient. Omit to show no thumbnail on hover. */
  preview?: string;
  /** Named PostShader scene; takes precedence over `preview`. */
  shader?: string;
  href?: string;
  external?: boolean;
  /** Adds a divider/spacing above this row in the list. */
  separated?: boolean;
};

/** The current role row, rendered as plain text with no link. */
export const currentRoleItem: HomeListItem = {
  id: "current-role",
  title: "compileit",
  subtitle: "shipping world-class product, end to end.",
  // Preview is the compileit logo on black — see previewLogos in logos.tsx.
};
