# 用户故事：/console 与 JSON 配置（version=0.0.4）

## US-1：打开管理页并查看配置

**作为** 管理员，**我想要** 访问 `/console` 看到当前配置，**以便** 确认运行参数。

### 验收标准（AC）

- [ ] 浏览器访问 `/console` 可打开管理界面（非 404）。
- [ ] 展示的字段与 PRD 中首版配置项一致，数值与当前 JSON 合并默认值后的结果一致。
- [ ] JSON 文件不存在时，展示**内置默认值**且无白屏错误。

---

## US-2：保存配置到 JSON

**作为** 管理员，**我想要** 修改表单并保存，**以便** 无需改代码即可调整参数。

### 验收标准（AC）

- [ ] 点击保存后，`.data`（或环境变量指定路径）下 JSON 文件更新，且结构稳定、可读。
- [ ] 非法值（如负数、非法智谱 model）**不**落盘，并提示错误原因。
- [ ] 写入过程避免半写文件导致解析失败（原子写或等价策略）。

---

## US-3：对话与 API 使用运行时配置

**作为** 系统，**我想要** 在请求处理与页面默认态使用配置中的值，**以便** 配置保存后立即或短延迟内生效。

### 验收标准（AC）

- [ ] 服务端上下文条数上限使用配置中的 `maxMessagesInContext`（与现 `MAX_MESSAGES_IN_CONTEXT` 语义一致）。
- [ ] 新用户打开对话页的默认厂商与智谱型号与 `defaultProvider` / `defaultModel` 一致；DeepSeek 所用 model id 为代码固定值。
- [ ] 页面标题与对话顶栏展示名使用 `appDisplayName`（或 PRD 约定字段）。

---

## US-4：日志开关

**作为** 管理员，**我想要** 关闭聊天日志，**以便** 在不需要排障时减少 IO 与控制台噪音。

### 验收标准（AC）

- [ ] `chatLoggingEnabled === false` 时，`logChat` **不**再向 `.logs` 写入文件。
- [ ] 行为是否在同时关闭 `console` 输出，与实现说明一致并在本故事验收。

---

## US-5：可扩展存储（文档）

**作为** 维护者，**我想要** 文档说明如何替换 JSON 为其他存储，**以便** 后续演进。

### 验收标准（AC）

- [ ] `iterations/0.0.4/backend/`（及同步 `docs/backend/`）中说明配置读取抽象位置与替换方式。

---

## 文档路径

- 迭代：`iterations/0.0.4/product/user-stories-console-config-json.md`
- 同步：`docs/product/user-stories-console-config-json.md`
