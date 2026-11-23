// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { createMagicToken, verifyMagicToken } from "./magicTokens";

describe("magic tokens", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a token signed with AUTH_SECRET", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    expect(verifyMagicToken(createMagicToken("Visitor@Example.com"))).toBe("visitor@example.com");
  });

  it("refuses to sign or verify with the built-in secret outside dev mode", () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "");
    expect(() => createMagicToken("visitor@example.com")).toThrow(/AUTH_SECRET/);

    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "1");
    const forged = createMagicToken("visitor@example.com");
    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "");
    expect(() => verifyMagicToken(forged)).toThrow();
  });

  it("uses the built-in secret only when AUTH_DEV_MAGIC_LINK=1", () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_DEV_MAGIC_LINK", "1");
    expect(verifyMagicToken(createMagicToken("dev@example.com"))).toBe("dev@example.com");
  });
});
