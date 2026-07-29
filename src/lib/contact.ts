import { Resend } from "resend";

/**
 * Sending the contact form through Resend.
 *
 * The form used to build a `mailto:` and hand off to the visitor's mail client,
 * which meant it only worked for people who had one configured — on a phone
 * that's usually fine, on a shared desktop it opens something nobody has signed
 * into. This sends the message server-side instead, so the form works the same
 * way for everyone.
 *
 * Three env vars, none of them optional in production:
 *   RESEND_API_KEY  — from the Resend dashboard.
 *   CONTACT_FROM    — an address on a domain verified in Resend.
 *   CONTACT_TO      — wherever the mail should actually land.
 *
 * `CONTACT_FROM` cannot be the visitor's address, tempting as that is. Resend
 * signs outgoing mail with the sending domain's DKIM key, and a From header
 * pointing somewhere else is precisely what SPF and DMARC exist to reject — the
 * message would be dropped or junked rather than delivered. The visitor goes in
 * Reply-To, which is the header actually meant for this, and hitting Reply in a
 * mail client does the expected thing.
 */

/** What a submission has to contain to be worth sending. */
export type ContactInput = {
  name: string;
  email: string;
  message: string;
};

/**
 * Field limits, enforced server-side.
 *
 * The form sets `maxLength` too, but that is a courtesy to whoever is typing —
 * it lives in the browser and anything can POST to the route directly. These
 * are the numbers that actually hold. Generous on purpose: the point is to stop
 * someone pasting a megabyte into the body, not to cut anyone's message short.
 */
const LIMITS = { name: 100, email: 200, message: 5000 } as const;

/**
 * Deliberately loose. Address syntax is far stranger than most patterns allow
 * (quoted locals, plus-addressing, new TLDs), and every regex that tries to be
 * thorough ends up rejecting somebody's real address. Anything that gets past
 * this and isn't deliverable fails at Resend, which is the layer that actually
 * knows.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Invalid = { ok: false; error: string };
export type Valid = { ok: true; value: ContactInput };

/**
 * Whether an arbitrary JSON body is a submission.
 *
 * Returns the reason rather than a bare false, so the route can say what was
 * wrong instead of a blanket "bad request" — and so the messages are written in
 * one place next to the rules that produce them.
 */
export function parse(body: unknown): Valid | Invalid {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Expected an object." };
  }

  const { name, email, message } = body as Record<string, unknown>;

  // Name is the only optional one — "someone" is a perfectly good stand-in, and
  // demanding it buys nothing when the address is what actually matters.
  if (name !== undefined && typeof name !== "string") {
    return { ok: false, error: "Name must be text." };
  }
  if (typeof email !== "string" || !EMAIL.test(email.trim())) {
    return { ok: false, error: "A valid email address is required." };
  }
  if (typeof message !== "string" || !message.trim()) {
    return { ok: false, error: "A message is required." };
  }

  const clean = {
    name: (name ?? "").toString().trim().slice(0, LIMITS.name),
    email: email.trim().slice(0, LIMITS.email),
    message: message.trim().slice(0, LIMITS.message),
  };

  return { ok: true, value: clean };
}

/**
 * Strip anything that could inject a header.
 *
 * Only the subject and the Reply-To are built from user input, and both are
 * single-line headers. A newline in either is how a submission would smuggle in
 * a `Bcc:` of its own, so newlines don't survive contact with them. Resend's API
 * takes JSON rather than a raw message and almost certainly handles this itself,
 * but "the vendor probably escapes it" is not where header injection should be
 * stopped.
 */
function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** The outcome, as far as the route is concerned. */
export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Hand the message to Resend.
 *
 * Never throws: the caller is an API route whose job is to answer, and an
 * unhandled rejection there is a 500 with a stack trace in it. Failures come
 * back as a flag plus something safe to show a stranger, with the real reason
 * going to the server log.
 */
export async function send(input: ContactInput): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const to = process.env.CONTACT_TO;

  if (!key || !from || !to) {
    // A deployment missing these is a configuration mistake, not a visitor
    // error, and it is invisible from the outside — so say so loudly here.
    console.error(
      "[contact] not configured: RESEND_API_KEY, CONTACT_FROM and CONTACT_TO are all required.",
    );
    return { ok: false, error: "Sending isn't configured right now." };
  }

  const who = input.name || "someone";

  try {
    const { error } = await new Resend(key).emails.send({
      from,
      to,
      // Hitting Reply goes to whoever wrote in, not to the sending domain.
      replyTo: oneLine(input.email),
      subject: oneLine(`Hey Erik — ${who}`),
      // Plain text. The body is whatever a stranger typed, and interpolating
      // that into HTML is an injection waiting to happen — there is no markup
      // here worth the escaping it would need.
      text: `${input.message}\n\n— ${who} (${input.email})`,
    });

    if (error) {
      console.error(`[contact] resend refused: ${error.name}: ${error.message}`);
      return { ok: false, error: "Couldn't send that. Try again in a moment." };
    }

    return { ok: true };
  } catch (cause) {
    // Network failure, a malformed key, Resend down.
    console.error("[contact] send threw:", cause);
    return { ok: false, error: "Couldn't send that. Try again in a moment." };
  }
}
