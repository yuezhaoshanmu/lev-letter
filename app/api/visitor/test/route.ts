import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET() {
  try {
    const id = randomUUID();
    const result = await createSupabaseAdmin().from("visitor_logs").insert({
      id, session_id: `test-${id}`, ip_address: "test", user_agent: "visitor-test",
      device: "PC", last_page: "/api/visitor/test",
    }).select("id").single();
    if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 503 });
    return NextResponse.json({ ok: true, visitor_id: result.data.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 503 });
  }
}
