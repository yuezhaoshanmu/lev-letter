"use client";

import { ArrowUpRight } from "lucide-react";
import { FormEvent, useState } from "react";

type PasswordGateProps = { onUnlock: (role: "letter" | "admin") => void };

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error("incorrect");
      onUnlock(result.role);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="password-gate">
      <div className="password-gate-inner">
        <span className="eyebrow">Private letter · 2026</span>
        <h1>这封信只写给一个人。</h1>
        <p>如果你知道它属于谁，就输入那句只属于我们的暗号。</p>
        <form onSubmit={submit}>
          <label htmlFor="letter-password">你的生日（月日）</label>
          <div className="password-row">
            <input id="letter-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" inputMode="numeric" autoComplete="off" autoFocus aria-invalid={error} />
            <button type="submit" aria-label="打开信件" disabled={busy}><ArrowUpRight size={18} strokeWidth={1.25} /></button>
          </div>
          <span className={`password-error ${error ? "is-visible" : ""}`} role="status">这句暗号不对，再想一想。</span>
        </form>
      </div>
    </main>
  );
}
