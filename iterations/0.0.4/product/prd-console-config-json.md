# PRD：/console 配置后台与 JSON 持久化（version=0.0.4）

## 1. 需求摘要

### 1.1 背景

对话相关能力（上下文条数上限、默认模型、DeepSeek 默认 model id、页面/机器人展示名、日志是否落盘与打控制台等）目前分散在 `constants.ts`、`route-key.ts`、`layout.tsx`、`ChatApp.tsx`、`logger.ts` 等处以**硬编码**维护，调整需改代码与发版。希望提供**后台管理页**做**配置化**，首版数据用 **JSON 文件**持久化，管理入口路由为 **`/console`**。

### 1.2 目标用户

部署本应用的**管理员/开发者**（单机或小团队场景）；不要求多租户。

### 1.3 核心场景

1. 访问 **`/console`**，查看当前生效配置（从 JSON 读取并与默认值合并）。
2. 在表单中修改配置项并**保存**，写入 JSON；后续 **API 与对话页**读取该配置生效（在合理缓存策略下）。
3. 可通过 **日志开关**关闭 `logChat` 的文件写入与/或控制台输出（具体范围见功能范围）。
4. 可配置 **机器人/产品展示名称**（用于顶栏、页面 `title` 等，与 PRD 字段对齐）。

### 1.4 成功指标

- 修改「最大上下文条数」后，**服务端**裁剪行为与配置一致（无需改 `constants.ts` 常量文件中的魔数来生效）。
- 修改默认 `provider`/`model` 后，**新会话/首次进入**的默认选中与校验一致（智谱 model 须在允许列表内）。
- 关闭日志开关后，**不再**向 `.next/logs` 追加（及按设计决定是否静默控制台）。
- JSON 损坏或缺失时，**回退**到内置默认值并可在 console 提示或管理页展示警告。

---

## 2. 功能范围

### 2.1 做（In Scope）

- **路由**：`GET /console` 管理页（Next.js App Router 页面）。
- **存储**：单文件 JSON，路径可由环境变量指定，默认建议 **`项目根/.data/app-config.json`**（与 SQLite 同目录体系，已 `.gitignore` 的 `.data` 可复用）。
- **配置项（首版建议）**：

| 键（示例） | 类型 | 说明 |
|------------|------|------|
| `maxMessagesInContext` | number | 对应现 `MAX_MESSAGES_IN_CONTEXT`，正整数，上下限由校验规定（如 1～200） |
| `defaultProvider` | `"zhipu"` \| `"deepseek"` | 默认厂商 |
| `defaultModel` | string | 智谱默认 model id（须在已支持列表内）；选 DeepSeek 为默认厂商时仍表示「切回智谱」用的型号 |
| `chatLoggingEnabled` | boolean | **新增**：为 `false` 时跳过 `logChat` 的文件写入；控制台是否输出可与之绑定或单独字段（设计定稿二选一，默认绑定同时关闭） |
| `appDisplayName` | string | 展示用名称，用于对话顶栏标题、`<title>` 等（原「AI 对话」） |

- **读取路径**：`validate-request`、`/api/chat` 上下文裁剪、`ChatApp` 默认 provider/model、`providers` DeepSeek model、`logger` 是否写文件等**统一**通过服务端可复用的 **getAppConfig()**（或等价）读取合并后的配置。
- **写入路径**：管理页通过 **Server Action 或 `PUT` API** 写回 JSON；需**原子写**（临时文件 rename）避免半写损坏。
- **校验**：保存前校验枚举、范围、智谱 model 是否在 `ZHIPU_MODEL_IDS`；失败返回明确错误信息。

### 2.2 不做（Out of Scope，首版）

- **登录/鉴权/多角色**（`/console` 默认等同内网工具；可在文档中提示生产环境须网络层或后续迭代加鉴权）。
- **配置版本历史、审计、回滚 UI**。
- **非 JSON 存储**（PostgreSQL 等）——架构上 `getAppConfig` 抽象便于后续替换实现。
- **在 console 内编辑智谱模型清单**（仍以代码内 `zhipu-models.ts` 为准，仅选默认值）。

### 2.3 依赖与假设

- Next.js 16、Node runtime；与现有 SQLite 会话存储**独立文件**，可同目录 `.data/`。

---

## 3. 待设计项（Design Handoff）

| 序号 | 类型 | 名称 | 说明 |
|------|------|------|------|
| D1 | 信息架构 | /console 布局 | 表单分区（模型与上下文 / 展示与日志）；保存、重置为默认、成功/错误反馈 |
| D2 | 交互 | 校验与只读 | 非法 JSON 恢复策略提示；保存中禁用重复提交 |
| D3 | 视觉 | 与主站关系 | 可简单管理风（zinc 中性 + 与主站 violet 点缀一致） |
| D4 | 安全提示 | 无鉴权 | 页头或页脚简短说明：勿暴露公网 |

---

## 4. 与全局文档的关系

- 不替代 `prd-ai-agent.md` 中业务定义，本 PRD 为**运维/配置面**增量。
- 与 **0.0.1 日志 PRD** 兼容：`chatLoggingEnabled` 为运行时总开关，细化行为由设计/实现说明约定。

---

## 5. 文档路径

- 迭代：`iterations/0.0.4/product/prd-console-config-json.md`
- 同步：`docs/product/prd-console-config-json.md`
