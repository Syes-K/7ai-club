import { ModelsManager } from "@/components/console/models-manager";
import { listModelConfigsForUser } from "@/lib/console/model-configs-server";
import { createClient } from "@/lib/supabase/server";

export default async function ConsoleModelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const configs = await listModelConfigsForUser(user.id).catch(() => []);

  return <ModelsManager initialConfigs={configs} />;
}
