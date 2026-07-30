# Portfolio

Personal portfolio built with Next.js (App Router), Tailwind CSS v4, and Motion.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4
- [Motion](https://motion.dev) for animation
- Geist Sans / Geist Mono

## Getting started

```bash
npm install
npm run dev
```

## Content

Projects and writing are `.mdx` files in `content/`. Adding one puts it on the
home page list and gives it a page at `/<slug>` — nothing needs registering by
hand. Work history, education and the current role live in `src/lib/data.ts`.

### Frontmatter

| Key | Required | Notes |
|---|---|---|
| `title`, `subtitle`, `date` | yes | `date` orders the list, newest first |
| `preview` | yes | CSS gradient — the base hover art |
| `shader` | no | Named `PostShader` scene; beats `preview` |
| `video` | no | Demo clip under `public/`; beats everything |
| `link` | no | External URL — the post becomes a plain outbound link with no page |

The home page shows a 16:9 panel beside the list on hover, filled from the
first of those that's set. The order is deliberate: `video` for things with
something to *show*, `shader` for writing, where there's no demo to record and
abstract art is the honest answer rather than a placeholder. A post is complete
without a video — dropping one in later upgrades that row on its own.

### Demos in the body

`<Demo>` is a 16:9 slot inside a post, with the same optional-`src` rule:

```mdx
<Demo shader="slot" caption="What the clip will show." />
<Demo src="/demos/pane.mp4" caption="What the clip will show." />
```

Without `src` it renders the `slot` shader — a dark, dormant screen in the
site's inks, meant to read as a frame waiting to be filled rather than as a
second copy of the post's hero art. Adding `src` later swaps what's inside the
box and changes nothing around it. Write captions as statements about the idea,
not descriptions of footage, so they hold up either way.
