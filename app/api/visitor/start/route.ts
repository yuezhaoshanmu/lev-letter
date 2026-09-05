import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";

function device(ua: string) { return /tablet|ipad/i.test(ua) ? "Tablet" : /mobile|android|iphone/i.test(ua) ? "Mobile" : "PC"; }
export async function POST(request: Request) {
  console.log("[visitor api] received");
  const body = await request.json().catch(() => ({}));
  const ua = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const pathname = body.pathname ?? request.headers.get("x-visitor-pathname") ?? "unknown";
  console.log("[visitor api] request data", { pathname, headers: Object.fromEntries(request.headers), ip });
  const id = randomUUID();
  const jar = await cookies();
  const sessionId = jar.get("visitor_session")?.value || randomUUID();
  try {
    console.log("[visitor api] inserting");
    const result = await createSupabaseAdmin().from("visitor_logs").insert({ id, session_id: sessionId, ip_address: ip, user_agent: ua, device: device(ua), last_page: pathname }).select("id").single();
    if (result.error) {
      console.error("[visitor api] insert failed", { message: result.error.message, details: result.error.details, hint: result.error.hint, code: result.error.code });
      return NextResponse.json({ error: result.error.message, details: result.error.details, hint: result.error.hint }, { status: 503 });
    }
    console.log("[visitor api] success", result.data);
    const response = NextResponse.json({ visitor_id: result.data.id });
    if (!jar.get("visitor_session")) response.cookies.set("visitor_session", sessionId, { path: "/", maxAge: 60 * 60 * 12 });
    return response;
  } catch (error) {
    console.error("[visitor api] insert exception", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 503 });
  }
}
