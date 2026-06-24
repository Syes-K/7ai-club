import {
  ModelNotReadyError,
  resolveUserModelForChat,
} from "@/lib/llm/resolve-user-model";
import type { WorkflowNode } from "@/lib/workflow/types";

export const resolveModelNode: WorkflowNode = {
  id: "resolve_model",
  label: "Resolve model",
  async run(ctx) {
    const resolved = await resolveUserModelForChat(
      ctx.userId,
      ctx.profile?.preferred_model_config_id ?? null,
      ctx.supabase,
    );

    if (!resolved) {
      throw new Error(
        "No model configured. Add and test a model in Console → Models.",
      );
    }

    ctx.resolved = resolved;
    return resolved.label;
  },
};

export { ModelNotReadyError };
