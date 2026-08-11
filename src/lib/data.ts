/**
 * Facts about Erik, checked against his CV.
 *
 * `intro` is the short version on the home page. `bio` is the About page: still
 * personal, but with enough detail to make the experience list mean something.
 *
 * ⚠️ Written for publication in or after September 2026, when Compileit starts.
 * Everything here speaks about that role in the present tense, which is true on
 * the intended publish date and not before it. Don't deploy early.
 */
export const profile = {
  name: "Erik Wijnbladh",
  role: "Design engineer",
  location: "Stockholm, Sweden",
  email: "hello@erikwijnbladh.com",
  tagline: "Currently building products people love to use at Compileit.",
  intro:
    "I build digital products and care a lot about the parts people actually use. How they look, move and feel.",
  bio: [
    "I'm a fullstack developer at Compileit in Stockholm, building web and app products for clients. I started out in frontend and never really stopped caring about the design side of it. I like figuring out how something should work and then building it.",
    "Before Compileit I had a short stint at KTH building the CYVAC platform. Prior to that I spent the better part of three years at BrightBid, on an AI bidding product where I built the interface people actually used it through — the login, the endpoints, the tables that had to flex correctly. I worked closely with designers the whole time.",
    "I studied Informatics at Örebro and later Human–Computer Interaction at Uppsala, which gives me a multidisciplinary way of building things and designing them.",
    "On the side I build experiments with AI, design and tech, usually because I want to see what happens.",
    "When I'm not at a screen I listen to heavy music, ski, play games and skateboard.",
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

/**
 * A contact's href by label, matched case-insensitively.
 *
 * The labels are display strings — they read "GitHub" because that is how it is
 * written, not because anything keys off the capitals. Matching exactly meant a
 * label being retitled silently emptied every href built from it, which is a
 * link that looks fine and reloads the page.
 */
export function contactHref(label: string) {
  const wanted = label.toLowerCase();
  return contacts.find((item) => item.label.toLowerCase() === wanted)?.href ?? "";
}

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
  href?: string;
};

/** Experience, from the CV. Compileit leads it from September 2026. */
export const experience: Experience[] = [
  {
    year: "2026 —",
    org: "Compileit",
    role: "Fullstack developer",
    href: "https://compileit.com/",
  },
  {
    year: "2026",
    org: "KTH Royal Institute of Technology",
    role: "Software developer",
    href: "https://www.kth.se/",
  },
  {
    year: "2022 – 2025",
    org: "BrightBid",
    role: "Front-end developer",
    href: "https://brightbid.com/",
  },
  {
    year: "2020 – 2022",
    org: "Selfcheck",
    role: "Front-end developer & KTP project manager",
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
  /** Named PostShader scene, drawn in the hover preview. */
  shader?: string;
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
    blurb: "Change one class, five usages move as you type.",
    shader: "prism",
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
    blurb: "A campaign generator that checks its own work.",
    shader: "ember",
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
  /** Named PostShader scene for the hover preview. */
  shader?: string;
  media?: Work["media"];
};

/**
 * The home page list, top to bottom: where Erik works, then what he's built,
 * then the page with the long version.
 *
 * Compileit sits at the head as the current role — see the publish-date note
 * at the top of this file. The rest of the history lives on the About page.
 */
export const homeRows: HomeRow[] = [
  {
    id: "compileit",
    title: "Compileit",
    blurb: "Building products people love and businesses grow with.",
  },
  ...work.map((item) => ({
    id: item.id,
    title: item.title,
    blurb: item.blurb,
    href: item.page ? `/${item.id}` : item.href,
    external: !item.page,
    shader: item.shader,
    media: item.media,
  })),
  {
    id: "about",
    title: "About",
    href: "/about",
    separated: true,
  },
];
