import fs from "node:fs";
import path from "node:path";
import { INTENT_ROUTING_DEFAULTS } from "./defaults";
import { getIntentRoutingConfigFilePath } from "./paths";
import { validateIntentRoutingConfig } from "./validate";
import type { IntentRoutingConfig } from "./types";

export type IntentRoutingReadMeta = {
  config: IntentRoutingConfig;
  warning: string | null;
};

export function readIntentRoutingConfigWithMeta(): IntentRoutingReadMeta {
  const filePath = getIntentRoutingConfigFilePath();
  if (!fs.existsSync(filePath)) {
    return {
      config: { ...INTENT_ROUTING_DEFAULTS },
      warning: null,
    };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const validated = validateIntentRoutingConfig(parsed);
    if (!validated.ok) {
      return {
        config: { ...INTENT_ROUTING_DEFAULTS },
        warning:
          "意图路由配置文件不合法，已回退默认配置。保存后将写入新文件。",
      };
    }
    return { config: validated.config, warning: null };
  } catch {
    return {
      config: { ...INTENT_ROUTING_DEFAULTS },
      warning:
        "意图路由配置文件无法解析，已回退默认配置。保存后将写入新文件。",
    };
  }
}

export function getIntentRoutingConfig(): IntentRoutingConfig {
  return readIntentRoutingConfigWithMeta().config;
}

export function writeIntentRoutingConfigAtomic(config: IntentRoutingConfig): void {
  const filePath = getIntentRoutingConfigFilePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  const payload = `${JSON.stringify(config, null, 2)}\n`;
  fs.writeFileSync(tmp, payload, "utf8");
  fs.renameSync(tmp, filePath);
}
