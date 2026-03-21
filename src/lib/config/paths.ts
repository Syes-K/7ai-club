import path from "node:path";

export function getAppConfigFilePath(): string {
  const fromEnv = process.env.APP_CONFIG_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), ".data", "app-config.json");
}
