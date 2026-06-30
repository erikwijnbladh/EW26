"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const links = [
  { href: "/", label: "Work" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-5 sm:px-8 sm:pt-6">
      <nav className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-line bg-background/80 px-4 py-2.5 backdrop-blur-md">
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          Erik Wijnbladh
        </Link>
        <ul className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  className="relative block px-3 py-1.5 text-sm text-muted transition-colors duration-300 hover:text-foreground"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-foreground/[0.06]"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className={`relative ${active ? "text-foreground" : ""}`}>
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
