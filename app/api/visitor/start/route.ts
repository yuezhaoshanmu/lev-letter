import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";

function device(ua: string) { return /tablet|ipad/i.test(ua) ? "Tablet" : /mobile|android|iphone/i.test(ua) ? "Mobile" : "PC"; }
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ua = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const pathname = typeof body.pathname === "string" ? body.pathname : request.headers.get("x-visitor-pathname") ?? "/";
  const requestedVisitorId = typeof body.visitor_id === "string" && uuidPattern.test(body.visitor_id) ? body.visitor_id : null;
  const jar = await cookies();
  const sessionId = jar.get("visitor_session")?.value || randomUUID();
  try {
    const db = createSupabaseAdmin();
    let visitorId = requestedVisitorId;
    if (!visitorId) {
      const legacyId = randomUUID();
      const result = await db.from("visitor_logs").insert({
        id: legacyId,
        session_id: sessionId,
        ip_address: ip,
        user_agent: ua,
        device: device(ua),
        last_page: pathname,
      }).select("id").single();
      if (result.error) {
        console.error("[visitor api] legacy insert failed", result.error);
        return NextResponse.json({ error: result.error.message }, { status: 503 });
      }
      visitorId = result.data.id;
    }

    let createdSessionId: string | null = null;
    const sessionResult = await db.from("visitor_sessions").insert({
      id: randomUUID(),
      visitor_id: sessionId,
      ip_address: ip,
      user_agent: ua,
      device: device(ua),
      entry_time: new Date().toISOString(),
      entry_page: pathname,
    }).select("id").single();
    if (sessionResult.error) {
      // Keep the legacy tracker usable while an older database is being migrated.
      console.error("[visitor api] session insert failed", sessionResult.error);
    } else {
      createdSessionId = sessionResult.data.id;
    }

    const response = NextResponse.json({ visitor_id: visitorId, session_id: createdSessionId });
    if (!jar.get("visitor_session")) response.cookies.set("visitor_session", sessionId, { path: "/", maxAge: 60 * 60 * 12 });
    return response;
  } catch (error) {
    console.error("[visitor api] start exception", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 503 });
  }
}
