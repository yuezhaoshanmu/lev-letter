"use client";

import { ArrowDownRight, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Butterfly from "./Butterfly";

type Choice = "我愿意试着靠近你" | "我想继续做朋友" | "我需要一点时间";
type FutureLetterProps = { onBack: () => void };

const choices: Choice[] = ["我愿意试着靠近你", "我想继续做朋友", "我需要一点时间"];
const choiceKeys: Record<Choice, string> = {
  "我愿意试着靠近你": "close",
  "我想继续做朋友": "friend",
  "我需要一点时间": "time",
};
const choiceValues: Record<Choice, "willing" | "friend" | "time"> = { "我愿意试着靠近你": "willing", "我想继续做朋友": "friend", "我需要一点时间": "time" };
const storedChoiceLabels: Record<string, Choice> = {
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
const responseCopy: Record<Choice, string[]> = {
  "我愿意试着靠近你": ["谢谢你。", "那以后，", "请允许我慢慢走近你的世界。"],
  "我想继续做朋友": ["谢谢你告诉我真实的想法。", "能够认识你，", "本身就是一件很幸运的事情。"],
  "我需要一点时间": ["没关系。", "有些答案，", "本来就应该慢一点到来。"],
};

const sections = [
  ["我一直觉得。", "", "有些话写下来，", "不是为了得到一个答案。", "", "只是因为在某一个时间，", "有一个人出现了。", "", "于是那些原本没有名字的情绪，", "终于有了可以放置的地方。"],
  ["所以这封信，", "其实不是写给未来某一个确定的结果。", "", "它只是写给现在的你。", "", "写给那个曾经愿意听我说话，", "愿意让我走进一点点世界里的你。"],
  ["如果未来某一天，", "", "你发现自己愿意靠近我。", "", "那么我希望：", "", "我们不是因为谁缺少什么，", "才走向彼此。", "", "而是因为两个原本完整的人，", "", "刚好想一起看看更远的风景。"],
  ["如果你还不知道答案。", "也没有关系。", "", "有些事情本来就不能被催促。", "", "喜欢不是一道需要马上完成的题。", "", "它更像一本书。", "", "有的人翻开第一页，", "就知道想继续读。", "", "有的人需要慢慢读很多页。", "", "这都很好。"],
  ["所以。", "", "这封信不会要求你现在回答。", "", "我只是想把它放在这里。", "", "像森林里的一盏灯。", "", "像夜晚窗边的一点月光。", "", "你什么时候想打开，", "都可以。"],
];

export default function FutureLetter({ onBack }: FutureLetterProps) {
  const reduceMotion = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [answer, setAnswer] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [choiceState, setChoiceState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pressedChoice, setPressedChoice] = useState<Choice | null>(null);
  const [responseVisible, setResponseVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [messageState, setMessageState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let active = true;
    fetch("/api/choice").then((response) => response.ok ? response.json() : null).then((result) => {
      const stored = typeof result?.choice === "string" ? storedChoiceLabels[result.choice] : undefined;
      if (active && stored) {
        setAnswer(stored);
        setChoiceState("saved");
        setResponseVisible(true);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const choose = async (choice: Choice) => {
    if (busy || answer) return;
    setBusy(true);
    setChoiceState("saving");
    setAnswer(choice);
    setPressedChoice(choice);
    window.setTimeout(() => setPressedChoice(null), reduceMotion ? 0 : 300);
    const startedAt = performance.now();
    try {
      const response = await fetch("/api/choice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice: choiceValues[choice], message: message.trim() }) });
      if (!response.ok) {
        setAnswer(null);
        setResponseVisible(false);
        setChoiceState("error");
      } else {
        setChoiceState("saved");
        const remaining = reduceMotion ? 0 : Math.max(0, 1000 - (performance.now() - startedAt));
        window.setTimeout(() => setResponseVisible(true), remaining);
      }
    } catch {
      setAnswer(null);
      setResponseVisible(false);
      setChoiceState("error");
    } finally {
      setBusy(false);
    }
  };

  const submitMessage = async () => {
    const value = message.trim();
    if (!value || messageState === "saving") return;
    setMessageState("saving");
    try {
      const response = await fetch("/api/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: value }) });
      if (!response.ok) throw new Error("message request failed");
      setMessage(value);
      setMessageState("saved");
    } catch {
      setMessageState("error");
    }
  };

  const openEnvelope = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setOpened(true), reduceMotion ? 0 : 700);
  };

  const choiceClass = answer ? `choice-${choiceKeys[answer]}` : "";
  return (
    <motion.main className={`future-letter-scene ${choiceClass}`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.15 }}>
      <div className="ending-stars" aria-hidden="true" />
      <Butterfly className="future-letter-butterfly future-letter-butterfly-blue" variant="blue" />
      <Butterfly className="future-letter-butterfly future-letter-butterfly-green" variant="green" />
      <div className="future-letter-copy">
        <AnimatePresence mode="wait" initial={false}>
          {!opened ? (
            <motion.section key="envelope" className="future-envelope-stage" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .75 }}>
              <span className="eyebrow">还有一封信。<br />写给未来。</span>
              <button className={`future-envelope ${opening ? "is-opening" : ""}`} type="button" onClick={openEnvelope} aria-label="打开给未来的信" disabled={opening}>
                <span className="future-envelope-flap" aria-hidden="true" />
                <span className="future-envelope-paper" aria-hidden="true" />
                <span className="future-envelope-title">还有一封信。</span>
                <span className="future-envelope-subtitle">写给未来。</span>
              </button>
              <p className="future-envelope-hint">点击信封，慢慢打开</p>
            </motion.section>
          ) : (
            <motion.section key="letter" className="future-letter-content" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8 }}>
              <div className="future-letter-heading"><span className="eyebrow">给未来的你</span><span className="future-letter-rule" /></div>
              <div className="future-letter-sections">
                {sections.map((lines, sectionIndex) => (
                  <motion.section className="future-letter-section" key={sectionIndex} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: reduceMotion ? 0 : sectionIndex * .12 }}>
                    {lines.map((line, lineIndex) => line ? <p key={`${sectionIndex}-${lineIndex}`}>{line}</p> : <span className="future-letter-break" aria-hidden="true" key={`${sectionIndex}-break-${lineIndex}`} />)}
                  </motion.section>
                ))}
              </div>
              <div className="future-letter-choice-intro">
                <p>不用急着回答。</p>
                <p>因为喜欢这件事。</p>
                <p>本来就不是一道需要马上作答的问题。</p>
              </div>
              <div className="future-letter-choices" aria-label="你的回答">
                {choices.map((choice) => <button key={choice} type="button" disabled={busy || answer !== null} onClick={() => choose(choice)} className={`${answer === choice ? "is-selected" : ""} ${pressedChoice === choice ? "is-pressed" : ""}`}>
                  <span aria-hidden="true">{choice === "我愿意试着靠近你" ? "🌿" : choice === "我想继续做朋友" ? "🌙" : "🕊"}</span> {choice}
                </button>)}
              </div>
              <p className={`future-letter-choice-status ${choiceState === "error" ? "is-error" : ""}`} role="status" aria-live="polite">{choiceState === "saving" ? "正在保存..." : choiceState === "saved" ? "已收到你的回答。" : choiceState === "error" ? "保存失败，请稍后再试。" : ""}</p>
              <p className="future-letter-thanks">无论你的答案是什么。<br />谢谢你读完这些文字。</p>
              <div className={`future-letter-response ${answer && responseVisible ? "is-visible" : ""}`} role="status" aria-live="polite">{answer && responseCopy[answer].map((line) => <p key={line}>{line}</p>)}</div>
              <section className="ending-message future-letter-message" aria-labelledby="future-message-title">
                <p id="future-message-title" className="ending-message-copy">如果还有一句话想告诉我。<br />可以写在这里。<br />不用想怎么说。<br />我只是想听见你的声音。</p>
                <textarea value={message} onChange={(event) => { setMessage(event.target.value); if (messageState !== "idle") setMessageState("idle"); }} placeholder="如果还有一句想告诉我的话，\n可以写在这里。" rows={3} maxLength={1000} aria-label="想告诉我的话" />
                <button className="ending-message-submit" type="button" disabled={!message.trim() || messageState === "saving"} onClick={submitMessage}>{messageState === "saving" ? "正在送达..." : "留下这句话"}</button>
                <span className={`ending-message-status ${messageState === "error" ? "is-error" : ""}`} role="status" aria-live="polite">{messageState === "error" ? "保存失败，请稍后再试。" : messageState === "saved" ? <>谢谢你。<br />我会认真读完你的每一句话。</> : ""}</span>
              </section>
              <button className="back-to-letter future-letter-back" type="button" onClick={onBack}><RotateCcw size={15} strokeWidth={1.2} />再看一遍</button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      <ArrowDownRight className="future-letter-arrow" size={18} strokeWidth={1.1} aria-hidden="true" />
    </motion.main>
  );
}
