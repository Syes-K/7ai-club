import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("AC-140 disabled platform assistants hidden", () => {
  it("listPlatformAssistants filters is_platform and enabled=true", () => {
    const source = readFileSync(
      join(ROOT, "lib/data/browser/assistants.ts"),
      "utf8",
    );

    expect(source).toMatch(/listPlatformAssistants[\s\S]*?\.eq\("is_platform", true\)/);
    expect(source).toMatch(/listPlatformAssistants[\s\S]*?\.eq\("enabled", true\)/);
  });
});
