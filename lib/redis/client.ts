import { Redis } from "@upstash/redis";

const STREAM_KEY_PREFIX = "resumable-stream:rs";
const STREAM_TTL_SECONDS = 45 * 60;

let redisRestClient: Redis | null = null;
let warnedMissingRedis = false;

export function isRedisConfigured(): boolean {
  return Boolean(getRedisProtocolUrl());
}

export function getRedisProtocolUrl(): string | null {
  const direct = process.env.UPSTASH_REDIS_URL?.trim();
  if (direct) {
    return direct;
  }

  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!restUrl || !token) {
    return process.env.REDIS_URL?.trim() ?? null;
  }

  const host = new URL(restUrl).hostname;
  return `rediss://default:${encodeURIComponent(token)}@${host}:6379`;
}

export function getUpstashRestClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  if (!redisRestClient) {
    redisRestClient = new Redis({ url, token });
  }

  return redisRestClient;
}

export function warnRedisMissingOnce(): void {
  if (warnedMissingRedis || isRedisConfigured()) {
    return;
  }

  warnedMissingRedis = true;
  console.warn(
    "Upstash Redis is not configured; stream resume is disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
  );
}

export function getResumableStreamKeyPrefix(): string {
  return STREAM_KEY_PREFIX;
}

export function getResumableStreamTtlSeconds(): number {
  return STREAM_TTL_SECONDS;
}

export async function expireResumableStreamKeys(
  streamId: string,
): Promise<void> {
  const redis = getUpstashRestClient();
  if (!redis) {
    return;
  }

  const sentinelKey = `${STREAM_KEY_PREFIX}:sentinel:${streamId}`;
  await redis.expire(sentinelKey, STREAM_TTL_SECONDS);
}
