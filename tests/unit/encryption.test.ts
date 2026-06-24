import { describe, expect, it, vi } from "vitest";

vi.stubEnv(
  "LLM_ENCRYPTION_KEY",
  Buffer.from("0123456789abcdef0123456789abcdef").toString("base64"),
);

import { decryptApiKey, encryptApiKey } from "@/lib/llm/encryption";

describe("API key encryption", () => {
  it("round-trips plaintext", () => {
    const ciphertext = encryptApiKey("sk-test-secret-key");
    expect(ciphertext).not.toContain("sk-test");
    expect(decryptApiKey(ciphertext)).toBe("sk-test-secret-key");
  });
});
