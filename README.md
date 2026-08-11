# Portfolio

Personal portfolio built with Next.js (App Router), Tailwind CSS v4, and Motion.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4
- [Motion](https://motion.dev) for animation
- [LangChain](https://js.langchain.com) over Claude for the chat
- Geist Sans / Geist Mono

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in what you need. Everything in
there is optional except the chat, which needs `ANTHROPIC_API_KEY` — without it
the card still opens and every question comes back with "the chat isn't
switched on right now".

## Content

Edit `src/lib/data.ts` to update work history, projects, and writing.

## Chat

The "Ask" tab in the dock answers questions about Erik and declines everything
else. Four files:

| File | What it does |
| --- | --- |
| `src/lib/dossier.ts` | Assembles everything the chat is allowed to know, out of `src/lib/data.ts` and `content/*.mdx` |
| `src/lib/chat.ts` | The LangChain chain — prompt, scope rules, history trimming, model |
| `src/app/api/chat/route.ts` | Rate limit, validation, and the NDJSON token stream |
| `src/components/ask.tsx` | The card: transcript, composer, and the paced reveal |

There is no vector store on purpose. The whole corpus is under two thousand
tokens, so it goes into the system prompt in full behind a cache breakpoint —
retrieval would add a round trip per turn and the chance of fetching the wrong
three paragraphs, and buy nothing. If the writing grows by an order of
magnitude, that trade flips; until then the dossier is the retriever.

Nothing hard-codes the answers. Edit `src/lib/data.ts` or add a post to
`content/`, and the chat knows about it on the next boot.
