import type { NextRequest } from "next/server";
import { connection, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  await connection();

  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return new NextResponse("Missing webhook signature headers.", {
      status: 400,
    });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(
      "[resend webhook] not configured: RESEND_WEBHOOK_SECRET is required.",
    );
    return new NextResponse("Webhook is not configured.", { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return new NextResponse("Invalid webhook signature.", { status: 400 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const publicEmail = process.env.PUBLIC_EMAIL;
  const forwardTo = process.env.FORWARD_TO;

  if (!apiKey || !publicEmail || !forwardTo) {
    console.error(
      "[resend webhook] not configured: RESEND_API_KEY, PUBLIC_EMAIL and FORWARD_TO are all required.",
    );
    return new NextResponse("Forwarding is not configured.", { status: 500 });
  }

  try {
    const { data, error } = await resend.emails.receiving.forward(
      {
        emailId: event.data.email_id,
        to: forwardTo,
        from: `Portfolio <${publicEmail}>`,
      },
      {
        // Resend retries webhooks. The email ID keeps those retries from
        // producing duplicate forwards.
        idempotencyKey: `inbound-forward-${event.data.email_id}`,
      },
    );

    if (error) {
      console.error(
        `[resend webhook] forward refused: ${error.name}: ${error.message}`,
      );
      return new NextResponse("Could not forward the received email.", {
        status: 502,
      });
    }

    return NextResponse.json({ forwarded: true, id: data?.id });
  } catch (cause) {
    console.error("[resend webhook] forward threw:", cause);
    return new NextResponse("Could not forward the received email.", {
      status: 502,
    });
  }
}
