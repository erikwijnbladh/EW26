"use client";

import { useState } from "react";
import { profile } from "@/lib/data";

/** Where the form is in the send: nothing yet, in flight, failed, or done. */
type Status = "idle" | "sending" | "error" | "sent";

const LABEL: Record<Status, string> = {
  idle: "Send",
  sending: "Sending…",
  error: "Try again",
  sent: "Sent — thanks",
};

const field =
  "w-full border border-[color:var(--line)] bg-transparent px-[var(--s2)] py-[var(--s2)] text-[length:var(--t-body)] text-[color:var(--ink)] outline-none transition-colors placeholder:text-[color:var(--dim)] focus:border-[color:var(--ink)]";

/**
 * Posts to `/api/contact`, which sends the message through Resend. Kept from
 * the previous site because the route and the Resend wiring behind it work —
 * only the surface is redrawn, in the same tokens as everything else.
 *
 * Holds itself open on failure: the message exists nowhere but these fields,
 * and dismissing the form over a failed send would throw away something
 * somebody just wrote.
 */
export function SayHi() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = status === "sending" || status === "sent";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const data = new FormData(event.currentTarget);
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Couldn't send that. Try again in a moment.");
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="stack"
      style={{ gap: "var(--s2)", maxWidth: "26rem", borderRadius: "var(--radius)" }}
    >
      <p className="label" style={{ margin: 0 }}>
        Or say something
      </p>

      <div className="flex flex-col gap-[var(--s2)] sm:flex-row">
        <input
          name="name"
          placeholder="Name"
          aria-label="Your name"
          autoComplete="name"
          maxLength={100}
          disabled={busy}
          className={field}
          style={{ borderRadius: "var(--radius)" }}
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          aria-label="Your email (required)"
          autoComplete="email"
          maxLength={200}
          disabled={busy}
          className={field}
          style={{ borderRadius: "var(--radius)" }}
        />
      </div>

      <textarea
        name="message"
        required
        rows={3}
        placeholder="What's up?"
        aria-label="Message"
        maxLength={5000}
        disabled={busy}
        className={`${field} resize-none`}
        style={{ borderRadius: "var(--radius)" }}
      />

      <button
        type="submit"
        disabled={busy}
        className="border border-[color:var(--ink)] bg-[color:var(--ink)] px-[var(--s3)] py-[var(--s2)] text-[color:var(--paper)] transition-opacity hover:opacity-85 disabled:opacity-60"
        style={{ borderRadius: "var(--radius)" }}
      >
        {LABEL[status]}
      </button>

      {status === "error" && error && (
        <p role="alert" className="mono m-0" style={{ lineHeight: 1.5 }}>
          {error} Or email{" "}
          <a
            href={`mailto:${profile.email}`}
            className="underline underline-offset-2"
            style={{ color: "var(--ink)" }}
          >
            {profile.email}
          </a>{" "}
          directly.
        </p>
      )}
    </form>
  );
}
