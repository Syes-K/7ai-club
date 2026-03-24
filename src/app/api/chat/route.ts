import {
  buildMessagesWithContextSummary,
  messagesIncludeContextSummary,
  refreshContextSummaryFullRewrite,
  shouldRefreshContextSummary,
} from "@/lib/chat/context-summary";
import { parseAndValidateChatBody } from "@/lib/chat/validate-request";
import { logChat } from "@/lib/chat/logger";
import { getChatStore } from "@/lib/chat/store";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/chat/constants";
import { getAppConfig } from "@/lib/config";
import {
  executeIntentRoutingStream,
  getIntentRoutingConfig,
} from "@/lib/intent-routing";
import type { ChatProviderId } from "@/lib/chat/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mergeRoutingModelConfig(
  provider: ChatProviderId,
  model: string | undefined
) {
  const routingConfig = getIntentRoutingConfig();
  if (provider === "zhipu") {
    return {
      ...routingConfig,
      chatRoute: {
        provider,
        ...(model ? { model } : {}),
      },
    };
  }
  return {
    ...routingConfig,
    chatRoute: {
      provider,
    },
  };
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    await logChat("warn", "api.invalid_json", { requestId });
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const parsed = parseAndValidateChatBody(json);
  if (!parsed.ok) {
    await logChat("warn", "api.validation_failed", {
      requestId,
      error: parsed.error,
    });
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data;

  if (body.variant === "legacy") {
    const { messages, provider, model } = body;
    await logChat("info", "api.request_received", {
      requestId,
      mode: "legacy",
      provider,
      model: model ?? DEEPSEEK_DEFAULT_MODEL,
      messageCount: messages.length,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const latestUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!latestUserMessage?.content?.trim()) {
      return Response.json({ error: "缺少用户消息内容" }, { status: 400 });
    }
    try {
      const { stream } = await executeIntentRoutingStream({
        query: latestUserMessage.content,
        config: mergeRoutingModelConfig(provider, model),
      });
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } catch (e) {
      await logChat("error", "api.intent_routing_failed", {
        requestId,
        mode: "legacy",
        error: e instanceof Error ? e.message : String(e),
      });
      return Response.json({ error: "intent-routing 执行失败" }, { status: 502 });
    }
  }

  const store = getChatStore();
  const { sessionId, provider, model, retryLast, content } = body;

  if (!store.sessionExists(sessionId)) {
    await logChat("warn", "api.session_not_found", { requestId, sessionId });
    return Response.json({ error: "会话不存在" }, { status: 404 });
  }

  if (retryLast) {
    const rows = store.listMessages(sessionId);
    const last = rows[rows.length - 1];
    if (!last || last.role !== "user") {
      await logChat("warn", "api.retry_invalid", {
        requestId,
        sessionId,
        lastRole: last?.role,
      });
      return Response.json(
        { error: "当前无法重试：上一条持久化消息不是用户消息" },
        { status: 400 }
      );
    }
  } else {
    store.appendMessage(sessionId, "user", content!);
    store.maybeSetTitleFromUserMessage(sessionId, content!);
  }

  const rows = store.listMessages(sessionId);
  const appCfg = getAppConfig();
  const messages = buildMessagesWithContextSummary(rows, store, sessionId, appCfg);

  await logChat("info", "api.request_received", {
    requestId,
    mode: "session",
    sessionId,
    retryLast,
    provider,
    model: model ?? DEEPSEEK_DEFAULT_MODEL,
    messageCount: messages.length,
    persistedMessageCount: rows.length,
    content,
    contextSummaryEnabled: appCfg.contextSummaryEnabled,
    contextSummaryPrepended: messagesIncludeContextSummary(messages),
  });

  const initialContextWindow = appCfg.maxMessagesInContext;
  if (!appCfg.contextSummaryEnabled && rows.length > initialContextWindow) {
    await logChat("info", "context_summary.disabled_in_config", {
      requestId,
      sessionId,
      persistedMessageCount: rows.length,
      maxMessagesInContext: initialContextWindow,
      hint:
        "摘要功能未启用：请在 /console 勾选「启用上下文摘要」并点击「保存」。当前 app-config.json 中 contextSummaryEnabled 为 false 时不会出现摘要相关日志。",
    });
  }

  const currentQuery = retryLast
    ? (() => {
        const last = rows[rows.length - 1];
        return last?.role === "user" ? last.content : "";
      })()
    : (content ?? "");

  try {
    const { stream, done } = await executeIntentRoutingStream({
      query: currentQuery,
      config: mergeRoutingModelConfig(provider, model),
    });
    void done
      .then(async (routingResult) => {
        store.appendMessage(sessionId, "assistant", routingResult.finalResponse);
        const cfg = getAppConfig();
        const rowsAfter = store.listMessages(sessionId);
        const n = rowsAfter.length;
        const { summaryMessageCountAtRefresh } =
          store.getSessionContextSummary(sessionId);
        const K = cfg.maxMessagesInContext;
        const willRefresh = shouldRefreshContextSummary(
          n,
          K,
          summaryMessageCountAtRefresh,
          cfg.contextSummaryRefreshEvery,
          cfg.contextSummaryEnabled
        );
        if (cfg.contextSummaryEnabled) {
          const gap = n - summaryMessageCountAtRefresh;
          await logChat("info", "context_summary.eval", {
            requestId,
            sessionId,
            persistedCount: n,
            maxMessagesInContext: K,
            exitsWindow: n > K,
            summaryMessageCountAtRefresh,
            refreshEvery: cfg.contextSummaryRefreshEvery,
            willRefresh,
            hint:
              n <= K
                ? `摘要：当前会话 ${n} 条，持久化条数须大于「最大上下文条数」(${K}) 才会生成/注入摘要`
                : willRefresh
                  ? `摘要：将调用模型整段重写（全量持久化消息为输入）`
                  : `摘要：未达刷新间隔（自上次计数已新增 ${gap} 条，需 ≥ ${cfg.contextSummaryRefreshEvery} 条）`,
          });
        }
        if (willRefresh) {
          await refreshContextSummaryFullRewrite({
            sessionId,
            store,
            requestId,
            provider,
            model,
            config: cfg,
          });
        }
      })
      .catch(async (e) => {
        await logChat("error", "api.intent_routing_failed", {
          requestId,
          mode: "session",
          sessionId,
          error: e instanceof Error ? e.message : String(e),
        });
      });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    await logChat("error", "api.intent_routing_failed", {
      requestId,
      mode: "session",
      sessionId,
      error: e instanceof Error ? e.message : String(e),
    });
    return Response.json({ error: "intent-routing 执行失败" }, { status: 502 });
  }
}
