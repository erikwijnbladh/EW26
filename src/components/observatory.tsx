"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  MoveUpRight,
  Pause,
  Play,
  Plus,
  X,
} from "lucide-react";
import { contacts, experience, profile } from "@/lib/data";

const OrbitalScene = dynamic(() => import("./orbital-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-placeholder">
      <span className="placeholder-ring" />
      <span className="mono">ASSEMBLING A LITTLE WONDER</span>
    </div>
  ),
});

const studies = [
  {
    id: "01",
    title: "Aether",
    category: "SPATIAL INTERFACES",
    year: "2026",
    className: "aether",
    subtitle: "An interface with room to breathe.",
    description:
      "What if an interface felt less like a screen and more like a place? Aether is a visual exploration of orbital navigation, dimensional objects, and a quieter kind of digital space.",
    details: ["Spatial navigation", "Generative geometry", "Light & material"],
    note: "An independent visual concept exploring spatial UI. The orbital instrument above is its working, interactive prototype.",
  },
  {
    id: "02",
    title: "Form / Field",
    category: "GENERATIVE DESIGN",
    year: "2026",
    className: "field",
    subtitle: "A system. A thousand possibilities.",
    description:
      "Order gives way to something unexpected. Repeated forms become a landscape of light and shadow, exploring how simple rules can produce a surprisingly human result.",
    details: ["Parametric forms", "Visual systems", "Creative development"],
    note: "An independent procedural artwork. The composition is built from code, using a repeating set of dimensional forms.",
  },
  {
    id: "03",
    title: "After hours",
    category: "DIGITAL EXPERIMENTS",
    year: "ONGOING",
    className: "after",
    subtitle: "The good stuff happens off-script.",
    description:
      "A place for the ideas that don't fit in a brief. Strange shapes, impossible objects, and little interactions made for the simple pleasure of seeing what happens.",
    details: ["Interaction studies", "Motion", "Creative coding"],
    note: "An independent visual playground. A reminder to make things before you know exactly what they are for.",
  },
] as const;

function Artwork({ kind }: { kind: (typeof studies)[number]["className"] }) {
  return (
    <div className={`study-art ${kind}`} aria-hidden="true">
      <div className="art-grid" />
      {kind === "aether" && (
        <div className="art-orbit">
          <i />
          <i />
          <i />
          <b />
        </div>
      )}
      {kind === "field" && (
        <div className="art-field">
          {Array.from({ length: 12 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  "--i": i,
                  height: `${55 + (i % 6) * 8}%`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      {kind === "after" && (
        <div className="art-flower">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
          <b />
        </div>
      )}
      <span className="art-coordinate mono">
        {kind === "aether"
          ? "FIG. 001 / ORBITAL SYSTEM"
          : kind === "field"
            ? "FIG. 002 / REPEAT, RECONSIDER"
            : "FIG. 003 / HAPPY ACCIDENTS"}
      </span>
      <span className="art-cross">+</span>
    </div>
  );
}

export function Observatory() {
  const [material, setMaterial] = useState<"chrome" | "clay" | "wire">(
    "chrome",
  );
  const [exploded, setExploded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [study, setStudy] = useState<(typeof studies)[number] | null>(null);
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!study) return;
    dialog.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [study]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  }

  return (
    <div className="observatory" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a
          href="#top"
          className="wordmark"
          aria-label="Erik Wijnbladh, back to top"
        >
          ew<span>✳</span>
        </a>
        <span className="header-identity">
          ERIK WIJNBLADH
          <br />
          <span>DEVELOPER & DESIGNER</span>
        </span>
        <nav aria-label="Main navigation">
          <a href="#work">
            Explorations <span>03</span>
          </a>
          <a href="#about">About</a>
          <a href="#contact" className="nav-contact">
            Let’s talk <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-topline mono">
            <span>
              <i className="status-dot" /> INDEPENDENT MIND. SHARED
              POSSIBILITIES.
            </span>
            <span>STOCKHOLM, SE / 59°19′ N 18°04′ E</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow mono">DESIGN × CODE × A LITTLE OBSESSION</p>
            <h1 id="hero-heading">
              A little
              <br />
              outside
              <br />
              <em>the ordinary.</em>
            </h1>
            <p className="hero-description">
              I’m Erik. I turn curious ideas into
              <br className="desktop-break" /> digital things that make you feel
              something.
            </p>
            <a href="#work" className="round-link">
              <span className="circle-button">
                <ArrowDown size={20} />
              </span>
              <span>
                Step into my world
                <span className="mono">SCROLL TO EXPLORE</span>
              </span>
            </a>
          </div>
          <div className="hero-object">
            <span className="object-axis axis-top mono">Y +</span>
            <span className="object-axis axis-right mono">+ X</span>
            <div className="object-orbit-guide" aria-hidden="true" />
            <OrbitalScene
              material={material}
              exploded={exploded}
              paused={paused}
            />
            <div className="object-caption mono">
              <span>
                <i /> OBJECT 001 — THE CURIOSITY ENGINE
              </span>
              <span>DRAG TO ROTATE</span>
            </div>
          </div>
          <div className="hero-bottom">
            <div className="edition mono">
              <span>PORTFOLIO / VOL. 026</span>
              <span>BUILT WITH INTENT. OPEN TO THE UNEXPECTED.</span>
            </div>
            <div className="object-controls" aria-label="Sculpture controls">
              <div
                className="material-switch"
                role="group"
                aria-label="Sculpture material"
              >
                {(["chrome", "clay", "wire"] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={material === value}
                    onClick={() => setMaterial(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <span className="control-divider" />
              <button
                className="explode-button"
                aria-pressed={exploded}
                onClick={() => setExploded(!exploded)}
              >
                <Plus size={15} className={exploded ? "is-exploded" : ""} />
                {exploded ? "Assemble" : "Explode"}
              </button>
              <button
                className="pause-button"
                aria-label={
                  paused
                    ? "Resume sculpture animation"
                    : "Pause sculpture animation"
                }
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </div>
          </div>
        </section>
        <div className="manifesto-strip" aria-hidden="true">
          <span>THINK IN SYSTEMS.</span>
          <span className="strip-star">✳</span>
          <span>FEEL IN DETAILS.</span>
          <span className="strip-star">✳</span>
          <span>MAKE IT MATTER.</span>
          <span className="strip-star">✳</span>
        </div>
        <section
          id="work"
          className="work-section section-shell"
          aria-labelledby="work-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow mono">01 / THE EXPLORATIONS</p>
              <h2 id="work-heading">
                Serious about
                <br />
                <em>playing around.</em>
              </h2>
            </div>
            <p>
              A few self-initiated detours through
              <br />
              design, technology, and the in-between.
              <br />
              <span className="muted">No brief. Just a good question.</span>
            </p>
          </div>
          <div className="study-grid">
            {studies.map((item) => (
              <button
                key={item.id}
                className="study-card"
                onClick={() => setStudy(item)}
                aria-label={`Explore ${item.title}`}
              >
                <div className="art-wrap">
                  <Artwork kind={item.className} />
                  <span className="study-open">
                    <ArrowUpRight size={24} />
                  </span>
                  <span className="study-index mono">
                    {item.id} / EXPERIMENT
                  </span>
                </div>
                <div className="study-title">
                  <h3>{item.title}</h3>
                  <span className="mono">{item.year}</span>
                </div>
                <p className="mono study-category">{item.category}</p>
              </button>
            ))}
          </div>
        </section>
        <section
          id="about"
          className="about-section section-shell"
          aria-labelledby="about-heading"
        >
          <div className="about-heading">
            <p className="eyebrow mono">02 / THE HUMAN IN THE LOOP</p>
            <div className="about-emblem" aria-hidden="true">
              <span>e</span>
              <span>w</span>
              <i>✳</i>
            </div>
            <span className="mono about-coordinate">
              BASED IN STOCKHOLM
              <br />
              CURIOUS EVERYWHERE
            </span>
          </div>
          <div className="about-copy">
            <h2 id="about-heading">
              An engineer’s mind.
              <br />A designer’s eye.
              <br />
              <em>A restless curiosity.</em>
            </h2>
            <p>
              I like the space where design and development overlap. Where a
              small detail becomes a big feeling. Where “what if” turns into
              something you can actually use.
            </p>
            <p>
              Currently building products at Compileit. Previously making things
              at KTH and BrightBid. Away from the screen: skateboards, ski
              slopes, loud concerts, and whatever’s cooking.
            </p>
            <div className="experience-list">
              {experience.slice(0, 3).map((item) => (
                <a
                  href={item.href}
                  key={item.org}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    {item.org === "KTH Royal Institute of Technology"
                      ? "KTH"
                      : item.org}
                  </span>
                  <span className="mono">{item.role}</span>
                  <span className="mono">{item.year}</span>
                  <ArrowUpRight size={17} />
                </a>
              ))}
            </div>
          </div>
        </section>
        <section
          id="contact"
          className="contact-section section-shell"
          aria-labelledby="contact-heading"
        >
          <div className="contact-top mono">
            <span>03 / SOMETHING STARTS HERE</span>
            <span>GOOD THINGS BEGIN WITH A HELLO.</span>
          </div>
          <a className="contact-title" href={`mailto:${profile.email}`}>
            <h2 id="contact-heading">
              Have a strange
              <br />
              <em>little idea?</em>
            </h2>
            <MoveUpRight strokeWidth={1} />
          </a>
          <div className="contact-bottom">
            <span>Let’s make something worth putting into the world.</span>
            <div>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <button aria-label="Copy email address" onClick={copyEmail}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <span className="copy-status mono" role="status">
                {copied ? "COPIED" : ""}
              </span>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span className="mono">© 2026 ERIK WIJNBLADH</span>
        <span className="footer-note">Stay curious. Make things.</span>
        <div>
          {contacts
            .filter((contact) => contact.external)
            .map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target="_blank"
                rel="noreferrer"
              >
                {contact.label}
                <ArrowUpRight size={14} />
              </a>
            ))}
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
      {study && (
        <dialog
          ref={dialog}
          className="study-dialog"
          onClose={() => setStudy(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialog.current?.close();
          }}
          aria-labelledby="study-dialog-title"
        >
          <div className="dialog-inner">
            <button
              className="dialog-close"
              onClick={() => dialog.current?.close()}
              aria-label="Close exploration"
              autoFocus
            >
              <X size={23} />
            </button>
            <Artwork kind={study.className} />
            <div className="dialog-copy">
              <p className="eyebrow mono">
                EXPLORATION {study.id} / {study.category}
              </p>
              <h2 id="study-dialog-title">{study.title}</h2>
              <h3>{study.subtitle}</h3>
              <p>{study.description}</p>
              <div className="detail-tags">
                {study.details.map((detail) => (
                  <span key={detail}>{detail}</span>
                ))}
              </div>
              <p className="study-note">{study.note}</p>
              <a
                href={`mailto:${profile.email}?subject=${encodeURIComponent(`Let's talk about ${study.title}`)}`}
                className="dialog-cta"
              >
                Have something like this in mind? <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
