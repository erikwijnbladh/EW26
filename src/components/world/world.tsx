"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Asterisk,
  ArrowUpRight,
  Moon,
  Sun,
  RotateCcw,
  X,
  MoveUpRight,
  Monitor,
  UserRound,
  Disc3,
  Send,
  Compass,
} from "lucide-react";
import {
  profile,
  experience,
  education,
  contacts,
  elsewhere,
  nowPlaying,
} from "@/lib/data";
import { LatestPlaying } from "@/components/latest-playing";
import { SayHiForm } from "@/components/say-hi";
import { stops, type Stop } from "./stops";
import type { createWorld } from "./scene";
import "./world.css";

const icons = [UserRound, Monitor, Disc3, Compass, Send];

export function World() {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<ReturnType<typeof createWorld> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Stop | null>(null);
  const [hovered, setHovered] = useState<Stop | null>(null);
  const [night, setNight] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const [visited, setVisited] = useState<Stop[]>([]);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const element = host.current!;
    function lost(event: Event) {
      event.preventDefault();
      setStatus("fallback");
      world.current?.dispose();
      world.current = null;
    }
    element.addEventListener("webglcontextlost", lost, true);
    import("./scene")
      .then(({ createWorld }) => {
        if (cancelled) return;
        try {
          world.current = createWorld(
            element,
            (id) => {
              setActive(id);
              setVisited((items) =>
                items.includes(id) ? items : [...items, id],
              );
            },
            setHovered,
            motion.matches,
          );
          setStatus("ready");
        } catch {
          setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });
    return () => {
      cancelled = true;
      element.removeEventListener("webglcontextlost", lost, true);
      world.current?.dispose();
      world.current = null;
    };
  }, []);
  useEffect(() => {
    world.current?.night(night);
  }, [night, status]);
  const isOpen = active !== null;
  useEffect(() => {
    world.current?.pause(isOpen);
  }, [isOpen, status]);
  useEffect(() => {
    if (!isOpen) return;
    const panel = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    panel.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      panel.close();
      document.body.style.overflow = previous;
      trigger?.focus();
    };
  }, [isOpen]);
  useEffect(() => {
    if (dialog.current) dialog.current.scrollTop = 0;
  }, [active]);
  const explore = (id: Stop) => {
    setActive(id);
    setVisited((items) => (items.includes(id) ? items : [...items, id]));
  };
  const selected = stops.find((item) => item.id === active);

  return (
    <div className="little-world" data-night={night}>
      <a className="world-skip" href="#world-locations">
        Skip to portfolio sections
      </a>
      <header className="world-header">
        <Link href="/" className="world-identity">
          <span className="world-monogram">
            ew
            <span>
              <Asterisk size={25} />
            </span>
          </span>
          <span>
            {profile.name}
            <small>{profile.role}</small>
          </span>
        </Link>
        <div className="world-header-right">
          <span className="world-location">
            <i /> Stockholm, SE
          </span>
          <Link href="/classic" className="world-reading">
            Reading mode <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      <section
        className="world-stage"
        aria-label="Erik’s interactive portfolio"
      >
        <div className="world-intro">
          <span className="world-eyebrow">
            A SMALL WORLD. A LOT OF CURIOSITY.
          </span>
          <h1>
            Welcome to
            <br />
            my little <em>world.</em>
            <span className="world-star" aria-hidden>
              <Asterisk size={43} strokeWidth={1.3} />
            </span>
          </h1>
          <p>
            I’m Erik. Developer, designer,
            <br />
            and a maker of good things.
          </p>
          <button className="world-start" onClick={() => explore("about")}>
            Come on in <MoveUpRight size={17} />
          </button>
        </div>
        <div
          className="world-canvas"
          ref={host}
          aria-hidden={status === "fallback"}
        />
        {status !== "ready" && (
          <div className="world-loading" role="status">
            {status === "loading" ? (
              <>
                <span className="world-loader" />
                Building a little world…
              </>
            ) : (
              <>
                The island is taking a break.
                <small>
                  Explore every part of the portfolio using the buttons below.
                </small>
              </>
            )}
          </div>
        )}
        <div className="world-side-note">
          <span>INDEPENDENT MIND</span>
          <span>↓</span>
          <span>PLAYFUL BY NATURE</span>
        </div>
        <div className="world-scene-caption">
          <span className="world-cross">+</span>
          <span>
            FIELD NOTES, VOL. 01
            <br />
            <b>A corner of my universe.</b>
          </span>
        </div>
        <div className="world-controls">
          <button
            aria-label={night ? "Switch to daytime" : "Switch to nighttime"}
            aria-pressed={night}
            onClick={() => setNight(!night)}
          >
            {night ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            aria-label="Reset camera"
            onClick={() => world.current?.reset()}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <div className="world-hint" aria-live="polite">
          {hovered ? (
            <>
              <span className="world-hint-dot" />
              {stops.find((s) => s.id === hovered)?.label} · click to explore
            </>
          ) : (
            <>
              Drag to look around <span>·</span> Click an object to explore
            </>
          )}
        </div>
      </section>

      <nav
        className="world-map"
        id="world-locations"
        aria-label="Explore the portfolio"
      >
        <div className="world-map-heading">
          <span>CHOOSE YOUR CURIOSITY</span>
          <span>{visited.length} / 5 EXPLORED</span>
        </div>
        <div className="world-stops">
          {stops.map((stop, index) => {
            const Icon = icons[index];
            return (
              <button
                key={stop.id}
                onClick={() => explore(stop.id)}
                onPointerEnter={() => setHovered(stop.id)}
                onPointerLeave={() => setHovered(null)}
              >
                <span className="world-stop-number">
                  {String(index + 1).padStart(2, "0")}
                  {visited.includes(stop.id) && <i />}
                </span>
                <Icon className="world-stop-icon" size={23} strokeWidth={1.4} />
                <span>
                  <strong>{stop.label}</strong>
                  <small>{stop.caption}</small>
                </span>
                <ArrowUpRight className="world-stop-arrow" size={17} />
              </button>
            );
          })}
        </div>
      </nav>
      <footer className="world-footer">
        <span>Built with code. Filled with personality.</span>
        <span>
          Made in Stockholm <span aria-hidden>↗</span>
        </span>
      </footer>

      <dialog
        ref={dialog}
        className="world-dialog"
        onCancel={() => setActive(null)}
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setActive(null);
        }}
        aria-labelledby="world-panel-title"
      >
        <div className="world-panel">
          <div className="world-panel-top">
            <span className="world-eyebrow">
              A CORNER OF MY WORLD /{" "}
              {String(stops.findIndex((s) => s.id === active) + 1).padStart(
                2,
                "0",
              )}
            </span>
            <button
              className="world-close"
              onClick={() => setActive(null)}
              aria-label="Close section"
            >
              <X size={20} />
            </button>
          </div>
          <h2 id="world-panel-title">
            {selected?.label}
            <span>.</span>
          </h2>
          {active === "about" && (
            <div className="world-about">
              <Image
                src="/images/pfp.png"
                alt={profile.name}
                width={150}
                height={150}
                className="world-portrait"
              />
              {profile.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <div className="world-note">
                Curious by default. Always making something.
              </div>
            </div>
          )}
          {active === "work" && (
            <>
              <p className="world-panel-lead">{profile.tagline}</p>
              <div className="world-experience">
                {experience.map((item, index) => (
                  <a
                    key={item.org}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="world-eyebrow">
                      {item.year}
                      {index === 0 ? " / NOW" : ""}
                    </span>
                    <strong>
                      {item.org}
                      <ArrowUpRight size={20} />
                    </strong>
                    <span>{item.role}</span>
                  </a>
                ))}
              </div>
              <h3>Where I learned</h3>
              {education.map((item) => (
                <p key={item.org} className="world-education">
                  <strong>{item.degree}</strong>
                  <span>
                    {item.org} · {item.year}
                    {item.note && " · " + item.note}
                  </span>
                </p>
              ))}
            </>
          )}
          {active === "music" && (
            <>
              <p className="world-panel-lead">
                The soundtrack to making things. Usually loud.
              </p>
              <div className="world-record" aria-hidden>
                <div>
                  ew
                  <br />
                  33⅓ RPM
                </div>
              </div>
              <div className="world-music">
                <LatestPlaying
                  current={null}
                  playing={false}
                  history={nowPlaying}
                />
              </div>
            </>
          )}
          {active === "elsewhere" && (
            <>
              <p className="world-panel-lead">
                Sometimes the best ideas happen away from a screen.
              </p>
              <figure className="world-photo">
                <Image
                  src={elsewhere[photo].src}
                  alt={elsewhere[photo].alt}
                  width={600}
                  height={760}
                />
                <figcaption>{elsewhere[photo].caption}</figcaption>
              </figure>
              <div className="world-photo-controls">
                <button
                  onClick={() =>
                    setPhoto((photo + elsewhere.length - 1) % elsewhere.length)
                  }
                  aria-label="Previous photo"
                >
                  ←
                </button>
                <span>
                  {photo + 1} / {elsewhere.length}
                </span>
                <button
                  onClick={() => setPhoto((photo + 1) % elsewhere.length)}
                  aria-label="Next photo"
                >
                  →
                </button>
              </div>
            </>
          )}
          {active === "contact" && (
            <>
              <p className="world-panel-lead">
                Have a good idea, a question, or a band I should hear?
              </p>
              <div className="world-contact-links">
                {contacts.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                    <ArrowUpRight size={16} />
                  </a>
                ))}
              </div>
              <div className="world-contact-form">
                <SayHiForm open onClose={() => setActive(null)} />
              </div>
            </>
          )}
          <div className="world-panel-bottom">
            <span>Keep wandering.</span>
            <button
              onClick={() =>
                explore(
                  stops[
                    (stops.findIndex((s) => s.id === active) + 1) % stops.length
                  ].id,
                )
              }
            >
              Next stop <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
