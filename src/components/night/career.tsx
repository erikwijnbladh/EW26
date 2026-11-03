import Image from "next/image";
import { education, experience, mentions } from "@/lib/data";

/** The brand mark for an org, where the bio already carries one. */
function markFor(org: string) {
  return mentions.find((m) => m.org === org);
}

function Mark({ org }: { org: string }) {
  const mention = markFor(org);
  return (
    <span
      className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--line)]"
      style={{ background: mention?.tone ?? "var(--surface)" }}
    >
      {mention ? (
        <Image src={mention.logo.src} alt="" width={20} height={20} className="size-5 object-contain" />
      ) : (
        <span className="font-serif text-sm italic text-muted">{org[0]}</span>
      )}
    </span>
  );
}

function Row({
  org,
  title,
  year,
  href,
}: {
  org: string;
  title: string;
  year: string;
  href?: string;
}) {
  const body = (
    <>
      <Mark org={org} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{org}</span>
        <span className="block truncate text-xs text-muted">{title}</span>
      </span>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted/70">{year}</span>
    </>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]"
        >
          {body}
        </a>
      ) : (
        <div className="-mx-3 flex items-center gap-3 px-3 py-2.5">{body}</div>
      )}
    </li>
  );
}

export function Career() {
  return (
    <ul className="flex flex-col">
      {experience.map((item) => (
        <Row key={item.org} org={item.org} title={item.role} year={item.year} href={item.href} />
      ))}
    </ul>
  );
}

export function Education() {
  return (
    <ul className="flex flex-col">
      {education.map((item) => (
        <Row
          key={item.org}
          org={item.org}
          title={item.note ? `${item.degree} · ${item.note}` : item.degree}
          year={item.year}
          href={item.href}
        />
      ))}
    </ul>
  );
}
