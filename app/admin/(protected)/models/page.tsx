import { PlatformModelsManager } from "@/components/admin/platform-models-manager";
import { listAllPlatformModelConfigs } from "@/lib/admin/platform-models";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const initialConfigs = await listAllPlatformModelConfigs();
  return <PlatformModelsManager initialConfigs={initialConfigs} />;
}
