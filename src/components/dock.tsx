"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile, contacts } from "@/lib/data";
import { ease, easeInOut, springSnappy } from "@/lib/motion";
import { ExpandableTabs } from "@/components/ui/be-ui-expandable-tabs";
import { SayHiForm } from "@/components/say-hi";
import { LookPanel } from "@/components/look-panel";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Unspooling on. Opacity snaps in early so the line reads as being drawn. */
const drawOn = (delay = 0) => ({
  duration: 0.4,
  ease,
  delay,
  opacity: { duration: 0.1, delay },
});

/** Retracting off — the stroke shortens away instead of the icon popping. */
const drawOff = (delay = 0) => ({
  duration: 0.26,
  ease: easeInOut,
  delay,
  // Held visible until the line has almost finished retracting.
  opacity: { duration: 0.1, delay: delay + 0.18 },
});

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

const svgClass = "absolute inset-0 size-4";

/**
 * Envelope and tick share one box and never unmount — each just draws itself
 * on or retracts off as `copied` flips, so neither can pop in or out. Copying
 * retracts the envelope and draws the tick; reverting does the reverse.
 */
function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <span className="relative block size-4" aria-hidden>
      <svg viewBox="0 0 24 24" className={svgClass}>
        <motion.rect
          x="2.5"
          y="5"
          width="19"
          height="14"
          rx="3.5"
          {...stroke}
          initial={false}
          animate={{ pathLength: copied ? 0 : 1, opacity: copied ? 0 : 1 }}
          transition={copied ? drawOff() : drawOn(0.2)}
        />
        <motion.path
          d="M3.5 7.5 10.9 12.6a2 2 0 0 0 2.2 0L20.5 7.5"
          {...stroke}
          initial={false}
          animate={{ pathLength: copied ? 0 : 1, opacity: copied ? 0 : 1 }}
          transition={copied ? drawOff(0.04) : drawOn(0.3)}
        />
      </svg>

      <svg viewBox="0 0 24 24" className={svgClass}>
        <motion.path
          d="M4 12 9 17L20 6"
          {...stroke}
          initial={false}
          animate={{ pathLength: copied ? 1 : 0, opacity: copied ? 1 : 0 }}
          transition={copied ? drawOn(0.16) : drawOff()}
        />
      </svg>
    </span>
  );
}

function CogIcon({ open }: { open: boolean }) {
  const still = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="size-4"
      aria-hidden
      initial={false}
      animate={{ rotate: open ? 60 : 0 }}
      transition={still ? { duration: 0 } : springSnappy}
      style={{ originX: "50%", originY: "50%" }}
    >
      <circle cx="12" cy="12" r="3.1" {...stroke} />
      <path
        d="M12 2.6v2.1M12 19.3v2.1M21.4 12h-2.1M4.7 12H2.6M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5M18.6 18.6l-1.5-1.5M6.9 6.9 5.4 5.4"
        {...stroke}
      />
    </motion.svg>
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
                id: "say-hi",
                label: "Say hi",
                icon: <ChatIcon />,
                content: <SayHiForm onClose={close} />,
              },
              {
                id: "look",
                label: "The look",
                icon: <CogIcon open={active === "look"} />,
                content: <LookPanel onClose={close} />,
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
