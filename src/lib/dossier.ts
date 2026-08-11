import {
  profile,
  contacts,
  experience,
  education,
  nowPlaying,
  currentRoleItem,
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
 * MDX bodies carry a handful of JSX components (see `components/mdx.tsx`).
 * Their text is worth keeping and their tags are not — left in, they're an
 * invitation to answer in markup, and the chat replies in prose.
 */
function plain(body: string) {
  return body
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
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

    `## Currently

${currentRoleItem.title} — ${currentRoleItem.subtitle ?? ""}`.trim(),

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

Heavy music, skiing, games, skateboarding. A recent listening sample:
${nowPlaying
  .slice(0, 6)
  .map((track) => `${track.title} — ${track.artist}`)
  .join("; ")}.
(The site shows what he's actually playing, pulled live from Spotify, so this
list is only a flavour of the taste, not today's tracklist.)`,

    `## Writing and projects

These are the pieces published on this site. Each is real work or a real
opinion of his — quote and summarise freely, and point people at the page.`,

    ...posts.map(
      (post) => `### ${post.title}
${post.subtitle}
Published ${post.date.slice(0, 10)}. ${
        post.link ? `Lives at ${post.link}` : `On this site at /${post.slug}`
      }

${plain(post.body)}`,
    ),

    `## About this site

Built by Erik. Next.js (App Router) and React on TypeScript, Tailwind CSS v4,
Motion for the animation, MDX for the writing. The listening strip is the live
Spotify API, the contribution graph is the GitHub API, and the contact form
sends through Resend.

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
