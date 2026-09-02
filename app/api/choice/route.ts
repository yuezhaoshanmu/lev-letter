import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";
import { verifySession } from "../../../lib/session";

const validChoices = new Set(["yes", "no", "thinking"]);

async function visitorFromRequest() {
  const jar = await cookies();
  const token = jar.get("letter_session")?.value;
  const visitorId = jar.get("visitor_id")?.value;
  return verifySession(token, "letter") && visitorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId) ? visitorId : null;
}

export async function GET() {
  const visitorId = await visitorFromRequest();
  if (!visitorId) return NextResponse.json({ choice: null }, { status: 401 });
  const { data, error } = await createSupabaseAdmin()
    .from("confession_responses")
    .select("choice, submitted_at")
    .eq("visitor_id", visitorId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "database" }, { status: 503 });
  return NextResponse.json({ choice: data?.choice ?? null, submittedAt: data?.submitted_at ?? null });
}

export async function POST(request: Request) {
  const visitorId = await visitorFromRequest();
  if (!visitorId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let choice: unknown;
  try { choice = (await request.json()).choice; } catch { return NextResponse.json({ error: "invalid" }, { status: 400 }); }
  if (typeof choice !== "string" || !validChoices.has(choice)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const supabase = createSupabaseAdmin();
  const { data: previous } = await supabase
    .from("confession_responses")
    .select("choice, submitted_at")
    .eq("visitor_id", visitorId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previous && previous.choice === choice && Date.now() - new Date(previous.submitted_at).getTime() < 5000) {
    return NextResponse.json({ choice: previous.choice, submittedAt: previous.submitted_at });
  }
  const { data, error } = await supabase
    .from("confession_responses")
    .insert({ visitor_id: visitorId, choice })
    .select("choice, submitted_at")
    .single();
  if (error) return NextResponse.json({ error: "database" }, { status: 503 });
  return NextResponse.json({ choice: data.choice, submittedAt: data.submitted_at });
}
