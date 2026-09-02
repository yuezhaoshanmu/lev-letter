"use client";

import { ArrowDownRight, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Butterfly from "./Butterfly";

type Choice = "yes" | "no" | "thinking";
type EndingSceneProps = { onBack: () => void };
const copy: Record<Choice, string[]> = {
  yes: ["我看见这一页了。", "那剩下的，我们以后慢慢写。"],
  no: ["我知道了。", "谢谢你认真读到了这里。", "这本书不会因为答案不同，就否认这一页曾经存在。"],
  thinking: ["好。", "这一页可以先留白。", "你慢慢想。"],
};

export default function EndingScene({ onBack }: EndingSceneProps) {
  const reduceMotion = useReducedMotion();
  const [answer, setAnswer] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/choice").then((r) => r.ok ? r.json() : null).then((result) => { if (active && result?.choice) setAnswer(result.choice as Choice); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const choose = async (choice: Choice) => {
    if (busy) return;
    setBusy(true); setAnswer(choice);
    try {
      const response = await fetch("/api/choice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice }) });
      if (!response.ok) setAnswer(null);
    } catch { setAnswer(null); } finally { setBusy(false); }
  };
  const locked = busy || (answer !== null && answer !== "thinking");
  return (
    <motion.main className={`ending-scene ${answer ? `choice-${answer}` : ""}`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.15 }}>
      <div className="ending-stars" aria-hidden="true" />
      <Butterfly className="ending-butterfly ending-butterfly-blue" variant="blue" />
      <Butterfly className="ending-butterfly ending-butterfly-green" variant="green" />
      <div className="ending-copy">
        {!answer ? <><span className="eyebrow">the next page</span><p className="ending-line">这本书现在递给你了。</p><p className="ending-line ending-line-soft">不用今天读完。<br />也不用急着决定结局。<br />你可以先翻第一页，再翻第二页。</p><p className="ending-question">那么你愿意翻开我这本书，<br />与我共同书写么。</p></> : answer === "thinking" ? <p className="ending-previous">上一次，你把这一页留白了。</p> : null}
        <div className="ending-choices" aria-label="你的回答">
          {(["yes", "no", "thinking"] as Choice[]).map((choice) => <button key={choice} type="button" disabled={locked} onClick={() => choose(choice)} className={answer === choice ? "is-selected" : ""}>{choice === "yes" ? "愿意" : choice === "no" ? "不愿意" : "需要再想想"}</button>)}
        </div>
        <div className={`ending-response ${answer ? "is-visible" : ""}`} role="status" aria-live="polite">{answer && copy[answer].map((line) => <p key={line}>{line}</p>)}</div>
        <button className="back-to-letter" type="button" onClick={onBack}><RotateCcw size={15} strokeWidth={1.2} />再看一遍</button>
      </div>
      <ArrowDownRight className="ending-arrow" size={18} strokeWidth={1.1} aria-hidden="true" />
    </motion.main>
  );
}
