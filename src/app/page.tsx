import { Suspense } from "react";
import { contacts, experience, profile } from "@/lib/data";
import { WorkList } from "@/components/work-list";
import { Listening, ListeningSkeleton } from "@/components/listening";
import { SayHi } from "@/components/say-hi";

/**
 * One page. Everything on it is drawn from `src/lib/tokens.ts`, which the
 * visitor can open and edit — the site is its own design system, and the
 * demonstration is the argument.
 */
export default function Home() {
  const current = experience[0];

  return (
    <main
      className="shell stack"
      style={{ gap: "var(--s7)", paddingTop: "var(--s6)", paddingBottom: "var(--s7)" }}
    >
      <header className="stack" style={{ gap: "var(--s4)" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-[var(--s2)]">
          <p className="label" style={{ margin: 0 }}>
            {profile.name}
          </p>
          <p className="label" style={{ margin: 0 }}>
            {profile.role} · {profile.location}
          </p>
        </div>

        <h1 className="display">
          I build the interface
          <br />
          layer for systems
          <br />
          that guess.
        </h1>

        <p className="lead dim">
          Design and code are the same job to me — I have never handed one of
          them to someone else. This page is drawn from a token file you can
          open and edit; the button in the corner is the same loop{" "}
          <a
            href="https://github.com/erikwijnbladh/pane"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[color:var(--line)] underline-offset-4 transition-colors hover:decoration-current"
            style={{ color: "var(--ink)" }}
          >
            Pane
          </a>{" "}
          exists for, pointed at the site itself.
        </p>
      </header>

      <WorkList />

      <Suspense fallback={<ListeningSkeleton />}>
        <Listening />
      </Suspense>

      <footer className="stack rule-t" style={{ gap: "var(--s3)", paddingTop: "var(--s4)" }}>
        <div className="flex flex-wrap items-baseline justify-between gap-[var(--s3)]">
          <p className="m-0" style={{ maxWidth: "42ch", lineHeight: 1.6 }}>
            <span className="dim">Currently</span> {current.role} at{" "}
            {current.org} — {current.summary}.{" "}
            <span className="dim">
              Joining Compileit in September, and midway through an MSc in
              Human–Computer Interaction at Uppsala.
            </span>
          </p>

          <ul className="stack m-0 list-none p-0" style={{ gap: "var(--s1)" }}>
            {contacts.map((contact) => (
              <li key={contact.href}>
                <a
                  href={contact.href}
                  {...(contact.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="transition-opacity hover:opacity-60"
                >
                  {contact.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <SayHi />
      </footer>
    </main>
  );
}
