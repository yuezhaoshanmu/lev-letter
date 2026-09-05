import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.visitor_id || !body.event_type) return NextResponse.json({ ok: false }, { status: 400 });
  const db = createSupabaseAdmin();
  const result = await db.from("visitor_events").insert({ visitor_id: body.visitor_id, event_type: body.event_type, event_data: body.event_data ?? {} });
  if (body.last_page) await db.from("visitor_logs").update({ last_page: body.last_page }).eq("id", body.visitor_id);
  return NextResponse.json({ ok: !result.error }, { status: result.error ? 503 : 200 });
}
