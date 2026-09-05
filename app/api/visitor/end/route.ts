import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.visitor_id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = createSupabaseAdmin();
  const current = await db.from("visitor_logs").select("entry_time").eq("id", body.visitor_id).single();
  const duration = current.data ? Math.round((Date.now() - new Date(current.data.entry_time).getTime()) / 1000) : 0;
  const result = await db.from("visitor_logs").update({ leave_time: new Date().toISOString(), duration_seconds: Math.max(0, duration || Number(body.duration_seconds) || 0), last_page: body.last_page || "/" }).eq("id", body.visitor_id);
  return NextResponse.json({ ok: !result.error }, { status: result.error ? 503 : 200 });
}
