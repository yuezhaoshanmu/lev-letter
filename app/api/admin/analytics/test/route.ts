import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../../lib/supabase-admin";

export async function GET() {
  const result = await createSupabaseAdmin().from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({
    count: result.data?.length ?? 0,
    firstRecord: result.data?.[0] ?? null,
    error: result.error ? {
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
      code: result.error.code,
    } : null,
  }, { status: result.error ? 503 : 200 });
}
