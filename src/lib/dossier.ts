import {
  profile,
  contacts,
  experience,
  education,
  nowPlaying,
} from "@/lib/data";

/**
 * Everything the site chat is allowed to know, assembled from the same data the
 * pages render.
 *
 * Deliberately derived rather than hand-written. A second copy of the bio would
 * drift from the first the moment either changed, and the failure mode is the
 * worst kind: a chat that confidently describes a job you left. Edit
 * `src/lib/data.ts` and the answers follow.
 *
 * It now carries more than the page does. The site is one column of prose; the
 * CV behind it — every role, every date, both degrees — lives here and comes
 * out when somebody asks. That division is deliberate: the page is the pitch
 * and this is the detail, which is also what stops the chat being decoration.
 *
 * Written in the first person, because the chat answers in Erik's voice and a
 * model matches the register of what it is reading. Handed a dossier full of
 * "he", it slips into the third person mid-answer however the system prompt is
 * worded — so the conversion happens here rather than being asked for at
 * inference time. `profile.bio` is already first person; the rest follows it.
 */

/** Built once per instance. Its source is a module and cannot change under us. */
let cached: string | null = null;

function bulletList(lines: string[]) {
  return lines.map((line) => `- ${line}`).join("\n");
}

function build(): string {
  const sections = [
    `# ${profile.name}

${profile.role}. ${profile.location}.
${profile.tagline}`,

    `## In my own words

${profile.bio.join("\n\n")}`,

    `## Experience

${bulletList(
  experience.map(
    (item) => `${item.year}– · ${item.org} · ${item.role}${item.href ? ` (${item.href})` : ""}`,
  ),
)}

Note: the year is when I started there, not a span. The list is newest first
and is a curated selection, not a complete CV.`,

    `## Education

${bulletList(
  education.map(
    (item) =>
      `${item.year} · ${item.org} · ${item.degree}${item.note ? ` (${item.note})` : ""}`,
  ),
)}

I have one completed degree: the BSc in Informatics from Örebro. The master's
at Uppsala I started and then set down when the Compileit job came up — it is
not finished and there is no date on which it will be. So don't call me a
master's graduate, don't say I hold a degree in Human–Computer Interaction, and
don't describe me as currently studying. I started it and stopped; say that
plainly if it comes up, and don't dress it as a setback — it was a choice
between the degree and the job, and I took the job.`,

    `## Contact

${bulletList(contacts.map((item) => `${item.label}: ${item.href}`))}

The site also has a contact form — the "Say hi" tab in the bar at the bottom
of the page. That one reaches me directly; send people there when they want to
actually talk.`,

    `## Off the screen

Cooking, skiing, skateboarding, games, reading, and heavy music with the shows
that come with it. I live with my girlfriend and our cat.

On the music: my taste runs to metal and hardcore — for shape, the kind of
thing that turns up is ${nowPlaying
      .slice(0, 6)
      .map((track) => track.artist)
      .join(", ")}.

That list is hand-written and fixed. It is here to describe the taste and
nothing else — it is not what I am listening to, and it may be months out of
date. For anything about what I actually have on, have had on lately, or like
right now, call the now_playing tool and answer from that. Don't recite the
names above as though they were current, and don't send anyone to look at the
listening strip on the page: that reads the same Spotify account the tool does,
so there is nothing there you can't fetch yourself.`,

    `## About this site

I built it. Next.js (App Router) and React on TypeScript, Tailwind CSS v4,
Motion for the animation. The listening strip is the live Spotify API, the
contribution graph is the GitHub API, and the contact form sends through
Resend. It is deliberately one page — the detail that would have been case
studies is in here instead, which is what this chat is for.

This chat is mine too: a LangChain chain over Claude, streaming token by token
from a Next.js route handler, with the whole of the above as its context. If
somebody asks how the chat works, that's the answer — I built it to be asked
about.`,
  ];

  return sections.join("\n\n");
}

/** The full context document handed to the model on every turn. */
export function getDossier(): string {
  cached ??= build();
  return cached;
}
