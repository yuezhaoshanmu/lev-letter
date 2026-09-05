"use client";

import { useState } from "react";

type Choice = "willing" | "friend" | "time";
type Response = { id: string; choice: Choice | null; message: string | null; submitted_at: string };

const choices: Array<{ value: Choice; label: string }> = [
  { value: "willing", label: "我愿意试着靠近你" },
  { value: "friend", label: "我想继续做朋友" },
  { value: "time", label: "我需要一点时间" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function AdminControls({ initialResponses }: { initialResponses: Response[] }) {
  const [responses, setResponses] = useState(initialResponses);
  const [currentChoice, setCurrentChoice] = useState<Choice | null>(initialResponses.find((item) => item.choice)?.choice ?? null);
  const [draftChoice, setDraftChoice] = useState<Choice | null>(currentChoice);
  const [status, setStatus] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function saveChoice() {
    if (!draftChoice) return;
    setStatus("正在保存...");
    const response = await fetch("/api/admin/choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: draftChoice }),
    });
    if (!response.ok) {
      setStatus("保存失败，请稍后再试。");
      return;
    }
    setCurrentChoice(draftChoice);
    setStatus("已保存。");
  }

  async function deleteMessage(id: string) {
    setDeleting(id);
    const response = await fetch(`/api/admin/responses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setResponses((items) => items.filter((item) => item.id !== id));
    setDeleting(null);
  }

  return (
    <>
      <section className="admin-control-section">
        <div className="admin-section-heading"><span className="eyebrow">RESPONSE CONTROL</span><h2>原管理员控制区域</h2></div>
        <p className="admin-current-label">当前选择</p>
        <p className="admin-current-choice">{choices.find((item) => item.value === currentChoice)?.label ?? "尚未选择"}</p>
        <div className="admin-choice-controls">
          {choices.map((choice) => (
            <button key={choice.value} type="button" className={draftChoice === choice.value ? "is-selected" : ""} onClick={() => setDraftChoice(choice.value)}>
              {choice.label}
            </button>
          ))}
        </div>
        <div className="admin-control-footer">
          <button type="button" className="admin-save" onClick={saveChoice} disabled={!draftChoice || draftChoice === currentChoice}>保存选择</button>
          <span role="status">{status}</span>
        </div>
      </section>
      <section className="admin-message-section">
        <div className="admin-section-heading"><span className="eyebrow">LETTER ARCHIVE</span><h2>留言管理</h2></div>
        {responses.length ? <div className="admin-message-list">{responses.map((item) => (
          <article className="admin-message-item" key={item.id}>
            <div className="admin-message-meta">{formatDate(item.submitted_at)}{item.choice ? ` · ${choices.find((choice) => choice.value === item.choice)?.label ?? item.choice}` : ""}</div>
            <p>{item.message || "这条记录没有留言。"}</p>
            {item.message ? <button type="button" className="admin-delete" onClick={() => deleteMessage(item.id)} disabled={deleting === item.id}>{deleting === item.id ? "删除中..." : "删除留言"}</button> : null}
          </article>
        ))}</div> : <p className="admin-empty">还没有留下留言。</p>}
      </section>
    </>
  );
}
