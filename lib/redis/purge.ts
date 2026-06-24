import {
  getResumableStreamKeyPrefix,
  getUpstashRestClient,
} from "@/lib/redis/client";
import { markResumableStreamDone } from "@/lib/redis/stream-context";

const DONE_VALUE = "DONE";

export async function purgeResumableStream(
  streamId: string | null | undefined,
): Promise<void> {
  if (!streamId) {
    return;
  }

  try {
    const prefix = getResumableStreamKeyPrefix();
    const sentinelKey = `${prefix}:sentinel:${streamId}`;
    const redis = getUpstashRestClient();

    if (redis) {
      await redis.set(sentinelKey, DONE_VALUE, { ex: 60 });
      await redis.del(sentinelKey);
      return;
    }

    await markResumableStreamDone(streamId);
  } catch (error) {
    console.error("Failed to purge resumable stream:", { streamId, error });
  }
}
