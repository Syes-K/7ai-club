import path from "node:path";

export function getIntentRoutingConfigFilePath(): string {
  const fromEnv = process.env.INTENT_ROUTING_CONFIG_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "intent-routing-config.json");
}
