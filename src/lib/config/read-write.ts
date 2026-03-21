import fs from "node:fs";
import path from "node:path";
import type { AppConfig } from "./defaults";
import { mergeAppConfigPartial } from "./merge";
import { getAppConfigFilePath } from "./paths";

export type AppConfigReadMeta = {
  config: AppConfig;
  /** 文件存在但无法解析或结构无效时由调用方设置 */
  warning: string | null;
};

export function readAppConfigWithMeta(): AppConfigReadMeta {
  const filePath = getAppConfigFilePath();
  if (!fs.existsSync(filePath)) {
    return { config: mergeAppConfigPartial(null), warning: null };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return { config: mergeAppConfigPartial(parsed), warning: null };
  } catch {
    return {
      config: mergeAppConfigPartial(null),
      warning:
        "配置文件无法解析，已使用内置默认值。保存后将写入新文件。",
    };
  }
}

export function getAppConfig(): AppConfig {
  return readAppConfigWithMeta().config;
}

/** 原子写入 JSON（UTF-8） */
export function writeAppConfigAtomic(config: AppConfig): void {
  const filePath = getAppConfigFilePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  const payload = `${JSON.stringify(config, null, 2)}\n`;
  fs.writeFileSync(tmp, payload, "utf8");
  fs.renameSync(tmp, filePath);
}
