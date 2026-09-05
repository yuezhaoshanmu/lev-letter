import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

export async function GET() {
  try {
    const jar = await cookies();
    if (!verifySession(jar.get("admin_session")?.value, "admin")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data, error, count } = await createSupabaseAdmin()
      .from("response_history")
      .select("id, choice, created_at, ip_address, user_agent", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("response_history query error", error);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    console.info("response_history count:", count ?? data?.length ?? 0);
    return NextResponse.json({ history: data ?? [] });
  } catch (error) {
    console.error("response_history query error", error);
    return NextResponse.json({ error: "database" }, { status: 503 });
  }
}
