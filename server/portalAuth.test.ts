import { describe, expect, it } from "vitest";
import { hashPassword, newSessionToken, verifyPassword } from "./portalAuth";

describe("portal credentials", () => {
  it("stores a salted password hash and verifies only the matching password", async () => {
    const first = await hashPassword("long-enough-passphrase");
    const second = await hashPassword("long-enough-passphrase");
    expect(first).not.toBe("long-enough-passphrase");
    expect(first).not.toBe(second);
    await expect(verifyPassword("long-enough-passphrase", first)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-passphrase", first)).resolves.toBe(false);
  });

  it("creates non-empty opaque session tokens", () => {
    const first = newSessionToken();
    const second = newSessionToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(second).not.toBe(first);
  });
});
