"use client";

import { ArrowDownRight, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { trackVisitor } from "./VisitorTracker";

type Choice = "我愿意试着靠近你" | "我想继续做朋友" | "我需要一点时间";
type FutureLetterProps = { onBack: () => void };
type Phase = "reading" | "transition" | "response" | "thanks";

const choices: Choice[] = ["我愿意试着靠近你", "我想继续做朋友", "我需要一点时间"];
const choiceKeys: Record<Choice, string> = {
  "我愿意试着靠近你": "close",
  "我想继续做朋友": "friend",
  "我需要一点时间": "time",
};
const choiceValues: Record<Choice, "willing" | "friend" | "time"> = { "我愿意试着靠近你": "willing", "我想继续做朋友": "friend", "我需要一点时间": "time" };
const storedChoiceLabels: Record<string, Choice> = {
  willing: "我愿意试着靠近你", friend: "我想继续做朋友", time: "我需要一点时间",
  yes: "我愿意试着靠近你", no: "我想继续做朋友", thinking: "我需要一点时间",
  "愿意": "我愿意试着靠近你", "不愿意": "我想继续做朋友", "需要再想一想": "我需要一点时间",
  "我愿意试着靠近你": "我愿意试着靠近你", "我想继续做朋友": "我想继续做朋友", "我需要一点时间": "我需要一点时间",
};

const responseCopy: Record<Choice, string[]> = {
  "我愿意试着靠近你": ["谢谢你愿意打开这一扇门。", "我很开心，也很珍惜这一刻。"],
  "我想继续做朋友": ["谢谢你愿意认真告诉我答案。", "这一次勇敢迈出去，", "本身已经是一份收获。"],
  "我需要一点时间": ["不用急。", "有些答案，", "需要时间慢慢确认。"],
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
  const [phase, setPhase] = useState<Phase>("reading");
  const [busy, setBusy] = useState(false);
  const [choiceState, setChoiceState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pressedChoice, setPressedChoice] = useState<Choice | null>(null);
  const [message, setMessage] = useState("");
  const [messageState, setMessageState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    trackVisitor("proposal_view", {}, "/");
    trackVisitor("proposal_page", {}, "/");
    let active = true;
    fetch("/api/choice").then((response) => response.ok ? response.json() : null).then((result) => {
      const stored = typeof result?.choice === "string" ? storedChoiceLabels[result.choice] : undefined;
      if (active && stored) {
        setAnswer(stored);
        setChoiceState("saved");
        setPhase("thanks");
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
    setPhase("transition");
    trackVisitor("button_click", { answer: choiceValues[choice] }, "/");
    trackVisitor("proposal_click", { answer: choiceValues[choice] }, "/");
    window.setTimeout(() => setPressedChoice(null), reduceMotion ? 0 : 500);
    window.setTimeout(() => setPhase("response"), reduceMotion ? 0 : 3000);
    try {
      const response = await fetch("/api/choice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice: choiceValues[choice], message: message.trim() }) });
      if (!response.ok) {
        setAnswer(null);
        setPhase("reading");
        setChoiceState("error");
      } else {
        setChoiceState("saved");
      }
    } catch {
      setAnswer(null);
      setPhase("reading");
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
  const responseLines = answer ? responseCopy[answer] : [];

  useEffect(() => {
    if (phase !== "response" || !answer) return;
    const delay = reduceMotion ? 1400 : 5000;
    const timer = window.setTimeout(() => setPhase("thanks"), delay);
    return () => window.clearTimeout(timer);
  }, [answer, phase, reduceMotion]);

  return (
    <motion.main className={`future-letter-scene ${choiceClass} phase-${phase}`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.15 }}>
      <div className="ending-stars" aria-hidden="true" />
      <div className="choice-moon" aria-hidden="true" />
      <div className="choice-growth-light" aria-hidden="true" />
      <div className="choice-leaves" aria-hidden="true"><i /><i /><i /></div>
      <div className="choice-sprout" aria-hidden="true"><i /><i /></div>
      <div className="choice-clock" aria-hidden="true"><span /><span /></div>
      <div className="future-letter-copy">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "reading" && !opened ? (
            <motion.section key="envelope" className="future-envelope-stage" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .75 }}>
              <span className="eyebrow">还有一封信。<br />写给未来。</span>
              <span className="future-letter-moth future-letter-moth-one" aria-hidden="true" />
              <span className="future-letter-moth future-letter-moth-two" aria-hidden="true" />
              <span className="future-letter-moth future-letter-moth-three" aria-hidden="true" />
              <button className={`future-envelope ${opening ? "is-opening" : ""}`} type="button" onClick={openEnvelope} aria-label="打开给未来的信" disabled={opening}>
                <span className="future-envelope-flap" aria-hidden="true" />
                <span className="future-envelope-paper" aria-hidden="true" />
                <span className="future-envelope-title">还有一封信。</span>
                <span className="future-envelope-subtitle">写给未来。</span>
              </button>
              <p className="future-envelope-hint">点击信封，慢慢打开</p>
            </motion.section>
          ) : phase === "reading" ? (
            <motion.section key="letter" className="future-letter-content" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8 }}>
              <div className="future-letter-heading"><span className="eyebrow">给未来的你</span><span className="future-letter-rule" /></div>
              <div className="future-letter-sections">
                {sections.map((lines, sectionIndex) => (
                  <motion.section className="future-letter-section" key={sectionIndex} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: reduceMotion ? 0 : sectionIndex * .12 }}>
                    {lines.map((line, lineIndex) => line ? <p key={`${sectionIndex}-${lineIndex}`}>{line}</p> : <span className="future-letter-break" aria-hidden="true" key={`${sectionIndex}-break-${lineIndex}`} />)}
                  </motion.section>
                ))}
              </div>
              <div className="future-letter-choice-intro"><p>不用急着回答。</p><p>因为喜欢这件事。</p><p>本来就不是一道需要马上作答的问题。</p></div>
              <div className="future-letter-choices" aria-label="你的回答">
                {choices.map((choice) => <button key={choice} type="button" disabled={busy || answer !== null} onClick={() => choose(choice)} className={`${answer === choice ? "is-selected" : ""} ${pressedChoice === choice ? "is-pressed" : ""}`}><span aria-hidden="true">·</span> {choice}</button>)}
              </div>
              <p className={`future-letter-choice-status ${choiceState === "error" ? "is-error" : ""}`} role="status" aria-live="polite">{choiceState === "error" ? "保存失败，请稍后再试。" : ""}</p>
              <button className="back-to-letter future-letter-back" type="button" onClick={onBack}><RotateCcw size={15} strokeWidth={1.2} />再看一遍</button>
            </motion.section>
          ) : phase === "transition" ? (
            <motion.section key="transition" className="choice-transition" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5 }}>
              <span className="choice-transition-envelope" aria-hidden="true"><i /></span>
              <span className="choice-transition-label">有一封回信，正在抵达。</span>
            </motion.section>
          ) : phase === "response" ? (
            <motion.section key="response" className="choice-response-paper" initial={reduceMotion ? false : { opacity: 0, y: 20, scale: .8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 1.25, ease: [.22, 1, .36, 1] }}>
              <span className="response-paper-fold" aria-hidden="true" />
              <span className="eyebrow">写给此刻的你</span>
              <div className="choice-response-lines" role="status" aria-live="polite">
                {responseLines.map((line, index) => <motion.p key={`${line}-${index}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: reduceMotion ? 0 : index * .8 }}>{line}</motion.p>)}
              </div>
            </motion.section>
          ) : (
            <motion.section key="thanks" className="choice-thanks" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9 }}>
              <span className="thanks-star" aria-hidden="true" />
              <span className="eyebrow">谢谢你认真看完。</span>
              <p className="thanks-letter-copy">这封信，会一直留在这里。</p>
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
