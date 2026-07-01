import type { PostgrestError } from "@supabase/supabase-js";

export class DataError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "DataError";
    this.code = code;
  }
}

export function throwIfError(error: PostgrestError | null): void {
  if (error) {
    throw new DataError(error.message, error.code);
  }
}

export function mapRpcError(error: unknown): string {
  if (!(error instanceof DataError)) {
    return error instanceof Error ? error.message : "Request failed";
  }

  const message = error.message;
  if (message.startsWith("assistant_in_use:")) {
    const count = message.split(":")[1] ?? "0";
    return `This assistant is used in ${count} chat(s). Delete those chats first.`;
  }

  if (message.startsWith("kb_in_use:")) {
    const count = message.split(":")[1] ?? "0";
    return `This knowledge base is bound to ${count} assistant(s). Unbind it first.`;
  }

  return message;
}
