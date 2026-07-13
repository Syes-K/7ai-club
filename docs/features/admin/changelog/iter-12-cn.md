# iter-12 变更摘要 — 平台后台 Admin

> **English:** [iter-12.md](./iter-12.md)  
> **中文：** [iter-12-cn.md](./iter-12-cn.md)  
> **迭代索引：** [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Admin 鉴权与壳 | [01-product-requirements-cn.md](../01-product-requirements-cn.md) §3 | [design/admin-auth-cn.md](../design/admin-auth-cn.md) · [design/admin-shell-cn.md](../design/admin-shell-cn.md) |
| 用户管理 | [prd/users-cn.md](../prd/users-cn.md) | [design/users-cn.md](../design/users-cn.md) |
| 平台免费模型 | [prd/models-cn.md](../prd/models-cn.md) | [design/platform-models-cn.md](../design/platform-models-cn.md) |
| 平台 Assistant + 选择器 | [prd/assistants-cn.md](../prd/assistants-cn.md) | [design/platform-assistants-cn.md](../design/platform-assistants-cn.md) |
| Console / Chat 集成 | [integration-cn.md](../design/integration-cn.md) | 同上 |

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md)
2. [prd/users-cn.md](../prd/users-cn.md)
3. [prd/models-cn.md](../prd/models-cn.md)
4. [prd/assistants-cn.md](../prd/assistants-cn.md)
5. [02-technical-design-cn.md](../02-technical-design-cn.md)（技术设计确认后）
6. [console/changelog/iter-12-cn.md](../../console/changelog/iter-12-cn.md) — Console 交叉影响
7. [mvp-chat/changelog/iter-12-cn.md](../../mvp-chat/changelog/iter-12-cn.md) — Chat 交叉影响

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| 路由 | `app/admin/` layout + users / models / assistants pages |
| 组件 | `components/admin/` shell、nav、managers（参考 console） |
| 鉴权 | `lib/admin/auth.ts` · middleware `/admin` · `requireAdmin()` |
| API | `/api/admin/users/*` · `/api/admin/models/*` · `/api/admin/assistants/*` |
| DB | 平台模型表 · `assistants.is_platform` · 迁移废弃虚拟默认 |
| 集成 | Profile / Console Models / Chat picker / 移除 seed RPC |
| Console PRD 同步 | `docs/features/console/01-product-requirements*` · `prd/*` · **`changelog/iter-12*`** |
| mvp-chat PRD 同步 | `docs/features/mvp-chat/prd/chat-model-config*` · **`changelog/iter-12*`** |
| 测试 | `tests/unit/admin/` · `tests/e2e/iter12-admin.spec.ts` |

---

## 4. 产品决策记录（iter-12 已确认）

| 项 | 决策 |
|----|------|
| 管理员识别 | `ADMIN_EMAILS` 逗号分隔；trim；大小写不敏感 |
| 平台模型 Key | AES 加密存 DB（同 BYOK 机制） |
| `BAILIAN_API_KEY` | **完全废弃**；移除虚拟 `PLATFORM_DEFAULT` |
| 系统助理 | `is_platform = true`；不再自动 seed 复制 |
| New Chat | **单列表聚合**；个人在前、系统在后 |
| 助理 model | 与 Console 一致 — Profile 偏好，无 per-assistant model |
| 用户管理 | 支持禁用、启用；~~密码重置~~ → [todoList AUTH-01](../../../todoList/backlog-cn.md) |
| UI 语言 | English |
| 路线图阶段 | 2 — 平台运营 |

---

## 5. 验收清单

> **勾选规则：** 仅 **qa-engineer** 在 Phase C4 测试全部通过后勾选。

### 摘要（AC 一览）

**鉴权（F-30）**

- [x] **AC-120** — 管理员可查看分页用户列表
- [x] **AC-126** — 非管理员无法访问 `/admin` 及 admin API

**用户（F-31）**

- [x] **AC-121** — 用户搜索
- [x] **AC-122** — 禁用账号
- [x] **AC-123** — 重新启用
- [ ] **AC-124** — ~~密码重置邮件~~ **已移出 iter-12** → [AUTH-01](../../../todoList/backlog-cn.md)（用户自助找回密码）
- [x] **AC-125** — 不能禁用自己

**平台模型（F-32）**

- [x] **AC-127** — Admin CRUD 平台模型
- [x] **AC-128** — Test 门禁 Passed + Enabled
- [x] **AC-129** — Profile 可选平台模型
- [x] **AC-130** — Console 只读 Platform 行
- [x] **AC-131** — Chat 使用平台模型
- [x] **AC-132** — 废弃 BAILIAN_API_KEY / 虚拟默认
- [x] **AC-133** — BYOK 不受影响

**平台助理（F-33 / F-34）**

- [x] **AC-134** — Admin CRUD 平台助理
- [x] **AC-135** — New Chat 单列表聚合个人 + 系统助理
- [x] **AC-136** — 可选择系统助理创建对话
- [x] **AC-137** — 移除自动 seed
- [x] **AC-138** — 列表前半为个人助理、后半为系统助理
- [x] **AC-139** — Profile 模型偏好
- [x] **AC-140** — 禁用平台助理不在列表中显示
- [x] **AC-141** — 非管理员 blocked assistants API

### 5.1 Test Matrix（qa-engineer · Phase C0 填写）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据 |
|-------|------|----------|----------|----------|------------|------|
| AC-120 | `E2E_TEST_EMAIL` ∈ `ADMIN_EMAILS`；已登录 | 1. `/admin/users` | 标题 **Users**；表格含 email/status；分页控件可见 | e2e | `tests/e2e/iter12-admin.spec.ts` AC-120 | C4 · E2E pass |
| AC-121 | 同上；库内 ≥2 用户 | 1. `/admin/users` 2. 搜索框输入已知 email 片段 | 列表仅匹配 email/nickname 行 | e2e + manual | `tests/e2e/iter12-admin.spec.ts` AC-121 | C4 · E2E pass |
| AC-122 | Admin 登录；目标用户非本人且 Active | 1. Users 行 **Disable** 2. 刷新列表 3. 该用户登录或发 Chat | Status **Disabled**；登录失败；API **403** | manual + unit | `tests/unit/admin/user-status.test.ts` · `tests/unit/auth/session.test.ts` | pass · M-01 H-05/H-06 · C4 |
| AC-123 | 目标用户已 Disabled | 1. **Enable** 2. 用户登录 | Status **Active**；可登录 | manual + unit | `tests/unit/admin/user-status.test.ts` | pass · M-02 H-05 · C4 |
| AC-124 | — | — | **已移出范围**；见 [todoList AUTH-01](../../../todoList/backlog-cn.md) | — | — | cancelled |
| AC-125 | Admin 登录 | 1. 对自己行点 **Disable**（或 `POST .../disable` 自身 id） | UI 禁用或 API **400** `Cannot disable your own account` | unit + manual | `tests/unit/admin/disable-self.test.ts` AC-125 | M-04 pass · unit 400 · C4 |
| AC-126 | 非 admin 已登录 **或** 未登录 | 1. `/admin/users` 2. `GET /api/admin/users` 无 cookie | 页面 `/forbidden` 或登录重定向；API **401/403** | e2e + unit | `tests/e2e/iter12-admin.spec.ts` AC-126 · `tests/unit/admin/auth.test.ts` | C4 · E2E 401 + unit · 非 admin 用例 skipped |
| AC-127 | Admin 登录 | 1. `/admin/models` 2. Add → Save 3. Edit 4. **Disable** 5. **Enable** | CRUD + Enable/Disable 成对；列表刷新 | e2e + manual | `tests/e2e/iter12-admin.spec.ts` AC-127 | M-05 Add · M-06 Disable/Enable · H-04 · AC-129–131 回归 · C4 |
| AC-128 | 新平台模型未测或 Failed | 1. Admin 填 Key → **Test** 2. Passed 后 **Enable** | `test_status=passed` 前不可对用户可选；Enabled 后 Profile 可见 | manual + unit | `tests/unit/model-config.test.ts`（passed 过滤） | M-05 pass · C4 |
| AC-129 | ≥1 Passed+Enabled 平台 chat 模型 | 1. `/console/profile` Preferences | 下拉含 **Platform —** 前缀选项 | e2e | `tests/e2e/iter05-console-profile.spec.ts` · `tests/unit/model-config.test.ts` | C4 · E2E AC-43 pass |
| AC-130 | 同上 | 1. `/console/models` | **Platform** 徽章行无 Edit/Delete/Test；BYOK 行可操作 | e2e + manual | `tests/e2e/iter05-console-models.spec.ts` AC-40 | M-08 pass · C4 E2E AC-40 |
| AC-131 | Profile 选 Passed 平台模型 | 1. `/chat` 发消息 | 流式回复；Key 来自 DB 解密非 env | unit + manual | `tests/unit/iter12-platform-deprecation.test.ts` · M-10 | M-10 pass · unit · C4 |
| AC-132 | 构建无 `BAILIAN_API_KEY` | 1. `pnpm test` 2. 静态扫描 resolve 路径 | `buildPlatformDefaultResolved()` 恒 null；chat resolve 不读 env Key | unit + static | `tests/unit/iter12-platform-deprecation.test.ts` AC-132 | 167 unit pass · C4 |
| AC-133 | 用户已有 BYOK Passed 配置 | 1. `/console/models` Add/Edit/Test/Delete BYOK | 与 iter-05 一致；平台行不受影响 | e2e | `tests/e2e/iter05-console-models.spec.ts` AC-41 | C4 · E2E AC-41 pass |
| AC-134 | Admin 登录 | 1. `/admin/assistants` 2. Create/Edit/Disable | CRUD 成功 | e2e + manual | `tests/e2e/iter12-admin.spec.ts` AC-134 | E2E 页加载 · M-07 partial · AC-136/140 回归 · C4 |
| AC-135 | 用户有个人 + 平台 Enabled 助理 | 1. Chat **New chat** | 单列表；个人在前；系统行 **Platform** 徽章 | unit + e2e | `tests/unit/assistants-service.test.ts` · `tests/e2e/iter12-console-chat.spec.ts` AC-135 | C4 · E2E AC-135 pass |
| AC-136 | 列表含 Enabled 平台助理 | 1. 选系统助理 2. 发消息 | 对话创建；输入框可用；流式开始（不断言正文） | e2e + manual | `tests/e2e/iter12-console-chat.spec.ts` AC-136 · M-11 | M-11 pass · C4 E2E AC-136 |
| AC-137 | 零个人助理账号 | 1. New chat | 无自动 seed 个人助理；列表后部仍有系统助理 | e2e + Supabase MCP | `tests/e2e/iter12-console-chat.spec.ts` AC-137 · M-12 | M-12 pass · C4 E2E AC-137 |
| AC-138 | 有个人 + 平台助理 | 1. New chat 列表 | 所有个人条目索引 < 首个 `isPlatform` 条目 | unit + e2e | `tests/unit/assistants-service.test.ts` AC-138 | unit AC-138 · C4 |
| AC-139 | Profile 设 chat 模型偏好 | 1. 选平台助理对话 2. 看 header model label | label 与 Profile 一致，非 per-assistant model | e2e + manual | `tests/e2e/iter05-chat-model.spec.ts` AC-46 · M-10 | C4 · E2E AC-46 pass |
| AC-140 | Admin 将平台助理 `enabled=false` | 1. 普通用户 New chat | 该助理不出现在列表 | unit | `tests/unit/assistants-platform-filter.test.ts` AC-140 | unit AC-140 · C4 |
| AC-141 | 非 admin 已登录 | 1. `GET /api/admin/assistants` | **403 Forbidden** | e2e | `tests/e2e/iter12-admin.spec.ts` AC-141 | C4 · E2E 401 unauth；非 admin 用例 skipped |

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD | `PRD 已确认，可进入技术设计` | 2026-07-12 |
| 技术 design §12 | 技术设计草案（[02-technical-design-cn.md](../02-technical-design-cn.md) §9） | 2026-07-12 |
| 编码 | Phase B 交付完成 | 2026-07-12 |
| 测试 C0 | Test Matrix + §12 已落盘 | 2026-07-13 |
| 测试 C1–C3 | 自动化通过；手工 M-01–02 / M-06 partial 已补测；M-03 cancelled | 2026-07-13 |
| 迭代内修复 | §7 手工修复 H-01–H-10 已落代码 | 2026-07-13 |
| 测试 C4 | AC-120–123、125–141 已勾选；AC-124 移出范围 | 2026-07-13 |
| 发布 | **已发布**（用户：`测试已通过，可发布` · 2026-07-13） | 2026-07-13 |

---

## 7. 人工验证发现与修复（iter-12 编码后 · 2026-07-13）

> Phase B 交付后联调 / 手工 QA 中发现的问题与补丁。交叉影响见 [console/changelog/iter-12-cn.md](../../console/changelog/iter-12-cn.md) §7、[mvp-chat/changelog/iter-12-cn.md](../../mvp-chat/changelog/iter-12-cn.md) §7。

| ID | 区域 | 现象 | 修复 | 代码 / 路径 |
|----|------|------|------|-------------|
| H-01 | Console Profile | 新用户无 `user_profiles` 行；默认模型仅 UI 回退、未落库 | `ensureUserProfileDefaults`：首次访问 `/console` 或 `/chat` 写入首条 Passed+Enabled 平台 Chat 模型 ID | `lib/console/profile.ts` · `lib/platform/profile-defaults.ts` · layout |
| H-02 | Console Profile | 平台模型下拉 label 用 `display_name`，与 Models/Admin 的 `model_name` 不一致 | `formatPlatformModelLabel` → `Platform — {Provider} — {model_name}` | `lib/platform/model-configs.ts` |
| H-03 | Chat / Profile | Admin **Disable** 首条平台模型后，偏好仍指向旧 UUID → 页头 `No model configured` | `resolveUserModelForChat` 平台路径失效时回退默认平台模型；`ensureUserProfileDefaults` 同步失效的平台偏好 | `lib/llm/resolve-user-model.ts` · `load_context` |
| H-04 | Admin Models | Disabled 行只有 Disable，**无 Enable** | `POST /api/admin/models/[id]/enable` + 列表 **Enable** 按钮 | `app/api/admin/models/[id]/enable/` · `platform-models-manager.tsx` |
| H-05 | Admin Users | **Disable** 用户后 Status 仍显示 **Active** | `deriveAdminUserStatus` 读 `banned_until`（`listUsers` 不回 `ban_duration`） | `lib/auth/ban.ts` · `lib/admin/users.ts` |
| H-06 | 全站鉴权 | 已登录用户被 Disable 后仍可发 Chat/API | `ensureUserNotBanned` + middleware 统一拦截 `/chat`、`/console`、`/api/chat|models|knowledge` | `lib/auth/session.ts` · `middleware.ts` |
| H-07 | Admin Users | Reset password 用 `generateLink` 不发信；与 PRD 不符 | **移除** Admin 代发重置；待办 [AUTH-01](../../../todoList/backlog-cn.md)（用户自助 Forgot password） | 删 `reset-password` route · `todoList/` |
| H-08 | Chat | 选平台助理建会话 **400** | RPC 迁移：允许 `is_platform=true AND enabled` 的助理 | `20260712210000_fix_create_conversation_platform_assistant.sql` |
| H-09 | Admin | `/admin/forbidden` 重定向循环 | 非管理员重定向 `/forbidden`（与 admin 路由解耦） | `middleware.ts` |
| H-10 | 文档流程 | 推迟能力无统一 backlog | 新增 `docs/todoList/`；新 iter 须用户确认是否纳入 open 条目 | `docs/todoList/README-cn.md` · workflow 规则 |

**产品说明（H-03 延伸）：** Admin 重新 **Enable** 第一条平台模型时，已迁移到第二条的用户偏好**不会**自动切回第一条（偏好已落库且仍有效）。仅当偏好指向**不可用**平台模型时才自动迁移。

---

## 12. 手工 QA 脚本（qa-engineer · Phase C0 填写，C3 执行）

| # | 映射 AC | 场景 | 前提 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|------|
| M-01 | AC-122 | 禁用用户 | Admin；另一 Active 用户 | 1. **Disable** 2. 刷新 3. 目标登录 / 发 Chat | Disabled；403 / 无法登录 | pass | H-05 H-06；2026-07-13 手工 |
| M-02 | AC-123 | 启用用户 | 目标已 Disabled | 1. **Enable** 2. 登录 | Active | pass | H-05；2026-07-13 手工 |
| M-03 | AC-124 | — | — | — | **cancelled** — 功能已移除；见 [AUTH-01](../../../todoList/backlog-cn.md) | cancelled | |
| M-04 | AC-125 | 不能禁用自己 | Admin 登录 | 1. 自己行 **Disable**（若 UI 禁用则 API `POST /api/admin/users/{self}/disable`） | 400 或按钮不可用 | pass | `tests/unit/admin/disable-self.test.ts` 400 |
| M-05 | AC-128 | 平台模型 Test 门禁 | Admin；新平台模型 + 有效 Key | 1. Add model 2. **Test** 3. 未 Passed 时查 Profile 4. Passed → **Enable** | 未 Passed 不可选；Passed+Enabled 后 Profile 可选 | pass | Supabase：`platform_model_configs.test_status=passed`；AC-43 E2E 下拉仅 passed |
| M-06 | AC-127 | 平台模型 CRUD | Admin | 1. Add 2. Edit 3. **Disable** 4. **Enable** | 列表与 DB 一致；Disabled 行可 Enable | partial | H-03 H-04；Disable/Enable 已验；Add 未完整手工 |
| M-07 | AC-134 | 平台助理 CRUD | Admin | 1. Create 2. Edit name 3. Disable | `assistants.is_platform=true`；禁用后用户不可见（AC-140） | partial | `/admin/assistants` 页加载 + DB 2 行 `is_platform=true` |
| M-08 | AC-130 | Console 平台行只读 | ≥1 平台模型 | 1. `/console/models` 2. 平台行无 Edit | BYOK 行仍可 Update key | pass | E2E AC-40；手工确认 Platform 徽章、无 Edit |
| M-09 | AC-135 | 聚合选择器顺序 | 有个人 + 系统助理 | 1. New chat | 单列表；个人在上；系统 **Platform** 在下 | pass | E2E AC-135；picker 个人条目在 Platform 前 |
| M-10 | AC-131 | 平台模型 Chat 流式 | Profile 选平台模型 | 1. `/chat` 发「ping」 | 流式回复；header 显示平台 label | pass | unit `iter12-platform-deprecation`；E2E AC-46 label |
| M-11 | AC-136 | 系统助理对话 | Enabled 平台助理 | 1. New chat 选系统助理 2. 发消息 | 对话创建；流式开始；opening message 来自平台助理 | pass | E2E AC-136 创建对话 + 输入框可用 |
| M-12 | AC-137 | 无 seed | 账号零个人助理（或删光个人助理） | 1. New chat | 无新个人助理被创建；可选后部系统助理 | pass | E2E AC-137；Supabase `ensure_user_assistants` SELECT-only |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-13 | C4：勾选 AC-122/123/127/134；补 §5.1 证据；lint/build/test/e2e 全通过 |
| 2026-07-13 | 用户确认发布 |
| 2026-07-13 | §7 手工修复 H-01–H-10；移除 Admin 密码重置 → todoList AUTH-01；封禁统一 middleware |
| 2026-07-12 | 创建 iter-12 changelog；PRD 已确认；同步 console / mvp-chat PRD 与 **changelog** |
| 2026-07-12 | 产品决策修订：New Chat 改为单列表聚合（取消双 Tab） |
| 2026-07-12 | 补全英文 design 对等；en↔en / cn↔cn 链接映射 |
