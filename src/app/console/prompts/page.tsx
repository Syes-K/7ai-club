import {
  BUILTIN_PROMPT_TEMPLATES,
  readPromptTemplatesWithMeta,
} from "@/lib/prompt-templates";
import { PromptTemplatesForm } from "@/components/console/PromptTemplatesForm";

export const dynamic = "force-dynamic";

export default function ConsolePromptsPage() {
  const { templates, warning } = readPromptTemplatesWithMeta();

  return (
    <div className="min-h-full flex-1">
      <PromptTemplatesForm
        initialTemplates={templates}
        initialBuiltin={{ ...BUILTIN_PROMPT_TEMPLATES }}
        initialFileWarning={warning}
      />
    </div>
  );
}
