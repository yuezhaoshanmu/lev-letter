import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";
import { verifySession } from "../../../lib/session";

const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function visitorFromRequest() {
  const jar = await cookies();
  const token = jar.get("letter_session")?.value;
  const visitorId = jar.get("visitor_id")?.value;
  return verifySession(token, "letter") && visitorId && visitorPattern.test(visitorId) ? visitorId : null;
}

export async function POST(request: Request) {
  try {
    const visitorId = await visitorFromRequest();
    if (!visitorId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      console.error("message submit error", error);
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const message = (payload as { message?: unknown }).message;
    if (typeof message !== "string" || !message.trim() || message.trim().length > 1000) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const value = message.trim();
    const supabase = createSupabaseAdmin();
    const { data: previous, error: lookupError } = await supabase
      .from("confession_responses")
      .select("id")
      .eq("visitor_id", visitorId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      console.error("message submit error", lookupError);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    const query = previous
      ? supabase.from("confession_responses").update({ message: value }).eq("id", previous.id).select("id, choice, message, submitted_at").single()
      : supabase.from("confession_responses").insert({ visitor_id: visitorId, choice: null, message: value }).select("id, choice, message, submitted_at").single();
    const { data, error } = await query;
    if (error) {
      console.error("message submit error", error);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    return NextResponse.json({ message: data.message, choice: data.choice, submittedAt: data.submitted_at });
  } catch (error) {
    console.error("message submit error", error);
    return NextResponse.json({ error: "database" }, { status: 503 });
  }
}
