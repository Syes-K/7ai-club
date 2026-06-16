import { getLlmProviderId } from "./provider";

/** Provider-specific options for streamText (e.g. Bailian enable_thinking). */
export function getStreamTextProviderOptions() {
  if (getLlmProviderId() === "bailian") {
    return {
      openai: { enable_thinking: false },
    };
  }
  return undefined;
}
