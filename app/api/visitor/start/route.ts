import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

function device(ua: string) { return /tablet|ipad/i.test(ua) ? "Tablet" : /mobile|android|iphone/i.test(ua) ? "Mobile" : "PC"; }
export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  const id = randomUUID();
  const jar = await cookies();
  if (verifySession(jar.get("admin_session")?.value, "admin")) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  const sessionId = jar.get("visitor_session")?.value || randomUUID();
  const result = await createSupabaseAdmin().from("visitor_logs").insert({ id, session_id: sessionId, ip_address: ip, user_agent: ua, device: device(ua), last_page: "/", is_admin: false }).select("id").single();
  if (result.error) return NextResponse.json({ error: "database" }, { status: 503 });
  const response = NextResponse.json({ visitor_id: result.data.id });
  if (!jar.get("visitor_session")) response.cookies.set("visitor_session", sessionId, { path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
