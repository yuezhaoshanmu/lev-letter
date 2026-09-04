import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../lib/supabase-admin";
import { verifySession } from "../../../../lib/session";

export async function GET() {
  try {
    const jar = await cookies();
    if (!verifySession(jar.get("admin_session")?.value, "admin")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const supabase = createSupabaseAdmin();
    const result = await supabase
      .from("confession_responses")
      .select("id, choice, message, submitted_at")
      .order("submitted_at", { ascending: false });
    let data: Array<{ id: string; choice: string | null; message: string | null; submitted_at: string }> = (result.data ?? []) as Array<{ id: string; choice: string | null; message: string | null; submitted_at: string }>;
    let error = result.error;
    if (error?.code === "42703" || error?.code === "PGRST204") {
      console.error("admin responses message column unavailable", error);
      const fallback = await supabase
        .from("confession_responses")
        .select("id, choice, submitted_at")
        .order("submitted_at", { ascending: false });
      data = (fallback.data ?? []).map((row) => ({ ...row, message: null })) as Array<{ id: string; choice: string | null; message: string | null; submitted_at: string }>;
      error = fallback.error;
    }
    if (error) {
      console.error("admin responses error", error);
      return NextResponse.json({ error: "database" }, { status: 503 });
    }
    return NextResponse.json({ responses: data ?? [] });
  } catch (error) {
    console.error("admin responses error", error);
    return NextResponse.json({ error: "database" }, { status: 503 });
  }
}
