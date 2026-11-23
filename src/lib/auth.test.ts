import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consumeDevMagicToken,
  createDevMagicToken,
  isValidEmail,
  requestMagicLink,
  verifyMagicLink
} from "./auth";

describe("auth helpers", () => {
  it("validates email shape", () => {
    expect(isValidEmail("visitor@example.com")).toBe(true);
    expect(isValidEmail("not-email")).toBe(false);
  });

  it("round-trips local dev magic tokens", () => {
    const token = createDevMagicToken("Visitor@Example.com");
    expect(consumeDevMagicToken(token)).toBe("visitor@example.com");
  });

  describe("server responses", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("surfaces a 503 from the server instead of inventing a local link", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ error: "Email sign-in is not available right now." }, { status: 503 })
        )
      );
      await expect(requestMagicLink("visitor@example.com")).rejects.toThrow(
        "Email sign-in is not available right now."
      );
    });

    it("rejects a link the server refused instead of accepting it locally", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json({ error: "Magic link is invalid or expired." }, { status: 400 }))
      );
      const forged = createDevMagicToken("someone-else@example.com");
      await expect(verifyMagicLink(forged)).rejects.toThrow("Magic link is invalid or expired.");
    });
  });
});
