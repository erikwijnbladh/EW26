/**
 * Facts about Erik, checked against his CV.
 *
 * `intro` is the home page and carries the voice — first person, personal,
 * short. `bio` is the About page and is allowed to be formal: it sits above the
 * experience and education lists and reads as the prose half of a CV.
 *
 * Neither is a placeholder any more, but both are still worth rewriting in your
 * own words — what's here is your earlier draft with the facts corrected.
 */
export const profile = {
  name: "Erik Wijnbladh",
  role: "Design engineer",
  location: "Stockholm, Sweden",
  email: "hello@erikwijnbladh.com",
  tagline: "Design engineer in Stockholm. I design and build web products.",
  // The earlier, more personal draft — kept, with "currently at Compileit"
  // corrected. Compileit starts in September; KTH is the current job.
  intro:
    "I'm a designer and developer based in Stockholm, currently building things at KTH and joining Compileit in September. I both design and build the things I work on, and that blend of tech and design is the part I enjoy. Away from the screen I listen to heavy music, ski, play games and skateboard.",
  bio: [
    "I'm a designer and developer based in Stockholm. I both design and build the things I work on, and that blend of tech and design is the part I enjoy.",
    "Right now I'm a software developer at KTH Royal Institute of Technology, doing development and design for the CYVAC platform at Cybercampus Sverige, and I join Compileit in September. Before that I spent three years at BrightBid owning the frontend of an AI ad-bidding platform, through and after the Speqta merger — consolidating two production systems into one interface and building an audit tool that made an opaque algorithm legible to the people spending against it.",
    "I went back to study Human-Computer Interaction at Uppsala to get better at making technology feel human, after a bachelor's in Informatics at Örebro.",
    "On the side I build small tools, apps and workflows. With, for and because of AI.",
    // Erik's own words, from describing why the site is as spare as it is.
    // Edit freely — the point is that the position is stated somewhere.
    "I'd rather ship one small thing that's properly made than a lot of things that aren't. This site is deliberately sparse: the craft is meant to be in the interactions rather than the volume — the icons that draw themselves on, the transitions, the widgets that do something real. Restraint as taste.",
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
  /**
   * One short line. This renders as a row subtitle in a half-width column, so
   * anything past about eight words wraps into a paragraph and the list stops
   * scanning as a list.
   */
  blurb: string;
  /** Set when the project has a case page at `/{id}`. */
  page?: boolean;
  /** Repository or live link, shown on the case page. */
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

/** Projects with something to show. Employment lives on the About page. */
export const work: Work[] = [
  {
    id: "pane",
    title: "Pane",
    year: "2026",
    kind: "Tool",
    blurb: "change one class, five usages move as you type",
    page: true,
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
    blurb: "a campaign generator that checks its own work",
    page: true,
    href: "https://github.com/erikwijnbladh/gptdnd",
  },
];

export type HomeRow = {
  id: string;
  title: string;
  blurb?: string;
  /** Absent = rendered as plain text rather than a link. */
  href?: string;
  external?: boolean;
  /** Opens a gap above the row, to group what follows. */
  separated?: boolean;
  media?: Work["media"];
};

/**
 * The home page list, top to bottom: where Erik works, then what he's built,
 * then the page with the long version.
 *
 * Compileit sits at the head as the current role. It starts in September, so
 * the row says so rather than implying he's there now — KTH is on the About
 * page with the rest of the history.
 */
export const homeRows: HomeRow[] = [
  {
    id: "compileit",
    title: "compileit",
    blurb: "shipping world-class product, end to end — from september",
  },
  ...work.map((item) => ({
    id: item.id,
    title: item.title,
    blurb: item.blurb,
    href: item.page ? `/${item.id}` : item.href,
    external: !item.page,
    media: item.media,
    separated: item.id === work[0]?.id,
  })),
  {
    id: "about",
    title: "about",
    blurb: "the longer version — experience, education, contact",
    href: "/about",
    separated: true,
  },
];
