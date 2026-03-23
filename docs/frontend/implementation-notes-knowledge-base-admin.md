# 知识库管理端前端（version=0.1.0）

## 路由

- `src/app/console/knowledge/page.tsx` → `/console/knowledge`
- `src/app/console/knowledge/[baseId]/page.tsx` → `/console/knowledge/[baseId]`

## 组件

- `src/components/console/knowledge/KnowledgeBasesClient.tsx`：库列表、新建/重命名/删除。
- `src/components/console/knowledge/KnowledgeBaseDetailClient.tsx`：条目表、新建/编辑条目、失败重试索引、折叠「检索试查」。

## 数据

- 全部通过 `fetch` 调用 `docs/backend/api-spec-knowledge-base.md` 所列管理端 API。

## UI

- 与 `PromptTemplatesForm` 对齐：`rounded-2xl` 卡片、`zinc` 边框/背景、`violet` 主操作链接/按钮。
- 顶栏文案与侧栏：`ConsoleProShell` 增加「知识库」、`PAGE_TITLE` 含列表与详情。

## 设计依据

- `iterations/0.1.0/design/spec-knowledge-base.md`
