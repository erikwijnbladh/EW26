/**
 * Facts about Erik, checked against his CV.
 *
 * `bio` is the site. There is no other page and no summary above it, so it has
 * to do the whole job in three paragraphs: what he does now, what he did before,
 * and what he's like. Everything longer than that lives in the chat, which reads
 * from the same file — the page is the pitch, the dossier is the detail.
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
  bio: [
    "I'm Erik, a developer in Stockholm. I studied informatics and interaction design rather than computer science, which is probably why I've never been able to leave the design side of anything alone.",
    "For a salary, I'm a fullstack engineer at Compileit, where we build web and app products for other companies.",
    "Before that, development and design at KTH on the CYVAC platform, and three years owning the frontend at BrightBid, an AI ads platform, where the job was making automated bidding decisions legible to the people who had to answer for them. The most recent one is this page: the icons, the motion and the chat at the bottom are mine.",
    "For fun I cook, ski, skateboard, play games and read, and go to a lot of heavy shows. The rest of the time I'm building something like this. Home is my girlfriend and our cat.",
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
    // Not a span. An end year is a promise about finishing, and this one is
    // started and set down — the note carries the state instead, everywhere the
    // year is shown.
    year: "2025",
    org: "Uppsala University",
    degree: "MSc Human–Computer Interaction",
    note: "started, paused",
    href: "https://www.uu.se/en/study/programme/masters-programme-human-computer-interaction",
  },
  {
    year: "2016 – 2019",
    org: "Örebro University",
    degree: "BSc Informatics",
    href: "https://www.oru.se/",
  },
];

export type Mention = {
  /** The words exactly as they appear in `profile.bio`. */
  phrase: string;
  /** Whose entry in `experience` or `education` carries the link. */
  org: string;
  /**
   * The gradient behind the thumbnails — and all you see until there are any.
   * Deliberately abstract: a stand-in that looked like a screenshot would be
   * claiming something about a company that hasn't been shown.
   */
  tone: string;
  /** Up to two, fanned out on hover. Drop files in `/public/mentions/`. */
  images?: { src: string; alt: string }[];
};

/**
 * The words in the bio that are worth hovering.
 *
 * Keyed to the prose rather than the other way round: the paragraph is written
 * as a paragraph, and this says which of its words happen to be places. Nothing
 * here holds a URL — that lives once, on the `experience` and `education` entry
 * the `org` names, so a company changing address can't leave the prose pointing
 * somewhere the CV doesn't.
 *
 * Only the places the bio actually names. The earlier roles and both degrees
 * are still in `experience` and `education` above, and the chat answers from
 * them — an entry here for a word the prose doesn't say would just be a flare
 * nobody can reach.
 */
export const mentions: Mention[] = [
  {
    phrase: "Compileit",
    org: "Compileit",
    tone: "linear-gradient(150deg, #1b1a16 0%, #4a4842 55%, #cbc7bf 100%)",
  },
  {
    phrase: "KTH",
    org: "KTH Royal Institute of Technology",
    tone: "linear-gradient(150deg, #1a1f2b 0%, #3f4a63 55%, #b9c2d4 100%)",
  },
  {
    phrase: "BrightBid",
    org: "BrightBid",
    tone: "linear-gradient(150deg, #21180f 0%, #6b4a22 55%, #e0cbaa 100%)",
  },
];

/**
 * What an organisation was, in the two lines a card has room for.
 *
 * The cards used to be waiting on thumbnails, which meant hovering a place got
 * you a gradient and nothing else. This is the detail that left the page with
 * the About route — the role and the span — put back where it is actually
 * being asked for. Images layer on top of it when there are any.
 */
export function orgDetail(org: string) {
  const role = experience.find((item) => item.org === org);
  if (role) return { title: role.role, year: role.year };

  // Education carries a state the jobs don't — a degree can be finished, or
  // started and set down. The card has two lines and the second one is the
  // dates, so the state rides along with them rather than going unsaid.
  const study = education.find((item) => item.org === org);
  if (study) {
    return {
      title: study.degree,
      year: study.note ? `${study.year} · ${study.note}` : study.year,
    };
  }

  return null;
}

/**
 * Where an organisation's link lives, wherever it lives.
 *
 * The bio says "KTH" and the CV says "KTH Royal Institute of Technology"; this
 * is the one place that knows they're the same place.
 */
export function orgHref(org: string) {
  const match = (item: { org: string; href?: string }) => item.org === org;
  return (
    experience.find(match)?.href ?? education.find(match)?.href ?? ""
  );
}
