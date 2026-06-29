import type { ResolvedUserModel } from "@/lib/llm/provider";
import { resolveUserModelForChat } from "@/lib/llm/resolve-user-model";
import type { ProfileRow } from "@/lib/workflow/types";
import type { WorkflowContext } from "@/lib/workflow/types";

export async function resolveSummaryModel(
  ctx: WorkflowContext,
): Promise<ResolvedUserModel> {
  if (ctx.resolved && !ctx.profile?.summary_model_config_id) {
    return ctx.resolved;
  }

  const configId =
    ctx.profile?.summary_model_config_id ??
    ctx.profile?.preferred_model_config_id ??
    null;

  const resolved = await resolveUserModelForChat(
    ctx.userId,
    configId,
    ctx.supabase,
  );

  if (!resolved) {
    throw new Error(
      "No model configured for summarization. Add and test a model in Console → Models.",
    );
  }

  return resolved;
}

export function profileToSummarizationPrefs(
  profile: ProfileRow | null | undefined,
): import("@/lib/memory/types").SummarizationPrefs {
  return {
    summarization_enabled: profile?.summarization_enabled ?? true,
    summary_trigger_turns: profile?.summary_trigger_turns ?? 20,
    summary_retain_turns: profile?.summary_retain_turns ?? 4,
    summary_trigger_tokens: profile?.summary_trigger_tokens ?? 8000,
    summary_retain_tokens: profile?.summary_retain_tokens ?? 2000,
    summary_model_config_id: profile?.summary_model_config_id ?? null,
  };
}
