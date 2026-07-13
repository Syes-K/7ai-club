import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPlatformDefaultResolved,
  getPlatformDefaultApiKey,
} from "@/lib/llm/provider";

const ROOT = process.cwd();

describe("AC-132 iter-12 platform deprecation", () => {
  it("buildPlatformDefaultResolved returns null", () => {
    expect(buildPlatformDefaultResolved()).toBeNull();
  });

  it("getPlatformDefaultApiKey returns null", () => {
    expect(getPlatformDefaultApiKey()).toBeNull();
  });

  it("resolve-user-model does not use env BAILIAN_API_KEY or buildPlatformDefaultResolved", () => {
    const source = readFileSync(
      join(ROOT, "lib/llm/resolve-user-model.ts"),
      "utf8",
    );
    expect(source).not.toContain("BAILIAN_API_KEY");
    expect(source).not.toContain("buildPlatformDefaultResolved");
    expect(source).toContain("resolvePlatformModelById");
  });

  it("chat workflow resolve node delegates to resolveUserModelForChat", () => {
    const source = readFileSync(
      join(ROOT, "lib/workflow/nodes/resolve-model.ts"),
      "utf8",
    );
    expect(source).toContain("resolveUserModelForChat");
    expect(source).not.toContain("BAILIAN_API_KEY");
  });
});
