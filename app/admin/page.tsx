import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "../../lib/supabase-admin";
import { verifySession } from "../../lib/session";
import AdminControls from "../../components/AdminControls";

export default async function AdminPage() {
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) redirect("/");
  const db = createSupabaseAdmin();
  const logsResult = await db.from("visitor_logs").select("*").eq("is_admin", false).order("created_at", { ascending: false }).limit(100);
  if (logsResult.error) console.error("[admin analytics]", { message: logsResult.error.message, details: logsResult.error.details, hint: logsResult.error.hint, code: logsResult.error.code });
  else console.info("[admin analytics]", { table: "visitor_logs", count: logsResult.data?.length ?? 0 });
  const logs = logsResult.data ?? [];
  const visitorIds = logs.map((log) => log.id);
  const events = visitorIds.length ? (await db.from("visitor_events").select("visitor_id,event_type").in("visitor_id", visitorIds)).data ?? [] : [];
  const responsesResult = await db.from("confession_responses").select("id, choice, message, submitted_at").order("submitted_at", { ascending: false });
  const responses = (responsesResult.data ?? []) as Array<{ id: string; choice: "willing" | "friend" | "time" | null; message: string | null; submitted_at: string }>;
  const historyResult = await db.from("response_history").select("id, choice, created_at, ip_address, user_agent", { count: "exact" }).order("created_at", { ascending: false }).limit(200);
  if (historyResult.error) console.error("response_history query error", historyResult.error);
  else console.info("response_history count:", historyResult.data?.length ?? 0);
  const responseHistory = (historyResult.data ?? []) as Array<{ id: string; choice: "willing" | "friend" | "time"; created_at: string; ip_address: string | null; user_agent: string | null }>;
  const durations = logs.map((x) => x.duration_seconds || 0).filter(Boolean);
  const unique = (type: string) => new Set(events.filter((x) => x.event_type === type).map((x) => x.visitor_id)).size;
  const metrics = [
    ["访问总数", logs.length],
    ["当前在线", logs.filter((x) => !x.leave_time && Date.now() - new Date(x.created_at).getTime() < 300000).length],
    ["平均停留", `${durations.length ? Math.round(durations.reduce((a,b) => a+b, 0)/durations.length) : 0}s`],
    ["最长停留", `${durations.length ? Math.max(...durations) : 0}s`],
    ["阅读完成", unique("proposal_page")],
    ["进入表白", unique("proposal_page")],
    ["回应按钮", unique("proposal_click")],
  ];
  return <main className="admin-page"><div className="admin-inner">
    <header className="admin-header"><span className="eyebrow">PRIVATE OBSERVATORY</span><h1>她最后停在了哪一页。</h1></header>
    <section className="admin-metrics">{metrics.map(([label,value]) => <div className="admin-metric" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</section>
    <section className="admin-history"><h2>最近访问</h2>{logs.map((log) => <div className="admin-row" key={log.id}><span>{new Date(log.created_at).toLocaleString("zh-CN")}<br />{log.ip_address || "未知 IP"}</span><strong>{log.device || "PC"} · {log.duration_seconds || 0}s</strong><span className="admin-row-message">{log.last_page || "/"}<br />{log.user_agent || ""}</span></div>)}</section>
    <section className="admin-response-history">
      <div className="admin-section-heading"><span className="eyebrow">RESPONSE HISTORY</span><h2>选择历史</h2></div>
      {responseHistory.length ? <div className="admin-history-table">
        <div className="admin-history-row admin-history-row-header"><span>时间</span><span>选择内容</span><span>IP</span><span>设备</span></div>
        {responseHistory.map((item) => <div className="admin-history-row" key={item.id}>
          <span>{new Date(item.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}</span>
          <strong>{item.choice === "willing" ? "我愿意试着靠近你" : item.choice === "friend" ? "我想继续做朋友" : "我需要一点时间"}</strong>
          <span>{item.ip_address || "未知 IP"}</span>
          <span>{/tablet|ipad/i.test(item.user_agent || "") ? "Tablet" : /mobile|android|iphone/i.test(item.user_agent || "") ? "Mobile" : "PC"}</span>
        </div>)}
      </div> : <p className="admin-empty">还没有选择历史。</p>}
    </section>
    <AdminControls initialResponses={responses} />
    <form action="/api/logout" method="post" className="admin-leave"><button type="submit">离开</button></form>
  </div></main>;
}
