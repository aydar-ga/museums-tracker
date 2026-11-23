import { NextRequest, NextResponse } from "next/server";

import { createMagicToken, devMagicLinksEnabled, isValidEmail } from "@/server/magicTokens";

const unavailableMessage = "Email sign-in is not available right now. Please try again later.";

type EmailConfig = { apiKey: string; from: string };

function emailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  return apiKey && from ? { apiKey, from } : null;
}

async function sendWithResend(config: EmailConfig, email: string, magicLink: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: email,
      subject: "Your Museums EU Atlas magic link",
      html: `<p>Open your Museums EU Atlas magic link:</p><p><a href="${magicLink}">${magicLink}</a></p><p>This link expires in 10 minutes.</p>`
    })
  });

  if (!response.ok) {
    throw new Error("Email provider rejected the magic link request.");
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLocaleLowerCase("en-US") : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // The link is a login credential: it goes to the inbox, and is only returned
  // to the caller when AUTH_DEV_MAGIC_LINK=1 (local development and CI).
  const config = emailConfig();
  if (!config && !devMagicLinksEnabled()) {
    return NextResponse.json({ error: unavailableMessage }, { status: 503 });
  }

  try {
    // Never use the client-supplied Origin header: it would let a caller point
    // the emailed link (and its token) at their own domain.
    const origin = (process.env.PUBLIC_APP_URL?.trim() || new URL(request.url).origin).replace(/\/$/, "");
    const magicLink = `${origin}/magic-link?token=${encodeURIComponent(createMagicToken(email))}`;

    if (config) {
      await sendWithResend(config, email, magicLink);
      return NextResponse.json({ email, delivery: "email" });
    }
    return NextResponse.json({ email, magicLink, delivery: "dev" });
  } catch {
    return NextResponse.json({ error: unavailableMessage }, { status: 503 });
  }
}
