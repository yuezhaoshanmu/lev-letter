import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

const choices = new Set(["willing", "friend", "time"]);

export async function POST(request: Request) {
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { choice?: unknown } | null;
  if (!body || typeof body.choice !== "string" || !choices.has(body.choice)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data, error } = await createSupabaseAdmin().from("confession_responses").select("id").not("choice", "is", null).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "database" }, { status: 503 });
  if (!data) return NextResponse.json({ error: "no_choice" }, { status: 409 });
  const result = await createSupabaseAdmin().from("confession_responses").update({ choice: body.choice }).eq("id", data.id);
  if (result.error) return NextResponse.json({ error: "database" }, { status: 503 });
  return NextResponse.json({ success: true });
}
