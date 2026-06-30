import Link from "next/link";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="flex h-16 items-center">
          {/* pl-5 (20px) = bullet (w-3) + gap (gap-2) so the name lines up
              with the post titles below. */}
          <Link
            href="/"
            id="nav-name"
            className="pl-5 text-sm font-medium tracking-tight text-foreground"
          >
            Erik Wijnbladh
          </Link>
        </div>
      </div>
    </header>
  );
}
