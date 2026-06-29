import { profile } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <div className="flex flex-col gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {profile.name}</p>
        <ul className="flex items-center gap-4">
          {profile.social.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors duration-300 hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={`mailto:${profile.email}`}
              className="transition-colors duration-300 hover:text-foreground"
            >
              Email
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
