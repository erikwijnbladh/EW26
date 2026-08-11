import {
  profile,
  contacts,
  experience,
  education,
  nowPlaying,
  work,
} from "@/lib/data";
import { getAllPosts } from "@/lib/content";

/**
 * Everything the site chat is allowed to know, assembled from the same data the
 * pages render.
 *
 * Deliberately derived rather than hand-written. A second copy of the bio would
 * drift from the first the moment either changed, and the failure mode is the
 * worst kind: a chat that confidently describes a job you left. Edit
 * `src/lib/data.ts` or a post in `content/`, and the answers follow.
 *
 * The posts go in whole rather than as titles. They're the only place the site
 * says anything about *how* Erik thinks, which is most of what anyone asking
 * these questions actually wants — and at this size the whole corpus is a few
 * thousand tokens, cached on the way in (see `lib/chat.ts`).
 */

/** Built once per instance. The content directory doesn't change under us. */
let cached: string | null = null;

function bulletList(lines: string[]) {
  return lines.map((line) => `- ${line}`).join("\n");
}

/**
 * MDX bodies, flattened for the prompt.
 *
 * Two things go. The JSX components (see `components/mdx.tsx`) — their text is
 * worth keeping and their tags are not, since left in they're an invitation to
 * answer in markup, and the chat replies in prose. And their heading levels get
 * pushed below the ones this file uses: a case page's own `## What I built`
 * otherwise lands in the outline as a sibling of `## Experience`, and the
 * document stops saying which project it belongs to.
 */
function plain(body: string) {
  return body
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/^#{1,6} /gm, "#### ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function build(): string {
  const posts = getAllPosts();

  const sections = [
    `# ${profile.name}

${profile.role}. ${profile.location}.
${profile.tagline}`,

    `## In his own words

${profile.bio.join("\n\n")}`,

    `## Experience

${bulletList(
  experience.map(
    (item) => `${item.year}– · ${item.org} · ${item.role}${item.href ? ` (${item.href})` : ""}`,
  ),
)}

Note: the year is when he started at that place, not a span. The list is
newest first and is a curated selection, not a complete CV.`,

    `## Education

${bulletList(
  education.map(
    (item) =>
      `${item.year} · ${item.org} · ${item.degree}${item.note ? ` (${item.note})` : ""}`,
  ),
)}`,

    `## Contact

${bulletList(contacts.map((item) => `${item.label}: ${item.href}`))}

The site also has a contact form — the "Say hi" tab in the bar at the bottom
of the page. That form reaches him directly; point people at it when they want
to actually talk.`,

    `## Off the screen

Heavy music, skiing, games, skateboarding.

On the music: the taste runs to metal and hardcore — for shape, the kind of
thing that turns up is ${nowPlaying
      .slice(0, 6)
      .map((track) => track.artist)
      .join(", ")}.

That list is hand-written and fixed. It is here to describe the taste and
nothing else — it is not what he is listening to, and it may be months out of
date. For anything about what he actually has on, has had on lately, or likes
right now, call the now_playing tool and answer from that. Don't recite the
names above as though they were current, and don't send anyone to look at the
listening strip on the page: that reads the same Spotify account the tool does,
so there is nothing there you can't fetch yourself.`,

    `## Projects

The work published on this site. Each one is real and his — quote and
summarise freely, and point people at the page it lives on.`,

    ...work.map((project) => {
      // Not every project has written up; the ones that do carry the only
      // account anywhere of how he actually thinks about building things,
      // which is most of what anyone asking these questions wants.
      const post = posts.find((entry) => entry.slug === project.id);

      return [
        `### ${project.title}`,
        `${project.kind}, ${project.year}. ${project.blurb}`,
        project.page ? `Case page on this site at /${project.id}.` : "",
        project.href ? `Lives at ${project.href}.` : "",
        post ? `\n${plain(post.body)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }),

    `## About this site

Built by Erik. Next.js (App Router) and React on TypeScript, Tailwind CSS v4,
Motion for the animation, MDX for the case pages. The listening strip is the
live Spotify API, the contribution graph is the GitHub API, and the contact
form sends through Resend.

This chat is his too: a LangChain chain over Claude, streaming token by token
from a Next.js route handler, with the whole of the above as its context. If
somebody asks how the chat works, that's the answer — he built it to be asked
about.`,
  ];

  return sections.join("\n\n");
}

/** The full context document handed to the model on every turn. */
export function getDossier(): string {
  cached ??= build();
  return cached;
}
