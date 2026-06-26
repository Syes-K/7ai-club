import { describe, expect, it } from "vitest";
import { matchBestRunPerUserMessage } from "@/lib/workflow/match-runs-to-messages";

describe("matchBestRunPerUserMessage", () => {
  const userMessages = [
    { id: "user-1", createdAt: "2026-06-25T14:24:00.000Z" },
    { id: "user-2", createdAt: "2026-06-25T14:30:00.000Z" },
    { id: "user-3", createdAt: "2026-06-25T15:07:00.000Z" },
  ];

  it("picks the latest completed run within each user-message window", () => {
    const matches = matchBestRunPerUserMessage(
      [
        {
          id: "run-old-1",
          startedAt: "2026-06-25T14:24:10.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 4,
        },
        {
          id: "run-new-1",
          startedAt: "2026-06-25T14:29:00.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 7,
        },
        {
          id: "run-old-2",
          startedAt: "2026-06-25T14:30:10.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 4,
        },
        {
          id: "run-new-2",
          startedAt: "2026-06-25T14:33:00.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 7,
        },
        {
          id: "run-latest",
          startedAt: "2026-06-25T15:07:20.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 7,
        },
      ],
      userMessages,
    );

    expect(matches.get("user-1")?.id).toBe("run-new-1");
    expect(matches.get("user-2")?.id).toBe("run-new-2");
    expect(matches.get("user-3")?.id).toBe("run-latest");
  });

  it("prefers explicit user_message_id matches over window inference", () => {
    const matches = matchBestRunPerUserMessage(
      [
        {
          id: "run-window",
          startedAt: "2026-06-25T15:07:20.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 7,
        },
        {
          id: "run-explicit",
          startedAt: "2026-06-25T15:07:19.000Z",
          status: "completed",
          userMessageId: "user-3",
          stepCount: 7,
        },
      ],
      userMessages,
    );

    expect(matches.get("user-3")?.id).toBe("run-explicit");
  });

  it("ignores cancelled runs", () => {
    const matches = matchBestRunPerUserMessage(
      [
        {
          id: "run-cancelled",
          startedAt: "2026-06-25T15:07:19.000Z",
          status: "cancelled",
          userMessageId: null,
          stepCount: 7,
        },
        {
          id: "run-completed",
          startedAt: "2026-06-25T15:07:20.000Z",
          status: "completed",
          userMessageId: null,
          stepCount: 4,
        },
      ],
      userMessages,
    );

    expect(matches.get("user-3")?.id).toBe("run-completed");
  });
});
