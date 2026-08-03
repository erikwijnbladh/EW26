import type { Metadata, Viewport } from "next";
import { profile } from "@/lib/data";
import { TokensPanel } from "@/components/tokens-panel";
import { STORAGE_KEY, TOKENS } from "@/lib/tokens";
import "./globals.css";

/**
 * Puts saved tokens on the document before the first paint.
 *
 * Without it a returning visitor watches the page render at the defaults and
 * then jump to whatever they left it at — the same flash-of-wrong-theme problem,
 * except it moves the type and the spacing rather than just the colours. Inlined
 * and blocking on purpose: it has to win the race against paint.
 */
const PRE_PAINT = `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}"),u=${JSON.stringify(
  Object.fromEntries(TOKENS.map((token) => [token.key, token.unit])),
)},e=document.documentElement;for(var k in u){if(typeof t[k]==="number"){e.style.setProperty("--"+k,t[k]+u[k])}}}catch(_){}`;

/**
 * No webfont. The type ramp is one of the tokens the panel moves, and a face
 * still swapping in while someone drags `scale` is the one moment the illusion
 * breaks — the page has to respond on the same frame as the number. Helvetica
 * is also simply the right family here rather than a concession.
 */

export const metadata: Metadata = {
  metadataBase: new URL("https://erikwijnbladh.com"),
  title: "Erik Wijnbladh — design engineer",
  description: profile.tagline,
  openGraph: {
    title: "Erik Wijnbladh — design engineer",
    description: profile.tagline,
    url: "https://erikwijnbladh.com",
    siteName: "Erik Wijnbladh",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfcfd",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      </head>
      <body>
        {children}
        <TokensPanel />
      </body>
    </html>
  );
}
