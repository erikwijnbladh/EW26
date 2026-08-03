/**
 * Facts about Erik, transcribed from his CV. Nothing in this file is invented —
 * if something isn't verifiable from the CV it isn't here.
 *
 * `intro` and `bio` are deliberately flat and factual. They are placeholders for
 * Erik's own words, not a voice to preserve. Replace them.
 */
export const profile = {
  name: "Erik Wijnbladh",
  role: "Design engineer",
  location: "Stockholm, Sweden",
  email: "hello@erikwijnbladh.com",
  tagline: "Design engineer in Stockholm. I design and build web products.",
  // TODO(erik): rewrite in your own voice.
  intro:
    "I design and build web products. Currently a software developer at KTH, working on the CYVAC platform at Cybercampus Sverige, and studying an MSc in Human-Computer Interaction at Uppsala.",
  // TODO(erik): rewrite in your own voice.
  bio: [
    "I design and build web products, based in Stockholm.",
    "I'm a software developer at KTH Royal Institute of Technology, doing development and design for the CYVAC platform at Cybercampus Sverige. Before that I spent three years at BrightBid as the primary frontend owner, through and after the Speqta merger.",
    "I'm studying an MSc in Human-Computer Interaction at Uppsala University, after a bachelor's in Informatics at Örebro.",
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
  /** Set when the track came from Spotify. */
  url?: string;
  /** Album art. Absent on the hand-written fallback list. */
  image?: string;
};

/**
 * How many tracks the list keeps, and how many of those it shows before you
 * ask for the rest. Spotify is asked for `NOW_PLAYING_COUNT`, the first
 * `NOW_PLAYING_PREVIEW` render, and "view more" opens onto the full set.
 *
 * The count used to be read off `nowPlaying.length` below, which tied how much
 * listening history the site fetches to how many songs happened to be typed
 * out by hand — editing the fallback silently changed the live widget.
 */
export const NOW_PLAYING_COUNT = 10;
export const NOW_PLAYING_PREVIEW = 5;

/**
 * The fallback list, newest first. Edit by hand. Shown only when Spotify is
 * unconfigured or unreachable, so keep it at least `NOW_PLAYING_COUNT` long.
 */
export const nowPlaying: Track[] = [
  { title: "Don't Reach For Me", artist: "Knocked Loose" },
  { title: "Cellar Door", artist: "Spiritbox" },
  { title: "Two-Way Mirror", artist: "Loathe" },
  { title: "Silvera", artist: "Gojira" },
  { title: "Bleed", artist: "Meshuggah" },
  { title: "The Summoning", artist: "Sleep Token" },
  { title: "Animals", artist: "Architects" },
  { title: "My Own Summer", artist: "Deftones" },
  { title: "To the Hellfire", artist: "Lorna Shore" },
  { title: "Jane Doe", artist: "Converge" },
];

export type Experience = {
  /** Displayed span. Open-ended roles end in "—". */
  year: string;
  org: string;
  role: string;
  /** One line on what the work actually was. */
  summary?: string;
  href?: string;
};

/**
 * Experience, from the CV.
 *
 * Compileit starts September 2026 and is deliberately absent until then — the
 * old copy claimed it as the current role while KTH has been current since
 * June. Add the row when the job actually begins.
 */
export const experience: Experience[] = [
  {
    year: "2026 —",
    org: "kth royal institute of technology",
    role: "software developer",
    summary: "dev and design for the CYVAC platform at Cybercampus Sverige",
    href: "https://www.kth.se/",
  },
  {
    year: "2022 – 2025",
    org: "brightbid",
    role: "front-end developer",
    summary:
      "primary frontend owner through and after the Speqta merger; consolidated two production systems into one interface",
    href: "https://brightbid.com/",
  },
  {
    year: "2020 – 2022",
    org: "selfcheck",
    role: "front-end developer & ktp project manager",
    summary:
      "QR-based safety inspection system for hotels and commercial properties",
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

/** Education, from the CV. */
export const education: Education[] = [
  {
    year: "2025 – 2027",
    org: "uppsala university",
    degree: "msc human-computer interaction",
    note: "in progress",
    href: "https://www.uu.se/en/study/programme/masters-programme-human-computer-interaction",
  },
  {
    year: "2016 – 2019",
    org: "örebro university",
    degree: "bsc informatics",
    href: "https://www.oru.se/",
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
