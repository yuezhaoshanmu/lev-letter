import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.visitor_id && !body.session_id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = createSupabaseAdmin();
  const leaveTime = new Date().toISOString();
  let legacyError = null;
  if (body.visitor_id) {
    const current = await db.from("visitor_logs").select("entry_time").eq("id", body.visitor_id).maybeSingle();
    const duration = current.data ? Math.round((Date.now() - new Date(current.data.entry_time).getTime()) / 1000) : 0;
    const result = await db.from("visitor_logs").update({
      leave_time: leaveTime,
      duration_seconds: Math.max(0, duration || Number(body.duration_seconds) || 0),
      last_page: body.last_page || "/",
    }).eq("id", body.visitor_id);
    legacyError = result.error;
  }

  let sessionError = null;
  if (body.session_id) {
    const current = await db.from("visitor_sessions").select("entry_time").eq("id", body.session_id).maybeSingle();
    const duration = current.data ? Math.round((Date.now() - new Date(current.data.entry_time).getTime()) / 1000) : 0;
    const result = await db.from("visitor_sessions").update({
      leave_time: leaveTime,
      duration_seconds: Math.max(0, duration || Number(body.duration_seconds) || 0),
      exit_page: body.exit_page || body.last_page || "/",
    }).eq("id", body.session_id);
    sessionError = result.error;
    if (!sessionError) {
      const event = await db.from("visitor_events").insert({
        visitor_id: body.visitor_id || null,
        session_id: body.session_id,
        event_type: "page_leave",
        page: body.exit_page || body.last_page || "/",
        event_time: leaveTime,
        metadata: {},
        event_data: {},
      });
      if (event.error) sessionError = event.error;
    }
  }

  const error = legacyError || sessionError;
  return NextResponse.json({ ok: !error }, { status: error ? 503 : 200 });
}
