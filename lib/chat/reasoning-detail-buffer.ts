/** Fixed flush interval for reasoning delta buffer (ms). */
export const REASONING_BUFFER_FLUSH_MS = 300;

type Listener = () => void;

function bufferKey(runId: string, nodeId: string): string {
  return `${runId}:${nodeId}`;
}

const buffers = new Map<string, string>();
const pendingChunks = new Map<string, string[]>();
const expandedKeys = new Set<string>();
const metaListeners = new Map<string, Set<Listener>>();
const detailListeners = new Map<string, Set<Listener>>();

let flushIntervalId: ReturnType<typeof setInterval> | null = null;

function notify(listeners: Set<Listener> | undefined): void {
  listeners?.forEach((listener) => listener());
}

function subscribe(
  registry: Map<string, Set<Listener>>,
  runId: string,
  nodeId: string,
  listener: Listener,
): () => void {
  const key = bufferKey(runId, nodeId);
  const set = registry.get(key) ?? new Set<Listener>();
  set.add(listener);
  registry.set(key, set);

  return () => {
    set.delete(listener);
    if (set.size === 0) {
      registry.delete(key);
    }
  };
}

function applyCombinedDelta(key: string, combined: string): void {
  if (!combined) {
    return;
  }

  const hadContent = (buffers.get(key)?.length ?? 0) > 0;
  buffers.set(key, (buffers.get(key) ?? "") + combined);
  const hasContent = (buffers.get(key)?.length ?? 0) > 0;

  if (!hadContent && hasContent) {
    notify(metaListeners.get(key));
  }

  if (expandedKeys.has(key)) {
    notify(detailListeners.get(key));
  }
}

export function flushPendingReasoningDeltas(): void {
  for (const [key, chunks] of pendingChunks) {
    if (chunks.length === 0) {
      continue;
    }

    pendingChunks.delete(key);
    applyCombinedDelta(key, chunks.join(""));
  }

  if (pendingChunks.size === 0) {
    stopFlushInterval();
  }
}

function stopFlushInterval(): void {
  if (flushIntervalId != null) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
}

function ensureFlushInterval(): void {
  if (flushIntervalId != null) {
    return;
  }

  flushIntervalId = setInterval(() => {
    flushPendingReasoningDeltas();
  }, REASONING_BUFFER_FLUSH_MS);
}

function scheduleFlush(): void {
  ensureFlushInterval();
}

export function cancelPendingReasoningFlush(): void {
  stopFlushInterval();
}

/** O(1) enqueue; merged and flushed every {@link REASONING_BUFFER_FLUSH_MS} ms. */
export function queueReasoningDetailDelta(
  runId: string,
  nodeId: string,
  delta: string,
): void {
  if (!delta) {
    return;
  }

  const key = bufferKey(runId, nodeId);
  const chunks = pendingChunks.get(key) ?? [];
  chunks.push(delta);
  pendingChunks.set(key, chunks);
  scheduleFlush();
}

export function setReasoningDetailExpanded(
  runId: string,
  nodeId: string,
  expanded: boolean,
): void {
  const key = bufferKey(runId, nodeId);
  if (expanded) {
    expandedKeys.add(key);
    return;
  }

  expandedKeys.delete(key);
}

export function getReasoningDetailLength(
  runId: string,
  nodeId: string,
): number {
  const key = bufferKey(runId, nodeId);
  const pending = pendingChunks.get(key);
  const pendingLength = pending?.reduce((sum, chunk) => sum + chunk.length, 0) ?? 0;
  return (buffers.get(key)?.length ?? 0) + pendingLength;
}

export function getReasoningDetail(runId: string, nodeId: string): string {
  const key = bufferKey(runId, nodeId);
  const pending = pendingChunks.get(key);
  const pendingText = pending?.join("") ?? "";
  return (buffers.get(key) ?? "") + pendingText;
}

export function subscribeReasoningMeta(
  runId: string,
  nodeId: string,
  listener: Listener,
): () => void {
  return subscribe(metaListeners, runId, nodeId, listener);
}

export function subscribeReasoningDetail(
  runId: string,
  nodeId: string,
  listener: Listener,
): () => void {
  return subscribe(detailListeners, runId, nodeId, listener);
}

export function clearReasoningDetailBuffer(
  runId: string,
  nodeId: string,
): void {
  const key = bufferKey(runId, nodeId);
  buffers.delete(key);
  pendingChunks.delete(key);
  expandedKeys.delete(key);
  metaListeners.delete(key);
  detailListeners.delete(key);
}

export function clearAllReasoningDetailBuffers(): void {
  cancelPendingReasoningFlush();
  buffers.clear();
  pendingChunks.clear();
  expandedKeys.clear();
  metaListeners.clear();
  detailListeners.clear();
}
