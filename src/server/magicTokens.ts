import { createHmac, timingSafeEqual } from "node:crypto";

const tokenLifetimeMs = 10 * 60 * 1000;

const devFallbackSecret = "local-development-secret-change-me";

/** Local/CI only: show magic links in the API response instead of emailing them. */
export function devMagicLinksEnabled(): boolean {
  return process.env.AUTH_DEV_MAGIC_LINK === "1";
}

function secret(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (devMagicLinksEnabled()) {
    return devFallbackSecret;
  }
  // Fail closed: the built-in secret is public, so tokens signed with it are forgeable.
  throw new Error("AUTH_SECRET is not configured.");
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createMagicToken(email: string): string {
  const payload = base64url(
    JSON.stringify({
      email: email.trim().toLocaleLowerCase("en-US"),
      exp: Date.now() + tokenLifetimeMs
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyMagicToken(token: string): string {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    throw new Error("Magic link is invalid or expired.");
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error("Magic link is invalid or expired.");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    email?: unknown;
    exp?: unknown;
  };
  if (typeof decoded.email !== "string" || typeof decoded.exp !== "number") {
    throw new Error("Magic link is invalid or expired.");
  }
  if (decoded.exp < Date.now()) {
    throw new Error("Magic link has expired. Request a new link.");
  }
  return decoded.email;
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}
