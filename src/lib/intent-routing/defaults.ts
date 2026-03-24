import type { IntentRoutingConfig } from "./types";

/** Intent Routing 默认配置（v0.1.1 首版）。 */
export const INTENT_ROUTING_DEFAULTS: IntentRoutingConfig = {
  defaultRouteNextNodes: ["model_request", "final_response"],
  chatRoute: {
    provider: "zhipu",
    model: "glm-4-flash",
  },
  nodes: [
    {
      id: "intent_recognition",
      type: "intent_recognition",
      input: {},
      output: {},
      nextNodes: ["knowledge_search", "model_request"],
    },
    {
      id: "knowledge_search",
      type: "knowledge_search",
      input: {
        selectedKnowledgeBaseEntryIdsByIntent: {},
      },
      output: {},
      nextNodes: ["model_request"],
    },
    {
      id: "model_request",
      type: "model_request",
      input: {},
      output: {},
      nextNodes: ["final_response"],
    },
    {
      id: "final_response",
      type: "final_response",
      input: {},
      output: {},
      nextNodes: [],
    },
  ],
  routes: [],
  updatedAt: new Date(0).toISOString(),
  updatedBy: "system",
  version: "1",
};
