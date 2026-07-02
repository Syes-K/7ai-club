export function suggestRecallThreshold(bestScore: number): number {
  const padded = Math.max(0.05, bestScore - 0.01);
  return Math.floor(padded * 20) / 20;
}

export function formatRecallThresholdHint(options: {
  embeddingProvider: string;
  embeddingModel: string;
  profileThreshold: number;
  bestScore?: number | null;
}): string {
  const modelLabel = `${options.embeddingProvider} · ${options.embeddingModel}`;
  const parts = [
    `This knowledge base uses ${modelLabel}. Similarity scores depend on the embedding model`,
  ];

  if (options.bestScore != null) {
    const suggested = suggestRecallThreshold(options.bestScore);
    parts.push(
      ` — try threshold around ${suggested.toFixed(2)} (best match scored ${options.bestScore.toFixed(3)})`,
    );
  } else {
    parts.push(" — try lowering the threshold by 0.05–0.10");
  }

  parts.push(`. Profile default: ${options.profileThreshold.toFixed(2)}.`);
  return parts.join("");
}
