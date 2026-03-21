# 数据模型：`AppConfig` JSON（version=0.0.4）

## 1. 文件形态

单文件 JSON，UTF-8，缩进 2 空格（写入时）。

## 2. 字段

与 `src/lib/config/defaults.ts` 中 `AppConfig` 一致。DeepSeek 请求的 model id 为代码常量 `DEEPSEEK_DEFAULT_MODEL`（`src/lib/chat/constants.ts`），**不在** JSON 中配置。

## 3. 读取语义

- 缺失键用 `FALLBACK_DEFAULTS` 补齐。  
- `defaultModel` 若非已知智谱 id，合并时回退默认。  
- 解析失败：整表回退默认，`GET /api/console/config` 带 `warning`。

## 4. 扩展

替换为数据库时：保留 `getAppConfig()` / `writeAppConfigAtomic` 的调用方不变，在 `read-write.ts` 换实现即可。

## 5. 文档路径

- 迭代：`iterations/0.0.4/backend/data-models.md`
- 同步：本文档
