"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { profile } from "@/lib/data";
import { actionById, contactHref } from "@/components/actions";
import { CommandMenu } from "@/components/command-menu";

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
      <path d="m5 12.5 4.5 4.5L19 7" {...stroke} />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M10 20.567C6.571 21.725 3.714 20.567 2 17"
        {...stroke}
      />
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

function CommandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M9 9V6.5a2.5 2.5 0 1 0-2.5 2.5H9Zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1 1 17.5 9H15Zm0 0v6m0 0h2.5A2.5 2.5 0 1 1 15 17.5V15Zm0 0H9m0 0v2.5A2.5 2.5 0 1 1 6.5 15H9Z"
        {...stroke}
      />
    </svg>
  );
}

const itemClass =
  "relative grid size-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground";

/**
 * Floating dock — the only chrome on the site. Holds the face, the ⌘K trigger
 * and the three ways to reach me.
 */
export function Dock() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ⌘K / Ctrl+K from anywhere on the page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const copyEmail = useCallback(() => {
    actionById("copy-email").run();
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, []);

  return (
    <>
      <CommandMenu open={open} onClose={() => setOpen(false)} />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-5 sm:p-8">
        <motion.nav
          aria-label="Shortcuts"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="dock pointer-events-auto flex h-15 items-center gap-1.5 rounded-full px-2.5"
        >
          <Link
            href="/"
            aria-label="Home"
            title={profile.name}
            className="shrink-0 rounded-full transition-opacity hover:opacity-80"
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

          <span className="mx-1 h-6 w-px bg-line" aria-hidden />

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open command menu (⌘K)"
            title="Command menu — ⌘K"
            className={itemClass}
          >
            <CommandIcon />
          </button>

          <button
            type="button"
            onClick={copyEmail}
            aria-label={copied ? "Email copied" : "Copy email address"}
            title={copied ? "Copied" : profile.email}
            className={itemClass}
          >
            {copied ? <CheckIcon /> : <MailIcon />}
          </button>

          <a
            href={contactHref("github")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className={itemClass}
          >
            <GithubIcon />
          </a>

          <a
            href={contactHref("linkedin")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
            className={itemClass}
          >
            <LinkedinIcon />
          </a>
        </motion.nav>
      </div>
    </>
  );
}
