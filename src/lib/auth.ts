import type { MagicLinkResponse } from "../types";

const devTokenPrefix = "dev.";

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

export function createDevMagicToken(email: string): string {
  return `${devTokenPrefix}${btoa(
    JSON.stringify({
      email: email.trim().toLocaleLowerCase("en-US"),
      exp: Date.now() + 10 * 60 * 1000
    })
  )}`;
}

export function consumeDevMagicToken(token: string): string {
  if (!token.startsWith(devTokenPrefix)) {
    throw new Error("Magic link is invalid or expired.");
  }
  const payload = JSON.parse(atob(token.slice(devTokenPrefix.length))) as {
    email?: unknown;
    exp?: unknown;
  };
  if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
    throw new Error("Magic link is invalid or expired.");
  }
  if (payload.exp < Date.now()) {
    throw new Error("Magic link has expired. Request a new link.");
  }
  return payload.email;
}

// Without a reachable route handler (component tests, offline dev) the client can
// fall back to an unsigned local token. Production builds never do this.
function allowLocalFallback(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: unknown };
  return typeof body.error === "string" ? body.error : fallback;
}

export async function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  let response: Response;
  try {
    response = await fetch("/api/auth/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail })
    });
  } catch {
    if (!allowLocalFallback()) {
      throw new Error("Could not reach the server. Please try again.");
    }
    const token = createDevMagicToken(normalizedEmail);
    return {
      email: normalizedEmail,
      magicLink: absoluteUrl(`/magic-link?token=${encodeURIComponent(token)}`),
      delivery: "dev"
    };
  }

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Could not send the magic link. Please try again later."));
  }
  return (await response.json()) as MagicLinkResponse;
}

export async function verifyMagicLink(token: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/auth/verify-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
  } catch {
    if (!allowLocalFallback()) {
      throw new Error("Could not reach the server. Please try again.");
    }
    return consumeDevMagicToken(token);
  }

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Magic link is invalid or expired."));
  }
  const body = (await response.json()) as { email: string };
  return body.email;
}
