import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Nav } from "@/components/nav";
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

export const metadata: Metadata = {
  title: "erik wijnbladh — fullstack engineer & designer",
  description:
    "Fullstack engineer and interaction designer in Stockholm, currently building at Compileit. Selected work, projects, and notes.",
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
      <body className="min-h-full flex flex-col font-sans">
        <ScrollReset />
        <div className="grain" aria-hidden />
        <IndicatorProvider>
          <Nav />
          <main className="flex-1 pt-24 sm:pt-28">{children}</main>
        </IndicatorProvider>
      </body>
    </html>
  );
}
