import { describe, expect, it } from "vitest";
import {
  parseStepDetail,
  splitSummaryAndDetail,
} from "@/lib/workflow/step-payload";

describe("splitSummaryAndDetail", () => {
  it("splits legacy summary payloads", () => {
    expect(splitSummaryAndDetail("Headline\n\nBody")).toEqual({
      summary: "Headline",
      detail: "Body",
      detailFormat: "markdown",
    });
  });
});

describe("parseStepDetail", () => {
  it("prefers explicit detail over legacy summary split", () => {
    expect(
      parseStepDetail({
        runId: "run-1",
        nodeId: "summarize_history",
        label: "Summarizing history",
        status: "success",
        summary: "Headline",
        detail: "Explicit detail",
        detailFormat: "markdown",
      }),
    ).toEqual({
      headline: "Headline",
      detail: "Explicit detail",
      detailFormat: "markdown",
    });
  });
});
