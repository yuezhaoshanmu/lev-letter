import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

export async function GET() {
  console.info("[admin analytics] 查询开始", { table: "visitor_logs" });
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const result = await db.from("visitor_logs").select("*").eq("is_admin", false).order("created_at", { ascending: false }).limit(100);
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
  console.info("[admin analytics] 查询完成", { table: "visitor_logs", count: logs.length });
  return NextResponse.json({
    total: logs.length,
    online: logs.filter((log) => !log.leave_time && Date.now() - new Date(log.created_at).getTime() < 300000).length,
    logs,
  });
}
