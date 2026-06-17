import { NextResponse } from "next/server";
import {
  getModelOptionsForProvider,
  isValidModelForProvider,
} from "@/lib/constants/model-options";
import { getUserProfile, upsertUserProfile } from "@/lib/console/profile";
import { getLlmProviderId } from "@/lib/llm/provider";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(user.id);
  const provider = getLlmProviderId();

  return NextResponse.json({
    email: user.email ?? "",
    nickname: profile?.nickname ?? null,
    preferredModel: profile?.preferred_model ?? null,
    modelOptions: getModelOptionsForProvider(provider),
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { nickname?: string; preferredModel?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 });
  }

  const fields: { nickname?: string | null; preferredModel?: string | null } =
    {};

  if ("nickname" in body) {
    const raw = body.nickname;
    if (raw != null && typeof raw !== "string") {
      return NextResponse.json({ error: "Invalid nickname" }, { status: 422 });
    }
    const trimmed = raw?.trim() ?? "";
    if (trimmed.length > 32) {
      return NextResponse.json(
        { error: "Nickname must be 32 characters or fewer" },
        { status: 422 },
      );
    }
    fields.nickname = trimmed || null;
  }

  if ("preferredModel" in body) {
    const model = body.preferredModel;
    if (model != null && typeof model !== "string") {
      return NextResponse.json({ error: "Invalid model" }, { status: 422 });
    }
    if (model && !isValidModelForProvider(getLlmProviderId(), model)) {
      return NextResponse.json({ error: "Invalid model" }, { status: 422 });
    }
    fields.preferredModel = model || null;
  }

  if (!("nickname" in fields) && !("preferredModel" in fields)) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  try {
    const profile = await upsertUserProfile(user.id, fields);
    return NextResponse.json({
      nickname: profile.nickname,
      preferredModel: profile.preferred_model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 },
    );
  }
}
