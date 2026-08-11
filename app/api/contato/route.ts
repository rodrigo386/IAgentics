import { NextResponse } from "next/server";

/**
 * Contact endpoint.
 *
 * NOT WIRED TO AN INBOX YET. It validates and accepts the payload so the form's real
 * loading / success / error states work end to end, but the message currently goes
 * nowhere but the server log.
 *
 * TODO: forward to the destination the team actually reads. Any of:
 *   - transactional email (Resend / SendGrid / SES) to the commercial address
 *   - the CRM the team uses for inbound leads
 *   - a Slack or Teams incoming webhook
 * Add the credential as an env var and send it from here. Keep the response shape.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { name, email, message } = (payload ?? {}) as Record<string, unknown>;

  const valid =
    typeof name === "string" &&
    name.trim().length > 0 &&
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    typeof message === "string" &&
    message.trim().length >= 8;

  if (!valid) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 422 });
  }

  console.info("[contato] nova mensagem recebida", { name, email });

  return NextResponse.json({ ok: true });
}
