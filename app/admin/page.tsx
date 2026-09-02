import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "../../lib/supabase-admin";
import { verifySession } from "../../lib/session";
import Butterfly from "../../components/Butterfly";

const labels: Record<string, string> = { yes: "愿意", no: "不愿意", thinking: "需要再想想" };

function formatDate(value: string) {
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")} · ${get("month")} · ${get("day")}`, time: `${get("hour")} : ${get("minute")}`, short: `${get("month")}月${get("day")}日 ${get("hour")} : ${get("minute")}` };
}

export default async function AdminPage() {
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) redirect("/");
  const { data } = await createSupabaseAdmin().from("confession_responses").select("choice, submitted_at").order("submitted_at", { ascending: false });
  const responses = data ?? [];
  const latest = responses[0];
  return <main className="admin-page"><div className="admin-inner"><header className="admin-header"><span className="eyebrow">LETTER ARCHIVE</span><h1>她最后停在了哪一页。</h1><Butterfly className="admin-butterfly" variant="moon" /></header>{latest ? <section className="admin-latest"><span className="eyebrow">最新选择</span><p className="admin-choice">{labels[latest.choice] ?? latest.choice}</p><div className="admin-date">{formatDate(latest.submitted_at).date}</div><div className="admin-time">{formatDate(latest.submitted_at).time}</div></section> : <p className="admin-empty">这一页还没有被写下。</p>}<section className="admin-history"><h2>选择记录</h2>{responses.length ? <div className="admin-list">{responses.map((response, index) => <div className="admin-row" key={`${response.submitted_at}-${index}`}><span>{formatDate(response.submitted_at).short}</span><strong>{labels[response.choice] ?? response.choice}</strong></div>)}</div> : null}</section><form action="/api/logout" method="post" className="admin-leave"><button type="submit">离开</button></form></div></main>;
}
