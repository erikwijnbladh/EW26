"use client";

import { useSwoop, DotSpacer } from "@/components/use-swoop";
import { contacts, experience, education } from "@/lib/data";

/**
 * The hoverable About sections (contacts + experience) plus education, sharing
 * one swooping dot that travels from the nav "home" dot — same interaction and
 * left alignment as the home list. Education matches the layout but isn't a
 * hover target.
 */
export function AboutLists() {
  const { containerRef, dot, rowProps, release } = useSwoop();

  const row = "flex items-start gap-2 py-3";
  // Contacts sit flush with no gap between them; the dot's title offset still
  // lands on the first text line (see TITLE_OFFSET).
  const contactRow = "flex items-start gap-2 py-0";

  return (
    <div
      ref={containerRef}
      className="relative mt-12"
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") release();
      }}
    >
      {dot}

      {/* Contacts */}
      <ul className="flex flex-col">
        {contacts.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              {...(item.external
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
              {...rowProps(`contact-${item.href}`)}
              className={`${contactRow} text-base text-foreground transition-colors hover:text-muted`}
            >
              <DotSpacer />
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* Experience */}
      <div className="mt-16">
        <div className={row}>
          <DotSpacer />
          <span className="text-base text-foreground">experience</span>
        </div>
        {experience.map((item) => (
          <a
            key={item.org}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            {...rowProps(`exp-${item.org}`)}
            className={row}
          >
            <DotSpacer />
            <span className="grid grid-cols-[3rem_1fr] gap-6">
              <span className="text-base text-muted">{item.year}</span>
              <span>
                <span className="block text-base text-muted">{item.org}</span>
                <span className="block text-base text-foreground">
                  {item.role}
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>

      {/* Education */}
      <div className="mt-16">
        <div className={row}>
          <DotSpacer />
          <span className="text-base text-foreground">education</span>
        </div>
        {education.map((item) => (
          <a
            key={item.org}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            {...rowProps(`edu-${item.org}`)}
            className={row}
          >
            <DotSpacer />
            <span className="grid grid-cols-[3rem_1fr] gap-6">
              <span className="text-base text-muted">{item.year}</span>
              <span>
                <span className="block text-base text-muted">{item.org}</span>
                <span className="block text-base text-foreground">
                  {item.degree}
                </span>
                {item.note && (
                  <span className="mt-1 block text-sm text-muted">
                    {item.note}
                  </span>
                )}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
