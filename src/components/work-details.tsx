import { contacts, education, experience, profile } from "@/lib/data";

/** Published facts stay browsable, searchable and usable without the AI service. */
export function WorkDetails() {
  return (
    <section aria-label="Work and contact" className="mt-8 px-5 text-sm leading-relaxed text-muted">
      <details className="border-y border-line py-3">
        <summary className="w-fit text-foreground underline decoration-line underline-offset-4">Work &amp; background</summary>
        <div className="space-y-6 pb-2 pt-5">
          <div>
            <h2 className="mb-3 font-medium text-foreground">Experience</h2>
            <ol className="space-y-4">
              {experience.map((job) => (
                <li key={`${job.org}-${job.year}`} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <span className="text-xs leading-6">{job.year}</span>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {job.href ? <a href={job.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4">{job.org}</a> : job.org}
                    </h3>
                    <p>{job.role}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="mb-3 font-medium text-foreground">Education</h2>
            <ul className="space-y-4">
              {education.map((item) => (
                <li key={`${item.org}-${item.year}`}>
                  <h3 className="font-medium text-foreground">{item.org}</h3>
                  <p>{item.degree}{item.note ? ` (${item.note})` : ""}</p>
                  <p className="text-xs">{item.year}</p>
                </li>
              ))}
            </ul>
          </div>
          <p>
            {contacts.filter((contact) => contact.external).map((contact) => (
              <a key={contact.href} href={contact.href} target="_blank" rel="noreferrer" className="mr-4 underline decoration-line underline-offset-4">{contact.label}</a>
            ))}
          </p>
        </div>
      </details>
      <p className="mt-4">Have something in mind? <a href={`mailto:${profile.email}`} className="underline decoration-line underline-offset-4 text-foreground">Email me.</a></p>
    </section>
  );
}
