import { INTENT_ROUTING_DEFAULTS } from "./defaults";
import { validateChatRouteProviderAndModel } from "@/lib/provider/validate-chat-route";
import type {
  IntentRoutingConfig,
  IntentRoutingFieldError,
  IntentRoutingNodeType,
  ValidateIntentRoutingResult,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asNodeType(v: unknown): IntentRoutingNodeType | null {
  if (
    v === "intent_recognition" ||
    v === "knowledge_search" ||
    v === "model_request" ||
    v === "final_response" ||
    v === "skills" ||
    v === "tools" ||
    v === "mcp"
  ) {
    return v;
  }
  return null;
}

function parseStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string" || !item.trim()) return null;
    out.push(item.trim());
  }
  return out;
}

export function validateIntentRoutingConfig(
  json: unknown
): ValidateIntentRoutingResult {
  if (!isRecord(json)) {
    return {
      ok: false,
      fieldErrors: [
        {
          field: "$",
          code: "CFG_ROUTE_BROKEN",
          message: "请求体须为 JSON 对象",
        },
      ],
    };
  }

  const fieldErrors: IntentRoutingFieldError[] = [];
  const o = json;

  const defaultRouteNextNodes = parseStringArray(o.defaultRouteNextNodes);
  if (!defaultRouteNextNodes) {
    fieldErrors.push({
      field: "defaultRouteNextNodes",
      code: "CFG_ROUTE_BROKEN",
      message: "defaultRouteNextNodes 须为字符串数组",
    });
  }

  const chatRouteObj = isRecord(o.chatRoute) ? o.chatRoute : null;
  if (!chatRouteObj) {
    fieldErrors.push({
      field: "chatRoute",
      code: "CFG_ROUTE_BROKEN",
      message: "chatRoute 缺失或格式错误",
    });
  }
  const providerValidation = validateChatRouteProviderAndModel({
    provider: chatRouteObj?.provider,
    model: chatRouteObj?.model,
  });
  fieldErrors.push(...providerValidation.fieldErrors);
  const provider = providerValidation.provider;
  const model = providerValidation.model;

  const nodesRaw = o.nodes;
  const nodeIds = new Set<string>();
  const nodes: IntentRoutingConfig["nodes"] = [];
  let knowledgeSearchEntryIdsByIntent: Record<string, string[]> = {};
  if (!Array.isArray(nodesRaw) || nodesRaw.length === 0) {
    fieldErrors.push({
      field: "nodes",
      code: "CFG_ROUTE_BROKEN",
      message: "nodes 须为非空数组",
    });
  } else {
    nodesRaw.forEach((item, idx) => {
      if (!isRecord(item)) {
        fieldErrors.push({
          field: `nodes[${idx}]`,
          code: "CFG_ROUTE_BROKEN",
          message: "节点格式错误",
        });
        return;
      }
      const id = typeof item.id === "string" ? item.id.trim() : "";
      const type = asNodeType(item.type);
      const nextNodes = parseStringArray(item.nextNodes);
      if (!id) {
        fieldErrors.push({
          field: `nodes[${idx}].id`,
          code: "CFG_ROUTE_BROKEN",
          message: "节点 id 不能为空",
        });
      } else if (nodeIds.has(id)) {
        fieldErrors.push({
          field: `nodes[${idx}].id`,
          code: "CFG_ROUTE_BROKEN",
          message: "节点 id 不能重复",
        });
      } else {
        nodeIds.add(id);
      }
      if (!type) {
        fieldErrors.push({
          field: `nodes[${idx}].type`,
          code: "CFG_NODE_TYPE_UNSUPPORTED",
          message: "节点 type 不支持",
        });
      }
      if (!nextNodes) {
        fieldErrors.push({
          field: `nodes[${idx}].nextNodes`,
          code: "CFG_ROUTE_BROKEN",
          message: "nextNodes 须为字符串数组",
        });
      }
      nodes.push({
        id,
        type: type ?? "mcp",
        input: isRecord(item.input) ? item.input : {},
        output: isRecord(item.output) ? item.output : {},
        nextNodes: nextNodes ?? [],
      });
      if (id === "knowledge_search") {
        const inputObj = isRecord(item.input) ? item.input : null;
        const byIntentRaw = inputObj?.selectedKnowledgeBaseEntryIdsByIntent;
        if (isRecord(byIntentRaw)) {
          const parsed: Record<string, string[]> = {};
          for (const [intentId, entryIdsRaw] of Object.entries(byIntentRaw)) {
            const entryIds = parseStringArray(entryIdsRaw);
            if (entryIds) parsed[intentId] = entryIds;
          }
          knowledgeSearchEntryIdsByIntent = parsed;
        }
      }
    });
  }

  for (const n of nodes) {
    n.nextNodes.forEach((nextId, pos) => {
      if (!nodeIds.has(nextId)) {
        fieldErrors.push({
          field: `nodes(${n.id}).nextNodes[${pos}]`,
          code: "CFG_ROUTE_BROKEN",
          message: `next node 不存在: ${nextId}`,
        });
      }
    });
  }

  const routesRaw = o.routes;
  const routes: IntentRoutingConfig["routes"] = [];
  if (!Array.isArray(routesRaw)) {
    fieldErrors.push({
      field: "routes",
      code: "CFG_ROUTE_BROKEN",
      message: "routes 须为数组",
    });
  } else {
    routesRaw.forEach((item, idx) => {
      if (!isRecord(item)) {
        fieldErrors.push({
          field: `routes[${idx}]`,
          code: "CFG_ROUTE_BROKEN",
          message: "路由格式错误",
        });
        return;
      }
      const intentId = typeof item.intentId === "string" ? item.intentId.trim() : "";
      const enabled = item.enabled === true;
      const keywords = parseStringArray(item.keywords) ?? [];
      const nextNodes = parseStringArray(item.nextNodes) ?? [];
      const updatedBy =
        typeof item.updatedBy === "string" && item.updatedBy.trim()
          ? item.updatedBy.trim()
          : "console";
      if (!intentId) {
        fieldErrors.push({
          field: `routes[${idx}].intentId`,
          code: "CFG_ROUTE_BROKEN",
          message: "intentId 不能为空",
        });
      }
      const routeEntryIds = knowledgeSearchEntryIdsByIntent[intentId] ?? [];
      if (nextNodes.includes("knowledge_search") && routeEntryIds.length < 1) {
        fieldErrors.push({
          field: `nodes(knowledge_search).input.selectedKnowledgeBaseEntryIdsByIntent.${intentId}`,
          code: "CFG_KB_ENTRY_REQUIRED",
          message:
            "当后续节点包含 knowledge_search 时，knowledge_search.input.selectedKnowledgeBaseEntryIdsByIntent 中该意图必须至少选择一个知识库文档",
        });
      }
      routes.push({
        intentId,
        enabled,
        keywords,
        nextNodes,
        updatedBy,
      });
    });
  }

  if (fieldErrors.length > 0) return { ok: false, fieldErrors };

  const now = new Date().toISOString();
  return {
    ok: true,
    config: {
      defaultRouteNextNodes:
        defaultRouteNextNodes ?? INTENT_ROUTING_DEFAULTS.defaultRouteNextNodes,
      chatRoute: {
        provider: provider ?? "zhipu",
        ...(model ? { model } : {}),
      },
      nodes,
      routes,
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : now,
      updatedBy:
        typeof o.updatedBy === "string" && o.updatedBy.trim()
          ? o.updatedBy.trim()
          : "console",
      version: typeof o.version === "string" && o.version.trim() ? o.version : "1",
    },
  };
}
