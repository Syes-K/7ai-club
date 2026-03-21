# API：应用配置（version=0.0.4）

**关联需求**：`iterations/0.0.4/product/prd-console-config-json.md`  
**关联设计**：`iterations/0.0.4/design/spec-console-config-json.md`

---

## 1. `GET /api/console/config`

返回当前**合并后**配置及可选警告。

**响应 200**

```json
{
  "config": {
    "maxMessagesInContext": 40,
    "defaultProvider": "zhipu",
    "defaultModel": "glm-4-flash",
    "chatLoggingEnabled": true,
    "appDisplayName": "AI 对话"
  },
  "warning": null
}
```

- `warning`：文件存在但 **JSON 无法解析** 时为中文说明字符串；否则 `null`。

---

## 2. `PUT /api/console/config`

请求体为**扁平**配置对象（与 `config` 字段结构相同）。校验通过后**原子写入** JSON。

**响应**

| 状态 | 说明 |
|------|------|
| 200 | `{ "ok": true }` |
| 400 | `{ "error": "…" }`（校验失败或无效 JSON） |
| 500 | `{ "error": "…" }`（写盘失败） |

**校验规则摘要**

- `maxMessagesInContext`：1～200 整数  
- `defaultProvider`：`zhipu` \| `deepseek`  
- `defaultModel`：须在 `ZHIPU_MODEL_IDS`  
- `chatLoggingEnabled`：布尔  
- `appDisplayName`：非空，最长 40 字符  

---

## 3. `GET /api/config/public`

供对话页等**客户端**读取；**不包含** `chatLoggingEnabled`。

**响应 200**

```json
{
  "maxMessagesInContext": 40,
  "defaultProvider": "zhipu",
  "defaultModel": "glm-4-flash",
  "appDisplayName": "AI 对话"
}
```

---

## 4. 环境变量与文件路径

| 变量 | 说明 |
|------|------|
| `APP_CONFIG_PATH` | 配置文件绝对或相对路径；未设置时为 `<cwd>/.data/app-config.json` |

---

## 5. 文档路径

- 迭代：`iterations/0.0.4/backend/api-spec.md`
- 同步：本文档
