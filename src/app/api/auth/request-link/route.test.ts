// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://app.example.com/api/auth/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

describe("POST /api/auth/request-link", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("AUTH_EMAIL_FROM", "");
    vi.stubEnv("PUBLIC_APP_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects an invalid email with 400", async () => {
    const response = await POST(request({ email: "not-an-email" }));
    expect(response.status).toBe(400);
  });

  it("returns 503 without a link when email is not configured and dev links are off", async () => {
    const response = await POST(request({ email: "probe@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).not.toHaveProperty("magicLink");
    expect(body.error).toMatch(/not available/i);
  });

  it("returns the link only when AUTH_DEV_MAGIC_LINK=1", async () => {
    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "1");
    const response = await POST(request({ email: "dev@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.delivery).toBe("dev");
    expect(body.magicLink).toMatch(/^https:\/\/app\.example\.com\/magic-link\?token=/);
  });

  it("emails the link without returning it, built from the app URL rather than the Origin header", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("AUTH_EMAIL_FROM", "Atlas <noreply@example.com>");
    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "1");
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({ email: "visitor@example.com" }, { origin: "https://evil.example" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ email: "visitor@example.com", delivery: "email" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(init.body)) as { html: string };
    expect(sent.html).toContain("https://app.example.com/magic-link?token=");
    expect(sent.html).not.toContain("evil.example");
  });

  it("returns 503 without a link when the email provider fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("AUTH_EMAIL_FROM", "Atlas <noreply@example.com>");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));

    const response = await POST(request({ email: "visitor@example.com" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).not.toHaveProperty("magicLink");
  });
});
