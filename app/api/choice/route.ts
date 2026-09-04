import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";
import { verifySession } from "../../../lib/session";

type ChoiceKey = "willing" | "friend" | "time";

const choiceAliases: Record<string, ChoiceKey> = {
  willing: "willing",
  friend: "friend",
  time: "time",
  yes: "willing",
  no: "friend",
  thinking: "time",
  愿意: "willing",
  不愿意: "friend",
  需要再想一想: "time",
  我愿意试着靠近你: "willing",
  我想继续做朋友: "friend",
  我需要一点时间: "time",
};

const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeChoice(value: unknown): ChoiceKey | null {
  return typeof value === "string" ? choiceAliases[value] ?? null : null;
}

function normalizeMessage(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length <= 1000 ? normalized : null;
}

function isMissingMessageColumn(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204" || error?.message?.includes("message");
}

async function visitorFromRequest() {
  const jar = await cookies();
  const token = jar.get("letter_session")?.value;
  const visitorId = jar.get("visitor_id")?.value;
  return verifySession(token, "letter") && visitorId && visitorPattern.test(visitorId) ? visitorId : null;
}

export async function GET() {
  try {
    const visitorId = await visitorFromRequest();
    if (!visitorId) return NextResponse.json({ choice: null }, { status: 401 });
    const { data, error } = await createSupabaseAdmin()
      .from("confession_responses")
      .select("choice, submitted_at")
      .eq("visitor_id", visitorId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("choice read error", error);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    return NextResponse.json({ choice: normalizeChoice(data?.choice) ?? data?.choice ?? null, submittedAt: data?.submitted_at ?? null });
  } catch (error) {
    console.error("choice read error", error);
    return NextResponse.json({ error: "database" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const visitorId = await visitorFromRequest();
    if (!visitorId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      console.error("choice submit error", error);
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const body = payload as { choice?: unknown; message?: unknown };
    const choice = normalizeChoice(body.choice);
    const message = normalizeMessage(body.message);
    if (!choice || message === null) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { data: previous, error: lookupError } = await supabase
      .from("confession_responses")
      .select("id, choice, submitted_at")
      .eq("visitor_id", visitorId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      console.error("choice submit error", lookupError);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }

    const previousChoice = normalizeChoice(previous?.choice);
    const isRecentSameChoice = previous && previousChoice === choice && Date.now() - new Date(previous.submitted_at).getTime() < 5000;
    if (isRecentSameChoice) {
      return NextResponse.json({ choice, message: null, submittedAt: previous.submitted_at });
    }

    const values: { choice: ChoiceKey; message?: string } = { choice };
    if (message) values.message = message;
    let query = previous?.choice === null
      ? supabase.from("confession_responses").update(values).eq("id", previous.id).select("choice, message, submitted_at").single()
      : supabase.from("confession_responses").insert({ visitor_id: visitorId, ...values }).select("choice, message, submitted_at").single();
    let { data, error } = await query;
    if (error && isMissingMessageColumn(error)) {
      console.error("choice submit message column unavailable", error);
      query = previous?.choice === null
        ? supabase.from("confession_responses").update({ choice }).eq("id", previous.id).select("choice, submitted_at").single()
        : supabase.from("confession_responses").insert({ visitor_id: visitorId, choice }).select("choice, submitted_at").single();
      ({ data, error } = await query);
    }
    if (error?.code === "23514") {
      const legacyChoice = choice === "willing" ? "yes" : choice === "friend" ? "no" : "thinking";
      console.error("choice submit legacy constraint; retrying legacy value", error);
      query = previous?.choice === null
        ? supabase.from("confession_responses").update({ choice: legacyChoice }).eq("id", previous.id).select("choice, submitted_at").single()
        : supabase.from("confession_responses").insert({ visitor_id: visitorId, choice: legacyChoice }).select("choice, submitted_at").single();
      ({ data, error } = await query);
    }
    if (error) {
      console.error("choice submit error", error);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    if (!data) {
      console.error("choice submit error", new Error("Supabase returned no response row"));
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    return NextResponse.json({ choice: normalizeChoice(data.choice) ?? data.choice, message: "message" in data ? data.message ?? null : null, submittedAt: data.submitted_at });
  } catch (error) {
    console.error("choice submit error", error);
    return NextResponse.json({ error: "database" }, { status: 503 });
  }
}
