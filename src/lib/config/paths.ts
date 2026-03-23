import path from "node:path";

export function getAppConfigFilePath(): string {
  const fromEnv = process.env.APP_CONFIG_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "app-config.json");
}

export function getPromptTemplatesFilePath(): string {
  const fromEnv = process.env.PROMPT_TEMPLATES_PATH?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "data", "prompt-templates.json");
}
