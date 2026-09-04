import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "../../lib/supabase-admin";
import { verifySession } from "../../lib/session";
import Butterfly from "../../components/Butterfly";

const labels: Record<string, string> = {
  willing: "我愿意试着靠近你",
  friend: "我想继续做朋友",
  time: "我需要一点时间",
  yes: "我愿意试着靠近你",
  no: "我想继续做朋友",
  thinking: "我需要一点时间",
  "愿意": "我愿意试着靠近你",
  "不愿意": "我想继续做朋友",
  "需要再想一想": "我需要一点时间",
  "我愿意试着靠近你": "我愿意试着靠近你",
  "我想继续做朋友": "我想继续做朋友",
  "我需要一点时间": "我需要一点时间",
};

function formatDate(value: string) {
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")} · ${get("month")} · ${get("day")}`, time: `${get("hour")} : ${get("minute")}`, short: `${get("month")}月${get("day")}日 ${get("hour")} : ${get("minute")}` };
}

export default async function AdminPage() {
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) redirect("/");
  const supabase = createSupabaseAdmin();
  const result = await supabase.from("confession_responses").select("choice, message, submitted_at").order("submitted_at", { ascending: false });
  let data: Array<{ choice: string | null; message: string | null; submitted_at: string }> = (result.data ?? []) as Array<{ choice: string | null; message: string | null; submitted_at: string }>;
  let error = result.error;
  if (error?.code === "42703" || error?.code === "PGRST204") {
    console.error("admin page message column unavailable", error);
    const fallback = await supabase.from("confession_responses").select("choice, submitted_at").order("submitted_at", { ascending: false });
    data = (fallback.data ?? []).map((row) => ({ ...row, message: null })) as Array<{ choice: string | null; message: string | null; submitted_at: string }>;
    error = fallback.error;
  }
  if (error) console.error("admin page load error", error);
  const responses = data ?? [];
  const latest = responses[0];
  return <main className="admin-page"><div className="admin-inner"><header className="admin-header"><span className="eyebrow">LETTER ARCHIVE</span><h1>她最后停在了哪一页。</h1><Butterfly className="admin-butterfly" variant="moon" /></header>{latest ? <section className="admin-latest"><span className="eyebrow">最新选择</span><p className="admin-choice">{latest.choice ? (labels[latest.choice] ?? latest.choice) : "留给时间"}</p><div className="admin-date">{formatDate(latest.submitted_at).date}</div><div className="admin-time">{formatDate(latest.submitted_at).time}</div>{latest.message ? <p className="admin-latest-message">{latest.message}</p> : null}</section> : <p className="admin-empty">这一页还没有被写下。</p>}<section className="admin-history"><h2>选择与留言</h2>{responses.length ? <div className="admin-list"><div className="admin-row admin-row-header" aria-hidden="true"><span>时间</span><span>选择</span><span>留言</span></div>{responses.map((response, index) => <div className="admin-row" key={`${response.submitted_at}-${index}`}><span>{formatDate(response.submitted_at).short}</span><strong>{response.choice ? (labels[response.choice] ?? response.choice) : "只留下了一句话"}</strong><span className="admin-row-message">{response.message ?? ""}</span></div>)}</div> : null}</section><form action="/api/logout" method="post" className="admin-leave"><button type="submit">离开</button></form></div></main>;
}
