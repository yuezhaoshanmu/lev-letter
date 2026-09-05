import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();
  const isAdmin = verifySession(jar.get("admin_session")?.value, "admin");
  console.info("[admin analytics] request received", {
    requestTime: new Date().toISOString(),
    path: url.pathname,
    isAdmin,
  });
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.info("[admin analytics] service role key exists", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));
  const db = createSupabaseAdmin();
  const result = await db.from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(100);
  console.info("[admin analytics] raw result", {
    dataLength: result.data?.length ?? 0,
    error: result.error,
    errorMessage: result.error?.message,
    errorDetails: result.error?.details,
    errorHint: result.error?.hint,
    errorCode: result.error?.code,
  });
  if (result.error) {
    console.error("[admin analytics] 查询失败", {
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      code: result.error.code,
    });
    return NextResponse.json({ error: result.error.message }, { status: 503 });
  }

  const logs = result.data ?? [];
  console.info("[admin analytics] first visitor record", logs[0] ?? null);
  console.info("[admin analytics] 查询完成", { table: "visitor_logs", count: logs.length });
  const sessionsResult = await db.from("visitor_sessions").select("*").order("entry_time", { ascending: false }).limit(200);
  const sessions = sessionsResult.data ?? [];
  const sessionIds = sessions.map((session) => session.id);
  const eventsResult = sessionIds.length
    ? await db.from("visitor_events").select("session_id,event_type,page,event_time,metadata,event_data").in("session_id", sessionIds).order("event_time", { ascending: true })
    : { data: [], error: null };
  return NextResponse.json({
    total: logs.length,
    online: logs.filter((log) => !log.leave_time && Date.now() - new Date(log.created_at).getTime() < 300000).length,
    logs,
    sessions,
    events: eventsResult.data ?? [],
  });
}
