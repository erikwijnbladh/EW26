"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile, contacts } from "@/lib/data";
import { duration, ease } from "@/lib/motion";
import { ExpandableTabs } from "@/components/ui/be-ui-expandable-tabs";
import { SayHiForm } from "@/components/say-hi";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

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

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-1 1"
        {...stroke}
      />
      <path
        d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l1-1"
        {...stroke}
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="3.5" {...stroke} />
      <path d="M3.5 7.5 10.9 12.6a2 2 0 0 0 2.2 0L20.5 7.5" {...stroke} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7" {...stroke} />
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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" {...stroke} />
    </svg>
  );
}

const contactHref = (label: string) =>
  contacts.find((c) => c.label === label)?.href ?? "";

const rowClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-surface";

/** A row inside a tab's panel — the same shape as the component's demo menu. */
function Row({
  icon,
  label,
  detail,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="grid size-4 shrink-0 place-items-center text-muted">
        {icon}
      </span>
      <span className="flex-1 text-foreground">{label}</span>
      <span className="shrink-0 text-muted">
        {detail ? <span className="text-xs">{detail}</span> : <ArrowIcon />}
      </span>
    </>
  );

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={rowClass}
    >
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={rowClass}>
      {inner}
    </button>
  );
}

/**
 * The floating bar: the ExpandableTabs component with two tabs — the "what's
 * up" form and the ways to reach me. Controlled, so submitting the form can
 * close the panel.
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
            transition={{ duration: duration.base, ease }}
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
              // This site's glass surface in place of the component's card.
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
                id: "elsewhere",
                label: "Elsewhere",
                icon: <LinkIcon />,
                content: (
                  <div className="flex w-[17.125rem] flex-col gap-0.5 p-1">
                    <p className="px-3 pb-2 pt-1 text-xs text-muted">
                      {profile.email}
                    </p>
                    <Row
                      icon={copied ? <CheckIcon /> : <MailIcon />}
                      label={copied ? "Copied" : "Copy email"}
                      onClick={copyEmail}
                    />
                    <Row
                      icon={<GithubIcon />}
                      label="GitHub"
                      href={contactHref("github")}
                    />
                    <Row
                      icon={<LinkedinIcon />}
                      label="LinkedIn"
                      href={contactHref("linkedin")}
                    />
                  </div>
                ),
              },
            ]}
          />
        </motion.div>
      </div>
    </>
  );
}
