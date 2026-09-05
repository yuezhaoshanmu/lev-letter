"use client";

import { ArrowUpRight } from "lucide-react";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMusic } from "./AudioProvider";
import DoorTransition from "./DoorTransition";

type PasswordGateProps = { onUnlock: (role: "letter" | "admin") => void };

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const { startForLetterUnlock, cancelPreparedPlayback } = useMusic();
  const finishDoor = useCallback(() => {
    onUnlock("letter");
    router.refresh();
  }, [onUnlock, router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim() || busy || unlocking) return;
    setBusy(true);
    setError(false);
    // Keep this call in the submit gesture before any network await.
    void startForLetterUnlock();
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error("incorrect");
      if (result.role === "admin") {
        cancelPreparedPlayback();
        onUnlock(result.role);
        return;
      }
      if (result.role === "letter") {
        setUnlocking(true);
      }
    } catch {
      cancelPreparedPlayback();
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={`password-gate ${unlocking ? "is-unlocking" : ""}`}>
      <div className="password-gate-inner" inert={unlocking}>
        <span className="eyebrow">Private letter · 2026</span>
        <span className="unlock-success" aria-hidden="true" />
        <h1>有一扇门。<br />只有你知道怎么打开。</h1>
        <p>有些门，只认得一个人的脚步。</p>
        <form onSubmit={submit}>
          <label htmlFor="letter-password">你的生日（月日）</label>
          <div className="password-row">
            <input id="letter-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" inputMode="numeric" autoComplete="off" autoFocus aria-invalid={error} />
            <button type="submit" aria-label="打开信件" disabled={busy || unlocking}><ArrowUpRight size={18} strokeWidth={1.25} /></button>
          </div>
          <span className={`password-error ${error ? "is-visible" : ""}`} role="status">这扇门还没有认出你。</span>
        </form>
      </div>
      {unlocking ? <DoorTransition onComplete={finishDoor} /> : null}
    </main>
  );
}
