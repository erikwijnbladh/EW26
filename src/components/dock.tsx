"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile, contacts } from "@/lib/data";
import { ease } from "@/lib/motion";
import { ExpandableTabs } from "@/components/ui/be-ui-expandable-tabs";
import { SayHiForm } from "@/components/say-hi";
import { AskPanel } from "@/components/ask";
import { CopyIcon } from "@/components/copy-icon";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * The bot, blinking.
 *
 * Built on the same principle as the copy button below — one box, nothing ever
 * unmounts, states are reached by drawing strokes on and retracting them —
 * except the interesting thing about this icon is that it's a face, so it
 * blinks instead of swapping glyphs. The eyes retract to nothing and come back
 * on a slow loop, a hair out of step with each other so it reads as a blink
 * rather than two shutters closing.
 *
 * Opening the card wakes it: the antenna redraws itself, and the blink speeds
 * up. It goes back to idling when the card closes.
 */
function BotIcon({ awake }: { awake: boolean }) {
  const still = useReducedMotion();

  /**
   * Open, hold, shut, open — the hold is most of it, which is what a blink is.
   *
   * Not `pathLength`, which is what the copy button below retracts its strokes
   * with. Motion animates that as a scalar target only; handed a keyframe array
   * it sets the last value and never moves, which is a silent no-op rather than
   * an error. `scaleY` does the closing and `opacity` covers the last hair of
   * it, since a 2px stroke scaled to nothing still leaves a cap behind.
   */
  const eye = { scaleY: [1, 1, 0.05, 1, 1], opacity: [1, 1, 0.15, 1, 1] };

  const blink = (offset: number) => ({
    duration: awake ? 3.4 : 6.2,
    times: [0, 0.9, 0.94, 0.98, 1],
    // A named curve, not the shared `easeInOut` tuple. With five keyframes
    // Motion reads a four-element array as one easing per segment, and
    // `[0.65, 0, 0.35, 1]` is four numbers — so the bezier this file uses
    // everywhere else is silently taken as four nonsense easings.
    ease: "easeInOut" as const,
    repeat: Infinity,
    // Applied once, so after the first pass the two eyes stay this far apart.
    delay: offset,
  });

  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      {/* Antenna. Redraws itself on waking — the keyframe pair is what makes a
          prop flip replay it, where a bare target would just already be there. */}
      <motion.path
        d="M12 8V4H8"
        {...stroke}
        initial={false}
        animate={{ pathLength: awake && !still ? [0, 1] : 1 }}
        transition={{ duration: 0.42, ease }}
      />

      <rect x="4" y="8" width="16" height="12" rx="2" {...stroke} />
      <path d="M2 14h2" {...stroke} />
      <path d="M20 14h2" {...stroke} />

      {/* `fill-box` so each eye scales about its own centre rather than the
          whole 24-unit canvas, which would slide it up the face instead. */}
      <motion.path
        d="M9 13v2"
        {...stroke}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        initial={{ scaleY: 1, opacity: 1 }}
        animate={still ? { scaleY: 1, opacity: 1 } : eye}
        transition={still ? undefined : blink(0)}
      />
      <motion.path
        d="M15 13v2"
        {...stroke}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        initial={{ scaleY: 1, opacity: 1 }}
        animate={still ? { scaleY: 1, opacity: 1 } : eye}
        transition={still ? undefined : blink(0.07)}
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M12 3c5 0 9 3.4 9 7.6s-4 7.6-9 7.6a10.7 10.7 0 0 1-2.6-.3L5 20.4l.5-3.4C3.9 15.6 3 13.4 3 10.6 3 6.4 7 3 12 3Z"
        {...stroke}
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path d="M10 20.567C6.571 21.725 3.714 20.567 2 17" {...stroke} />
      <path
        d="M10 22v-3.242a2.4 2.4 0 0 1 .48-1.588c.204-.322.064-.78-.303-.881C7.134 15.453 5 14.108 5 9.646c0-1.16.38-2.25 1.048-3.2.166-.236.249-.354.269-.461.02-.107-.014-.246-.084-.526a5.5 5.5 0 0 1 .16-3.431s.877-.286 2.874.962c.456.284.684.427.885.459.2.032.469-.035 1.005-.169A6.6 6.6 0 0 1 13.5 3c.852 0 1.609.098 2.343.28.536.134.805.201 1.006.169.2-.032.428-.175.884-.459 1.997-1.248 2.874-.962 2.874-.962a5.5 5.5 0 0 1 .16 3.431c-.07.28-.104.42-.084.526.02.107.103.225.269.462A5.4 5.4 0 0 1 22 9.646c0 4.462-2.134 5.807-5.177 6.643-.367.101-.507.559-.303.881.296.47.48.99.48 1.588V22"
        {...stroke}
      />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" {...stroke} />
      <path d="M7 10.5V17" {...stroke} />
      <path d="M11 17v-4a3 3 0 0 1 6 0v4M11 13v-2.5" {...stroke} />
      <path d="M7.01 7H7" {...stroke} strokeWidth={2} />
    </svg>
  );
}

const contactHref = (label: string) =>
  contacts.find((c) => c.label === label)?.href ?? "";

/**
 * The floating bar: one expanding tab (the form) and three plain icon actions,
 * all inside the ExpandableTabs shell so they share its styling and timing.
 */
export function Dock() {
  const [active, setActive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const close = useCallback(() => setActive(null), []);

  const copyEmail = useCallback(() => {
    void navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, []);

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="pointer-events-none fixed inset-0 z-40 bg-foreground/[0.07]"
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          className="pointer-events-auto"
        >
          <ExpandableTabs
            value={active}
            onValueChange={setActive}
            classNames={{
              root: `dock border-transparent ${active ? "dock-open" : ""}`,
              // The gap lives in the component now: it's baked into the closed
              // shell's width, so overriding it here made the two disagree.
              pill: "bg-foreground/[0.08]",
            }}
            items={[
              {
                id: "ask",
                label: "Ask",
                icon: <BotIcon awake={active === "ask"} />,
                content: <AskPanel open={active === "ask"} />,
              },
              {
                id: "say-hi",
                label: "Say hi",
                icon: <ChatIcon />,
                content: <SayHiForm onClose={close} />,
              },
              {
                id: "email",
                label: copied ? "Copied" : "Copy email",
                icon: <CopyIcon copied={copied} />,
                onClick: copyEmail,
              },
              {
                id: "github",
                label: "GitHub",
                icon: <GithubIcon />,
                href: contactHref("github"),
                external: true,
              },
              {
                id: "linkedin",
                label: "LinkedIn",
                icon: <LinkedinIcon />,
                href: contactHref("linkedin"),
                external: true,
              },
            ]}
          />
        </motion.div>
      </div>
    </>
  );
}
