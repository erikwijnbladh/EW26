import Link from "next/link";
import { Nav } from "@/components/nav";
import { Dock } from "@/components/dock";
import { IndicatorProvider } from "@/components/indicator-context";
export default function ClassicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IndicatorProvider>
      <Nav />
      <div className="pt-24 sm:pt-28">
        <div className="mx-auto max-w-xl px-5 pb-6">
          <Link href="/" className="text-sm text-muted">
            ← Back to the little world
          </Link>
        </div>
        {children}
      </div>
      <Dock />
    </IndicatorProvider>
  );
}
