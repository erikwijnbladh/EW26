"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  contactHref,
  mentions,
  orgDetail,
  orgHref,
  profile,
  type Mention,
} from "@/lib/data";
import { duration, ease, springSoft } from "@/lib/motion";

/**
 * The places in the bio, hoverable.
 *
 * The paragraph is written as a paragraph — the copy lives in `profile.bio` as
 * plain strings, and this finds the words that happen to be places rather than
 * the prose being assembled out of fragments. Same reason the chat's answers
 * are tokenised rather than templated: one source for the sentence, two ways of
 * rendering it, and no chance of the page and the dossier drifting apart.
 */

/** How far the two cards lean apart once they're out. */
const LEAN = 7;

type Piece = {
  text: string;
  /** A place, which flares thumbnails. */
  mention?: Mention;
  /** A way of reaching him, which is just a link. */
  href?: string;
};

/**
 * The contact words in the prose. The paragraph ends by telling you how to get
 * hold of him, and a way of reaching someone that you have to retype is not
 * really a way of reaching them.
 */
const CONTACTS = [profile.email, "GitHub", "LinkedIn"];

/**
 * Splits a paragraph on the phrases worth hovering.
 *
 * A closed list, matched whole-word: the alternative is scanning prose for
 * anything that looks like a company, which on a page this short buys nothing
 * and turns an ordinary word into a link the first time the copy changes.
 */
function toPieces(text: string): Piece[] {
  const phrases = [
    ...mentions.map((m) => m.phrase),
    // Escaped: the address has dots in it, which would otherwise match anything.
    ...CONTACTS.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  ];

  // Not `\b`. That boundary is defined on [A-Za-z0-9_], so a phrase starting
  // with a letter outside it — Örebro — never sits next to one and silently
  // never matches. Unicode letter/number lookarounds do the same job for every
  // alphabet the prose might reach for.
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${phrases.join("|")})(?![\\p{L}\\p{N}])`,
    "gu",
  );

  const pieces: Piece[] = [];
  let index = 0;

  for (const match of text.matchAll(pattern)) {
    const at = match.index;
    if (at > index) pieces.push({ text: text.slice(index, at) });

    const found = mentions.find((m) => m.phrase === match[0]);

    pieces.push({
      text: match[0],
      mention: found,
      href: found
        ? undefined
        : match[0] === profile.email
          ? `mailto:${profile.email}`
          : contactHref(match[0]),
    });

    index = at + match[0].length;
  }

  if (index < text.length) pieces.push({ text: text.slice(index) });

  return pieces;
}

/**
 * Two cards fanned out of the word, like a hand being spread.
 *
 * They come out from behind the text rather than appearing beside it — both
 * start square on the same spot and lean apart, which is what makes it read as
 * one gesture instead of two things arriving.
 */
function Flare({ mention, children }: { mention: Mention; children: ReactNode }) {
  const still = useReducedMotion();
  const [open, setOpen] = useState(false);

  const href = orgHref(mention.org);
  const detail = orgDetail(mention.org);
  const cards = [0, 1];

  return (
    <span
      className="relative inline-block"
      onPointerEnter={(e) => {
        // Touch fires this on tap and then holds it until you tap elsewhere,
        // which would leave the hand stuck open over the paragraph.
        if (e.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
    >
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="underline decoration-line underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground/40"
      >
        {children}
      </a>

      <AnimatePresence>
        {open && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 block -translate-x-1/2"
          >
            {cards.map((i) => {
              const image = mention.images?.[i];
              const lean = i === 0 ? -LEAN : LEAN;

              return (
                <motion.span
                  key={i}
                  className="absolute bottom-0 left-1/2 block h-16 w-24 overflow-hidden rounded-lg shadow-ring"
                  style={{ background: mention.tone }}
                  initial={{ opacity: 0, x: "-50%", y: 10, rotate: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    // Both cards are anchored to the same centre, so the offset
                    // has to ride on the same transform that centres them.
                    x: `calc(-50% + ${lean * 2.4}px)`,
                    y: 0,
                    rotate: still ? 0 : lean,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, x: "-50%", y: 8, rotate: 0, scale: 0.94 }}
                  transition={
                    still
                      ? { duration: duration.fast, ease }
                      : { ...springSoft, delay: i * 0.04 }
                  }
                >
                  {image && (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}

                  {/* Only the front card. The one behind it is a card back —
                      repeating the same words twice would read as a glitch
                      rather than a stack. */}
                  {i === 1 && detail && (
                    <span className="absolute inset-0 flex flex-col justify-end gap-0.5 bg-foreground/45 p-2 text-left">
                      <span className="text-[11px] font-medium leading-tight text-background">
                        {detail.title}
                      </span>
                      <span className="text-[10px] leading-none text-background/70">
                        {detail.year}
                      </span>
                    </span>
                  )}
                </motion.span>
              );
            })}
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** One bio paragraph, with its places turned into hover targets. */
export function Prose({ text }: { text: string }) {
  return (
    // No width of its own: the rail decides the measure, and a second cap here
    // would be the one that silently won the day the rail changed.
    <p className="text-sm leading-relaxed text-muted">
      {toPieces(text).map((piece, i) =>
        piece.mention ? (
          <Flare key={i} mention={piece.mention}>
            {piece.text}
          </Flare>
        ) : piece.href ? (
          <a
            key={i}
            href={piece.href}
            {...(piece.href.startsWith("mailto:")
              ? {}
              : { target: "_blank", rel: "noreferrer" })}
            className="underline decoration-line underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground/40"
          >
            {piece.text}
          </a>
        ) : (
          <span key={i}>{piece.text}</span>
        ),
      )}
    </p>
  );
}
