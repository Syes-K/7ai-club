# API 说明：提示词模板（version=0.0.9）

## 1. 存储

- **文件**：默认 `{项目根}/data/prompt-templates.json`（与 `app-config.json` 同目录）。  
- **环境变量**：`PROMPT_TEMPLATES_PATH` 可覆盖路径（绝对或相对）。  
- **写入**：`PUT` 成功时原子写（临时文件 + rename）。

## 2. `GET /api/console/prompt-templates`

**响应 200**

```json
{
  "templates": {
    "contextSummaryInjectPrefix": "…",
    "contextSummarySystem": "…"
  },
  "builtin": {
    "contextSummaryInjectPrefix": "…",
    "contextSummarySystem": "…"
  },
  "warning": null
}
```

- `templates`：磁盘与**内置默认**合并后的**实际生效**字符串（两键必有）。  
- `builtin`：代码内建默认（与首次安装、无文件时逻辑一致），供管理页「恢复默认」回填。  
- `warning`：文件存在但 JSON 无法解析时，为说明文案；此时 `templates` 为全内置默认。

## 3. `PUT /api/console/prompt-templates`

**请求体**（JSON 对象，**须同时包含**两键）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `contextSummaryInjectPrefix` | string | **无占位符**：摘要正文拼在模板渲染结果之后。**或**恰好一处 `{{content}}` 且须在模板末尾，摘要替换该占位符；`{{content}}` 前须有说明文字。不允许其它 `{{name}}` |
| `contextSummarySystem` | string | 须包含子串 `{{maxChars}}`；仅允许占位符 `{{maxChars}}` |

**成功 200**：`{ "ok": true }`

**失败 400**：`{ "error": "…" }`（空模板、非法占位符、缺键等）

**失败 500**：写入异常

## 4. 与对话链路的关系

- 服务端通过 `@/lib/prompt-templates` 的 **`renderPromptTemplate`** 与合并结果组装摘要相关文案；**不**经过本 API 的每次对话仍直接读文件合并逻辑（与 `getAppConfig()` 类似，每次请求内同步读盘，无单独 HTTP）。

## 5. 文档路径

- 迭代：`iterations/0.0.9/backend/api-spec-prompt-templates.md`  
- 同步：`docs/backend/api-spec-prompt-templates.md`
