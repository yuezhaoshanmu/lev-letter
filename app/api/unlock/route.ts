import { randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, sessionCookieOptions } from "../../../lib/session";

const failureCounts = new Map<string, number>();

function matches(input: string, expected: string | undefined) {
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    const failures = failureCounts.get("global") ?? 0;
    const isAdmin = matches(password, process.env.ADMIN_PASSWORD);
    const isLetter = matches(password, process.env.LETTER_PASSWORD);
    if (isAdmin || isLetter) {
      failureCounts.delete("global");
      const response = NextResponse.json({ success: true, role: isAdmin ? "admin" : "letter" });
      if (isAdmin) {
        response.cookies.set("admin_session", createSession("admin"), sessionCookieOptions);
      } else {
        const jar = await cookies();
        const visitorId = jar.get("visitor_id")?.value ?? randomUUID();
        response.cookies.set("visitor_id", visitorId, sessionCookieOptions);
        response.cookies.set("letter_session", createSession("letter"), sessionCookieOptions);
      }
      return response;
    }
    const delay = Math.min(1500, failures * 500);
    failureCounts.set("global", failures + 1);
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return NextResponse.json({ success: false, message: "好像不是这一串。再想想。" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
