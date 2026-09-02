import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

export async function GET() {
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await createSupabaseAdmin()
    .from("confession_responses")
    .select("id, choice, submitted_at")
    .order("submitted_at", { ascending: false });
  if (error) return NextResponse.json({ error: "database" }, { status: 503 });
  return NextResponse.json({ responses: data ?? [] });
}
