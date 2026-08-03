import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { profile } from "@/lib/data";
import { STORAGE_KEY, TOKENS } from "@/lib/tokens";
import { Nav } from "@/components/nav";
import { Dock } from "@/components/dock";
import { ScrollReset } from "@/components/scroll-reset";
import { IndicatorProvider } from "@/components/indicator-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

/**
 * Puts a saved look on the document before the first paint.
 *
 * Without it, someone who moved the cog last visit watches the page render at
 * the defaults and then jump — the flash-of-wrong-theme problem, except it
 * moves the type and the spacing rather than just the colours. Inlined and
 * blocking on purpose: it has to win the race against paint.
 */
const PRE_PAINT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}"),u=${JSON.stringify(
  Object.fromEntries(TOKENS.map((t) => [t.key, t.unit])),
)},e=document.documentElement;for(var k in u){if(typeof s[k]==="number"){e.style.setProperty("--"+k,s[k]+u[k])}}}catch(_){}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://erikwijnbladh.com"),
  title: "erik wijnbladh — design engineer",
  description: profile.tagline,
};

export const viewport: Viewport = {
  themeColor: "#f4f3f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ScrollReset />
        <div className="grain" aria-hidden />
        <IndicatorProvider>
          <Nav />
          <main className="flex-1 pt-24 sm:pt-28">{children}</main>
          <Dock />
        </IndicatorProvider>
      </body>
    </html>
  );
}
