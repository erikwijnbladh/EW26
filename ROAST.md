# Roast: the homepage

Requested. Delivered. Findings are real, the tone is not gentle.

---

## 1. It is a portfolio with no portfolio in it

Every link on `/`, in full:

| Link | Goes to |
|---|---|
| `erik wijnbladh` | `/` — itself |
| `Claude` | claude.com |
| `Paper` | paper.design |
| (GitHub icon) | github.com |
| (LinkedIn icon) | linkedin.com |

Five links. One is a loop. Two are ads for other people's products. The
remaining two are off-site profiles. **Zero point to anything you made.**

Meanwhile, sitting in the repo, fully built, completely unreachable:

- `content/pane.mdx` — an infinite canvas for building React components
- `content/dnd-campaign-generator.mdx` — a multi-agent campaign generator
- `content/judgement-and-taste.mdx` — an essay
- `content/designing-for-intelligence.mdx` — an essay
- `/about` — bio, experience, education

`src/app/[slug]/page.tsx` renders those posts beautifully. `getPagePosts()`
prerenders all four. The detail page even has a "next →" link to walk between
them. There is no first door. The only way in is to already know the URL.

`src/components/home-list.tsx` is the component that used to show them — 100
lines, hover previews, a swooping dot indicator, per-post shader art. It is
imported by nothing. `src/components/logos.tsx` exists only to feed it. Both
are dead code. `currentRoleItem` in `data.ts` is exported, typed, commented,
and referenced nowhere.

You wrote the shelf, you wrote the books, you deleted the shelf.

---

## 2. 41% of the codebase is the music widget

```
latest-playing.tsx    567
spotify.ts            402
playing-section.tsx   147
deck.ts               152
use-playing.ts        134
                    -----
                     1402   of 3448 total lines
```

`src/app/page.tsx`, the actual homepage, is 65 lines.

Of the last 20 commits, roughly fifteen are Spotify:

> "Stop presenting the live track as the newest row of a history"
> "Keep the track when the player is paused"
> "Hold the last track when the session goes idle"
> "Put the live track back at the head of one deck"
> "Give the deck geometry a home both sides can reach"

`deck.ts` has a 22-line comment explaining why the tuck constant lives in its
own module. `spotify.ts` has a 15-line docstring on the *shape of the return
type*. There is a paragraph of prose justifying the choice between `null` and
`[]`. It is genuinely excellent engineering, and it is in service of telling
strangers you listened to Knocked Loose.

Nobody has ever hired anyone because of their `recently-played` endpoint.

---

## 3. Nothing on the page is selectable

`globals.css`:

```css
body { user-select: none; }

/* Posts are for reading — let people select and copy the text. */
article { user-select: text; }
```

The homepage contains no `<article>`. So on `/`, a visitor cannot select your
name, your intro, your employer, or a track title. Try to copy "Compileit" to
paste into a search — you can't.

You then shipped a dedicated **Copy email** button in the dock, with a hand-
animated envelope-to-checkmark stroke transition, to solve a problem that only
exists because of the line above it.

---

## 4. The dock lands on top of the content

At 1440×900, scrolled to top: the floating dock covers **"VIEW MORE (10)"**.
Not near it — on it. The word is half gone behind the glass.

The dock is `fixed bottom-0 inset-x-0 flex justify-center`. The page column is
`max-w-md mx-auto`. Both are centred, both about the same width, so the dock is
permanently parked over the content column rather than beside it. `pb-40` on
the page clears the *bottom* of the document — but the page is only 1297px
tall, so on a laptop viewport there is nothing to scroll and the collision
never resolves.

Also affected on mobile: same overlap, same control.

---

## 5. The greys fail contrast

`--muted` is `#6b6a64` on `#f4f3f1` — **4.85:1**. Passes AA by 0.35.

But the labels use `text-muted/70`, which composites to roughly `#948f8e`:
**2.77:1**. That fails AA (4.5:1 required), and it isn't large text — it's
12px and 10px:

- `GITHUB ACTIVITY`
- `LATEST PLAYING`
- `Less` / `More`
- every month label on the graph
- `Built with`

And `LEVELS[0]` for empty contribution days is `bg-foreground/[0.06]` —
about 1.05:1 against the page. Invisible. Which is arguably the intent, but it
means the graph's baseline reads as a hole rather than a floor.

The whole palette is beautiful in a Figma frame and marginal on a laptop
outdoors.

---

## 6. The photo is the entire first screen

`aspect-[7/6]` at `max-w-md`, top of the page, above everything. At 1440×900 it
occupies the fold almost by itself. A visitor's first screen of a *designer and
developer's* portfolio is a greyscale headshot and a nav bar.

The photo is also `priority` + `quality={90}` — you added a custom
`images.qualities: [75, 90]` entry to `next.config.ts` specifically to serve
this one image at higher quality. It's a good photo. It's not the product.

---

## 7. Smaller ones, rapid fire

- **The metadata title is `designer & developer`. The `role` in `data.ts` is
  `"Tech & Design"`. The intro says `"designer and developer"`. The tagline
  says `"the blend of tech and design"`.** Four descriptions of one person, no
  two the same.
- **No OG image.** `public/` contains exactly one file: `pfp.png`. Share the
  site in Slack and you get a grey rectangle. `metadataBase` is set, which
  means you thought about this and stopped.
- **No `sitemap.ts`, no `robots.ts`.** With four unlinked posts, crawlers have
  no path to them either. They are invisible to Google *and* to humans.
- **`README.md` says "Edit `src/lib/data.ts` to update work history, projects,
  and writing."** Projects and writing moved to `content/*.mdx` some time ago.
  The README is documenting a homepage that no longer exists — which is at
  least consistent with the homepage documenting work that no longer appears.
- **The nav is one link to the page you're already on.** No `/about`. No work.
  The `<header>` is a horizontal rule with your name on it.
- **`grain` animates a full-screen 200%×200% layer at 1.1s `steps(4)` forever.**
  You correctly disabled it on touch and for reduced-motion, and then left it
  running permanently on every desktop, at 4% opacity, for a texture nobody can
  see and no one asked for.
- **`getContributions` scrapes GitHub's HTML** with hand-rolled regexes over
  `<td>` tags and `<tool-tip>` elements. It's defensively written and returns
  `null` on everything. It will still break the first time GitHub ships a
  markup change, and the graph will vanish with no signal.
- **The GitHub graph is the only evidence of output on the page** — and it
  proves you commit a lot, which is the least interesting true thing about a
  designer.

---

## What's actually good

Not everything is a crime.

- The reasoning in the comments is better than in most production codebases.
  `playing-section.tsx` explaining *why* the `Suspense` boundary is inside the
  `Reveal` rather than around it is the kind of note that saves someone an hour
  in a year.
- The PPR setup is correct and deliberate: static shell, one request-time hole,
  `use cache` on the contributions fetch to keep it off the dynamic path.
- The skeleton is built from the real deck constants instead of eyeballed
  numbers, so nothing jumps when the strip streams in. Almost nobody does this.
- The palette, the grain, the shadow-ring, the dock glass — the craft is
  genuinely there.
- Falling back to a hand-written track list when Spotify is down, and never
  claiming to be *playing* the fallback, is a real bit of taste.

The problem isn't skill. The problem is that all of it is pointed at the least
consequential 20% of the page.

---

## The one-line version

You built a Spotify widget with a portfolio-shaped background, put a
1402-line music player in front of four unreachable projects, disabled text
selection, and parked a floating dock on top of the only interactive control.
It's the best-engineered page I've seen that doesn't tell anyone what you do.

## The fix, in priority order

1. Put `HomeList` back on `/` with the four posts and the `compileit` row.
   The component still works. It's a two-line import.
2. Add `/about` to the nav.
3. Move the dock off the content column, or give the page enough bottom
   padding at short viewport heights that it can scroll clear.
4. Delete `user-select: none` from `body`. Keep the copy-email button anyway,
   it's nice.
5. Raise `text-muted/70` to at least `text-muted` on anything under 14px.
6. Add an OG image and a `sitemap.ts`.
7. Shrink the photo, or move it below the work.
8. Freeze the Spotify widget. It is finished. It has been finished for eight
   commits.
