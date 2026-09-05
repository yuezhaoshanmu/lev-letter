import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "../../lib/supabase-admin";
import { verifySession } from "../../lib/session";
import AdminControls from "../../components/AdminControls";

type VisitorSession = {
  id: string;
  visitor_id: string;
  ip_address: string | null;
  device: string | null;
  entry_time: string;
  leave_time: string | null;
  duration_seconds: number | null;
  entry_page: string | null;
  exit_page: string | null;
  created_at: string;
};

type VisitorEvent = {
  session_id: string | null;
  event_type: string;
  page: string | null;
  event_time: string;
  metadata: Record<string, unknown> | null;
  event_data: Record<string, unknown> | null;
};

const timeParts = (value: string | null | undefined) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value)).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
};

const formatDateTime = (value: string | null | undefined) => {
  const parts = timeParts(value);
  return parts ? `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}:${parts.second}` : "尚未离开";
};

const formatTime = (value: string) => {
  const parts = timeParts(value);
  return parts ? `${parts.hour}:${parts.minute}:${parts.second}` : "--:--:--";
};

const sessionDuration = (session: VisitorSession) => {
  if (typeof session.duration_seconds === "number") return Math.max(0, session.duration_seconds);
  if (!session.entry_time) return 0;
  return Math.max(0, Math.round(((session.leave_time ? new Date(session.leave_time).getTime() : Date.now()) - new Date(session.entry_time).getTime()) / 1000));
};

const eventLabel = (event: VisitorEvent) => {
  const metadata = event.metadata ?? event.event_data ?? {};
  const section = typeof metadata.section === "string" ? metadata.section : "";
  const answer = typeof metadata.answer === "string" ? metadata.answer : "";
  switch (event.event_type) {
    case "page_open": return "打开网站";
    case "chapter_view": return section ? `阅读章节：${section}` : "阅读章节";
    case "button_click": return answer ? `点击回应按钮：${answer}` : "点击回应按钮";
    case "proposal_view": return "进入表白页";
    case "page_leave": return "离开";
    case "enter_site": return "打开网站";
    case "start_reading": return "开始阅读";
    case "read_section": return section ? `阅读章节：${section}` : "阅读章节";
    case "proposal_page": return "进入表白页";
    case "proposal_click": return answer ? `点击回应按钮：${answer}` : "点击回应按钮";
    default: return event.event_type;
  }
};

export default async function AdminPage() {
  const jar = await cookies();
  if (!verifySession(jar.get("admin_session")?.value, "admin")) redirect("/");
  const db = createSupabaseAdmin();
  const logsResult = await db.from("visitor_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (logsResult.error) {
    console.error("[admin analytics] page query error", logsResult.error);
    return <main className="admin-page"><div className="admin-inner"><h1>管理员统计加载失败</h1><p>{logsResult.error.message}</p></div></main>;
  }
  console.info("[admin analytics] first visitor record", logsResult.data?.[0] ?? null);
  const logs = logsResult.data ?? [];
  const visitorIds = logs.map((log) => log.id);
  const events = visitorIds.length ? (await db.from("visitor_events").select("visitor_id,event_type").in("visitor_id", visitorIds)).data ?? [] : [];
  const sessionsResult = await db.from("visitor_sessions").select("*").order("entry_time", { ascending: false }).limit(200);
  if (sessionsResult.error) console.error("[admin analytics] visitor_sessions query error", sessionsResult.error);
  const sessions = (sessionsResult.data ?? []) as VisitorSession[];
  const sessionIds = sessions.map((session) => session.id);
  const timelineEventsResult = sessionIds.length
    ? await db.from("visitor_events").select("session_id,event_type,page,event_time,metadata,event_data").in("session_id", sessionIds).order("event_time", { ascending: true })
    : { data: [], error: null };
  if (timelineEventsResult.error) console.error("[admin analytics] visitor_events timeline query error", timelineEventsResult.error);
  const timelineEvents = (timelineEventsResult.data ?? []) as VisitorEvent[];
  const sessionEvents = new Map<string, VisitorEvent[]>();
  timelineEvents.forEach((event) => {
    if (!event.session_id) return;
    const current = sessionEvents.get(event.session_id) ?? [];
    current.push(event);
    sessionEvents.set(event.session_id, current);
  });
  const visitorSessions = Array.from(sessions.reduce((groups, session) => {
    const current = groups.get(session.visitor_id) ?? [];
    current.push(session);
    groups.set(session.visitor_id, current);
    return groups;
  }, new Map<string, VisitorSession[]>()).entries()).map(([visitorId, visitorGroup]) => [
    visitorId,
    [...visitorGroup].sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime()),
  ] as const);
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
    <section className="admin-timeline">
      <div className="admin-section-heading"><span className="eyebrow">FULL VISIT TRACE</span><h2>访问时间线</h2></div>
      {visitorSessions.length ? visitorSessions.map(([visitorId, visitorGroup]) => {
        const first = visitorGroup[0];
        return <article className="admin-visitor-trace" key={visitorId}>
          <header className="admin-trace-header">
            <div><span>访客</span><strong>{first.ip_address || "未知 IP"}</strong></div>
            <div><span>设备</span><strong>{first.device || "PC"}</strong></div>
            <div><span>访问次数</span><strong>{visitorGroup.length}次</strong></div>
          </header>
          <div className="admin-trace-sessions">
            {visitorGroup.map((session, index) => {
              const sessionEventsForView = sessionEvents.get(session.id) ?? [];
              const preferredEvents = sessionEventsForView.filter((event) => ["page_open", "chapter_view", "button_click", "proposal_view", "page_leave"].includes(event.event_type));
              const visibleEvents = preferredEvents.length ? preferredEvents : sessionEventsForView;
              return <section className="admin-trace-session" key={session.id}>
                <div className="admin-trace-session-heading"><strong>第{index + 1}次访问</strong><span>{session.entry_page || "/"}</span></div>
                <dl className="admin-trace-details">
                  <div><dt>进入</dt><dd>{formatDateTime(session.entry_time)}</dd></div>
                  <div><dt>页面</dt><dd>{session.entry_page || "/"}</dd></div>
                  <div><dt>离开</dt><dd>{formatDateTime(session.leave_time)}</dd></div>
                  <div><dt>停留</dt><dd>{sessionDuration(session)}秒</dd></div>
                  <div><dt>离开页面</dt><dd>{session.exit_page || "尚未离开"}</dd></div>
                </dl>
                <div className="admin-trace-events">
                  <span className="admin-trace-events-label">行为</span>
                  {visibleEvents.length ? <ol>{visibleEvents.map((event, eventIndex) => <li key={`${event.session_id}-${event.event_time}-${event.event_type}-${eventIndex}`}><time>{formatTime(event.event_time)}</time><span>{eventLabel(event)}{event.page && event.page !== "/" ? ` · ${event.page}` : ""}</span></li>)}</ol> : <p>暂无行为记录。</p>}
                </div>
              </section>;
            })}
          </div>
        </article>;
      }) : <p className="admin-empty">还没有完整访问记录。请先执行 Supabase 的访问分析迁移。</p>}
    </section>
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
