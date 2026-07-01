import { after } from "next/server";
import { runKnowledgeBaseIngest } from "@/lib/rag/ingest";

export async function scheduleKnowledgeBaseIngest(kbId: string): Promise<void> {
  if (process.env.RAG_INGEST_SYNC === "1") {
    await runKnowledgeBaseIngest(kbId);
    return;
  }

  after(async () => {
    try {
      await runKnowledgeBaseIngest(kbId);
    } catch (error) {
      console.error("[kb-ingest] after() failed:", kbId, error);
    }
  });
}
