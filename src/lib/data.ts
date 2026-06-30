export const profile = {
  name: "Erik Wijnbladh",
  role: "Designer & developer",
  location: "Stockholm, Sweden",
  email: "hello@erikwijnbladh.com",
  tagline: "I design and build web products — I like living in the blend of tech and design.",
  bio: [
    "I'm a designer and developer based in Stockholm, currently at Compileit. I both design and build the things I work on, and that blend of tech and design is the part I actually enjoy.",
    "I spent four years owning the frontend of an AI ad-bidding platform at BrightBid, then went back to study Human-Computer Interaction at Uppsala to get better at making technology feel human. On the side I build small tools — an AI playlist generator, an expense splitter my friends actually use, a canvas for sketching React components.",
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
    role: "fullstack engineer",
    href: "https://compileit.com/",
  },
  {
    year: "2022",
    org: "brightbid",
    role: "frontend engineer",
    href: "https://brightbid.com/",
  },
  {
    year: "2020",
    org: "selfcheck",
    role: "frontend engineer",
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
