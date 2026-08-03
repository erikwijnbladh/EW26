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
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/erik-wijnbladh",
    external: true,
  },
  {
    label: "GitHub",
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
    org: "KTH Royal Institute of Technology",
    role: "Software developer",
    summary: "dev and design for the CYVAC platform at Cybercampus Sverige",
    href: "https://www.kth.se/",
  },
  {
    year: "2022 – 2025",
    org: "BrightBid",
    role: "Front-end developer",
    summary:
      "primary frontend owner through and after the Speqta merger; consolidated two production systems into one interface",
    href: "https://brightbid.com/",
  },
  {
    year: "2020 – 2022",
    org: "Selfcheck",
    role: "Front-end developer & KTP project manager",
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
    org: "Uppsala University",
    degree: "MSc Human–Computer Interaction",
    note: "In progress",
    href: "https://www.uu.se/en/study/programme/masters-programme-human-computer-interaction",
  },
  {
    year: "2016 – 2019",
    org: "Örebro University",
    degree: "BSc Informatics",
    href: "https://www.oru.se/",
  },
];

export type Work = {
  id: string;
  title: string;
  year: string;
  kind: string;
  /** One sentence. What it is and why it exists — not a feature list. */
  blurb: string;
  href?: string;
  /**
   * The artifact shown when the row is opened. A still or a looping clip in
   * `/public/work/`, which is the only place colour enters the page. Videos
   * give `src` without an extension — both `.webm` and `.mp4` are offered.
   *
   * Until a real one is dropped in, the row opens onto an empty frame rather
   * than a stand-in gradient: a placeholder that looks like art would make the
   * colour rule read as decoration, which is exactly what it isn't.
   */
  media?: { src: string; type: "image" | "video"; alt: string };
};

/** Selected work, newest first. Kept short on purpose. */
export const work: Work[] = [
  {
    id: "pane",
    title: "Pane",
    year: "2026",
    kind: "Tool",
    blurb:
      "An infinite canvas for building React components. Change one class on ButtonRoot and five real usages move as you type — blast radius, not isolation.",
    href: "https://github.com/erikwijnbladh/pane",
    media: {
      src: "/work/pane",
      type: "video",
      alt: "Editing ButtonRoot in Pane while five buttons across two panes update at once",
    },
  },
  {
    id: "gptdnd",
    title: "gptdnd",
    year: "2026",
    kind: "System",
    blurb:
      "A campaign generator that checks its own work. Encounters print their arithmetic and a critic flags conclusions resting on fewer than three clues — rigour standing in for taste I don't have in the domain.",
    href: "https://github.com/erikwijnbladh/gptdnd",
  },
  {
    id: "brightbid",
    title: "BrightBid",
    year: "2022–25",
    kind: "Product",
    blurb:
      "Frontend owner through the Speqta merger. Two production systems consolidated into one interface, plus an audit tool that made an ad algorithm legible to the people spending against it.",
  },
  {
    id: "selfcheck",
    title: "Selfcheck",
    year: "2020–22",
    kind: "Product",
    blurb:
      "QR safety inspection for hotels and commercial property. Prototyped in Figma, tested on site with pilot clients, then built — Excel checklists turned into flows that survive a gloved hand.",
  },
];
