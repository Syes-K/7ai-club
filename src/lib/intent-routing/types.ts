import type { ChatProviderId } from "@/lib/chat/types";

export type IntentRoutingNodeType =
  | "intent_recognition"
  | "knowledge_search"
  | "model_request"
  | "final_response"
  | "skills"
  | "tools"
  | "mcp";

export type IntentRoutingNode = {
  id: string;
  type: IntentRoutingNodeType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  nextNodes: string[];
};

export type IntentRoute = {
  intentId: string;
  enabled: boolean;
  keywords: string[];
  nextNodes: string[];
  updatedBy: string;
};

export type IntentRoutingConfig = {
  defaultRouteNextNodes: string[];
  chatRoute: {
    provider: ChatProviderId;
    model?: string;
  };
  nodes: IntentRoutingNode[];
  routes: IntentRoute[];
  updatedAt: string;
  updatedBy: string;
  version: string;
};

export type IntentRoutingFieldError = {
  field: string;
  code:
    | "CFG_KB_ENTRY_REQUIRED"
    | "CFG_INVALID_THRESHOLD"
    | "CFG_ROUTE_BROKEN"
    | "CFG_NODE_TYPE_UNSUPPORTED";
  message: string;
};

export type ValidateIntentRoutingResult =
  | { ok: true; config: IntentRoutingConfig }
  | { ok: false; fieldErrors: IntentRoutingFieldError[] };

export type NodeExecutionTrace = {
  nodeId: string;
  nodeType: IntentRoutingNodeType;
  status: "success" | "fallback" | "error";
  durationMs: number;
  fallbackReason?: "empty_retrieval" | "retrieval_error" | "intent_not_hit";
  meta?: Record<string, unknown>;
};
