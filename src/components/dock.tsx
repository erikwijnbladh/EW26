"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile, contacts } from "@/lib/data";
import { duration, ease, springSnappy, springSoft } from "@/lib/motion";
import { SayHi, SAY_HI_LAYOUT_ID } from "@/components/say-hi";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="3.5" {...stroke} />
      <path d="M3.5 7.5 10.9 12.6a2 2 0 0 0 2.2 0L20.5 7.5" {...stroke} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <motion.path
        d="m5 12.5 4.5 4.5L19 7"
        {...stroke}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease }}
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
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
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" {...stroke} />
      <path d="M7 10.5V17" {...stroke} />
      <path d="M11 17v-4a3 3 0 0 1 6 0v4M11 13v-2.5" {...stroke} />
      <path d="M7.01 7H7" {...stroke} strokeWidth={2} />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M12 3c5 0 9 3.4 9 7.6s-4 7.6-9 7.6a10.7 10.7 0 0 1-2.6-.3L5 20.4l.5-3.4C3.9 15.6 3 13.4 3 10.6 3 6.4 7 3 12 3Z"
        {...stroke}
      />
    </svg>
  );
}

/** Look up a contact URL by its label in `contacts`. */
const contactHref = (label: string) =>
  contacts.find((c) => c.label === label)?.href ?? "";

const itemClass =
  "relative grid size-10 place-items-center rounded-full text-foreground/75 transition-colors duration-150 hover:text-foreground";

/**
 * One dock slot: springs under the cursor, dips on press, and floats its label
 * above itself on hover or keyboard focus.
 */
function DockItem({
  label,
  children,
  onClick,
  href,
  external,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}) {
  const [active, setActive] = useState(false);
  const still = useReducedMotion();

  const interaction = still
    ? {}
    : { whileHover: { scale: 1.12, y: -2 }, whileTap: { scale: 0.92, y: 0 } };

  const shared = {
    className: itemClass,
    "aria-label": label,
    onMouseEnter: () => setActive(true),
    onMouseLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
    transition: springSnappy,
    ...interaction,
  };

  const inner = (
    <>
      {/* Hover pill, faded in behind the icon. */}
      <AnimatePresence>
        {active && (
          <motion.span
            className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.07]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: duration.fast, ease }}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );

  return (
    <div className="relative">
      <AnimatePresence>
        {active && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={springSnappy}
            className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs text-background"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {href ? (
        <motion.a
          {...shared}
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : null)}
        >
          {inner}
        </motion.a>
      ) : (
        <motion.button {...shared} type="button" onClick={onClick}>
          {inner}
        </motion.button>
      )}
    </div>
  );
}

/**
 * Floating dock — the only chrome on the site. Holds the face, the "what's up"
 * form and the two places I keep things.
 */
export function Dock() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const still = useReducedMotion();

  const copyEmail = useCallback(() => {
    void navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, []);

  return (
    <>
      <SayHi open={open} onClose={() => setOpen(false)} />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-5 sm:p-8">
        <motion.nav
          aria-label="Shortcuts"
          initial={still ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springSoft, delay: 0.35 }}
          className="dock pointer-events-auto flex h-15 items-center gap-1 rounded-full px-2.5"
        >
          <Link
            href="/"
            aria-label="Home"
            className="shrink-0 rounded-full transition-opacity duration-150 hover:opacity-75"
          >
            <Image
              src="/images/pfp.png"
              alt={profile.name}
              width={40}
              height={40}
              quality={90}
              className="size-10 rounded-full object-cover object-top grayscale"
            />
          </Link>

          <span className="mx-1.5 h-6 w-px bg-line" aria-hidden />

          <DockItem label="Say hi" onClick={() => setOpen((v) => !v)}>
            {/* Morph anchor: the form's panel grows out of this button. */}
            {!open && !still && (
              <motion.span
                layoutId={SAY_HI_LAYOUT_ID}
                style={{ borderRadius: 9999 }}
                className="absolute inset-0 -z-10"
              />
            )}
            <ChatIcon />
          </DockItem>

          <DockItem label={copied ? "Copied" : "Copy email"} onClick={copyEmail}>
            {/* Crossfade so the tick doesn't pop in. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied ? "check" : "mail"}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: duration.fast, ease }}
                className="grid place-items-center"
              >
                {copied ? <CheckIcon /> : <MailIcon />}
              </motion.span>
            </AnimatePresence>
          </DockItem>

          <DockItem label="GitHub" href={contactHref("github")} external>
            <GithubIcon />
          </DockItem>

          <DockItem label="LinkedIn" href={contactHref("linkedin")} external>
            <LinkedinIcon />
          </DockItem>
        </motion.nav>
      </div>
    </>
  );
}
