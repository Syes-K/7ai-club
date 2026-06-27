import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelPendingReasoningFlush,
  clearReasoningDetailBuffer,
  flushPendingReasoningDeltas,
  getReasoningDetail,
  getReasoningDetailLength,
  queueReasoningDetailDelta,
  setReasoningDetailExpanded,
  subscribeReasoningDetail,
  subscribeReasoningMeta,
} from "@/lib/chat/reasoning-detail-buffer";

describe("reasoning-detail-buffer", () => {
  const runId = "run-1";
  const nodeId = "reasoning";

  beforeEach(() => {
    vi.useFakeTimers();
    cancelPendingReasoningFlush();
  });

  afterEach(() => {
    clearReasoningDetailBuffer(runId, nodeId);
    cancelPendingReasoningFlush();
    vi.useRealTimers();
  });

  it("notifies meta listeners only when content first appears", () => {
    const meta = vi.fn();
    subscribeReasoningMeta(runId, nodeId, meta);

    queueReasoningDetailDelta(runId, nodeId, "a");
    flushPendingReasoningDeltas();
    expect(meta).toHaveBeenCalledTimes(1);
    expect(getReasoningDetailLength(runId, nodeId)).toBe(1);

    queueReasoningDetailDelta(runId, nodeId, "b");
    flushPendingReasoningDeltas();
    expect(meta).toHaveBeenCalledTimes(1);
    expect(getReasoningDetail(runId, nodeId)).toBe("ab");
  });

  it("notifies detail listeners only while expanded", () => {
    const detail = vi.fn();
    subscribeReasoningDetail(runId, nodeId, detail);

    queueReasoningDetailDelta(runId, nodeId, "x");
    flushPendingReasoningDeltas();
    expect(detail).not.toHaveBeenCalled();

    setReasoningDetailExpanded(runId, nodeId, true);
    queueReasoningDetailDelta(runId, nodeId, "y");
    flushPendingReasoningDeltas();
    expect(detail).toHaveBeenCalledTimes(1);

    setReasoningDetailExpanded(runId, nodeId, false);
    queueReasoningDetailDelta(runId, nodeId, "z");
    flushPendingReasoningDeltas();
    expect(detail).toHaveBeenCalledTimes(1);
    expect(getReasoningDetail(runId, nodeId)).toBe("xyz");
  });

  it("merges many deltas into one flush", () => {
    const detail = vi.fn();
    setReasoningDetailExpanded(runId, nodeId, true);
    subscribeReasoningDetail(runId, nodeId, detail);

    queueReasoningDetailDelta(runId, nodeId, "a");
    queueReasoningDetailDelta(runId, nodeId, "b");
    queueReasoningDetailDelta(runId, nodeId, "c");
    expect(detail).not.toHaveBeenCalled();
    expect(getReasoningDetail(runId, nodeId)).toBe("abc");

    flushPendingReasoningDeltas();
    expect(getReasoningDetail(runId, nodeId)).toBe("abc");
    expect(detail).toHaveBeenCalledTimes(1);
  });

  it("flushes on fixed interval while pending", () => {
    const detail = vi.fn();
    setReasoningDetailExpanded(runId, nodeId, true);
    subscribeReasoningDetail(runId, nodeId, detail);

    queueReasoningDetailDelta(runId, nodeId, "hello");
    expect(detail).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(detail).toHaveBeenCalledTimes(1);
    expect(getReasoningDetail(runId, nodeId)).toBe("hello");
  });
});
