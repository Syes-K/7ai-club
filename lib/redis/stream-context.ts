import { after } from "next/server";
import { createClient } from "redis";
import { createResumableStreamContext } from "resumable-stream/redis";
import type { ResumableStreamContext } from "resumable-stream";
import {
  getRedisProtocolUrl,
  getResumableStreamKeyPrefix,
  getResumableStreamTtlSeconds,
  isRedisConfigured,
  warnRedisMissingOnce,
} from "@/lib/redis/client";

let streamContext: ResumableStreamContext | null = null;
let publisherClient: ReturnType<typeof createClient> | null = null;
let subscriberClient: ReturnType<typeof createClient> | null = null;

async function ensureRedisClients() {
  const url = getRedisProtocolUrl();
  if (!url) {
    return null;
  }

  if (!publisherClient) {
    publisherClient = createClient({ url });
    await publisherClient.connect();
  }

  if (!subscriberClient) {
    subscriberClient = createClient({ url });
    await subscriberClient.connect();
  }

  return { publisher: publisherClient, subscriber: subscriberClient };
}

export async function getResumableStreamContext(): Promise<ResumableStreamContext | null> {
  if (!isRedisConfigured()) {
    warnRedisMissingOnce();
    return null;
  }

  if (streamContext) {
    return streamContext;
  }

  const clients = await ensureRedisClients();
  if (!clients) {
    return null;
  }

  streamContext = createResumableStreamContext({
    waitUntil: after,
    publisher: clients.publisher,
    subscriber: clients.subscriber,
  });

  return streamContext;
}

export async function createResumableStream(
  streamId: string,
  makeStream: () => ReadableStream<string>,
): Promise<ReadableStream<string> | null> {
  const context = await getResumableStreamContext();
  if (!context) {
    return makeStream();
  }

  const stream = await context.createNewResumableStream(streamId, makeStream);
  const ttl = getResumableStreamTtlSeconds();
  const prefix = getResumableStreamKeyPrefix();

  if (publisherClient) {
    await publisherClient.set(`${prefix}:sentinel:${streamId}`, "1", {
      EX: ttl,
    });
  }

  return stream;
}

export async function resumeResumableStream(
  streamId: string,
): Promise<ReadableStream<string> | null | undefined> {
  const context = await getResumableStreamContext();
  if (!context) {
    return undefined;
  }

  return context.resumeExistingStream(streamId);
}

export async function markResumableStreamDone(streamId: string): Promise<void> {
  if (!publisherClient) {
    return;
  }

  const prefix = getResumableStreamKeyPrefix();
  await publisherClient.set(`${prefix}:sentinel:${streamId}`, "DONE", {
    EX: 60,
  });
  await publisherClient.del(`${prefix}:sentinel:${streamId}`);
}
