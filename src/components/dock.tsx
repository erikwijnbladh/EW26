"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile, contacts } from "@/lib/data";
import { ease } from "@/lib/motion";
import { ExpandableTabs } from "@/components/ui/be-ui-expandable-tabs";
import { SayHiForm } from "@/components/say-hi";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Strokes draw themselves on mount: opacity snaps in over 100ms while the line
 * unspools over 400ms, so it reads as being drawn rather than faded up.
 */
const draw = (delay = 0) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    duration: 0.4,
    ease,
    delay,
    opacity: { duration: 0.1, delay },
  },
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

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <motion.rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="3.5"
        {...stroke}
        {...draw()}
      />
      <motion.path
        d="M3.5 7.5 10.9 12.6a2 2 0 0 0 2.2 0L20.5 7.5"
        {...stroke}
        {...draw(0.1)}
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <motion.path d="M4 12 9 17L20 6" {...stroke} {...draw()} />
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
                id: "email",
                label: copied ? "Copied" : "Copy email",
                // The envelope un-draws and the tick draws itself in its place.
                icon: (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied ? "check" : "mail"}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{
                        scale: 0.7,
                        opacity: 0,
                        transition: { duration: 0.14, ease },
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.6,
                      }}
                      className="grid place-items-center"
                    >
                      {copied ? <CheckIcon /> : <MailIcon />}
                    </motion.span>
                  </AnimatePresence>
                ),
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
