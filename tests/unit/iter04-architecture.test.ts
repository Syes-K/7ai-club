import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkFiles(fullPath, acc);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

describe("iter-04 architecture constraints", () => {
  it("AC-34: chat and model API routes under app/api", () => {
    const apiDir = join(ROOT, "app/api");
    const routeFiles = walkFiles(apiDir)
      .filter((file) => file.endsWith("route.ts"))
      .map((file) => relative(ROOT, file))
      .sort();

    expect(routeFiles).toEqual(
      [
        "app/api/chat/[conversationId]/stream/route.ts",
        "app/api/chat/[conversationId]/workflow/route.ts",
        "app/api/chat/route.ts",
        "app/api/models/[id]/key/route.ts",
        "app/api/models/[id]/test/route.ts",
        "app/api/models/route.ts",
      ].sort(),
    );
  });

  it("AC-34: chat panel is the only component that calls /api/chat", () => {
    const componentFiles = walkFiles(join(ROOT, "components"));
    const apiFetchHits: string[] = [];

    for (const file of componentFiles) {
      const source = readFileSync(file, "utf8");
      if (source.includes('"/api/') || source.includes("'/api/")) {
        apiFetchHits.push(relative(ROOT, file));
      }
    }

    expect(apiFetchHits).toEqual(["components/chat/chat-conversation-panel.tsx"]);
  });

  it("components do not import Supabase except auth allowlist", () => {
    const allowlist = new Set([
      "components/auth/auth-form.tsx",
      "components/layout/user-menu.tsx",
    ]);

    const violations: string[] = [];

    for (const file of walkFiles(join(ROOT, "components"))) {
      const rel = relative(ROOT, file);
      const source = readFileSync(file, "utf8");
      if (
        source.includes("@/lib/supabase/client")
      ) {
        if (!allowlist.has(rel)) {
          violations.push(rel);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("deprecated session BFF route is removed", () => {
    const sessionRoute = join(
      ROOT,
      "app/api/conversations/[id]/session/route.ts",
    );

    expect(() => statSync(sessionRoute)).toThrow();
  });
});
