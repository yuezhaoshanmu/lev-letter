"use client";

import { useEffect, useState } from "react";
import Butterfly from "./Butterfly";
import { trackVisitor } from "./VisitorTracker";

const sections = [
  [
    "我之前和你说过，",
    "我做一件事情的时候，",
    "如果只能达成一个目的，",
    "有时候会觉得有一点浪费。",
    "其实这次向你表达心意，",
    "也有很多不同的想法。",
    "最重要的当然是：",
    "我是真的喜欢你。",
    "是真的希望有机会可以更靠近你。",
  ],
  [
    "但除此之外，",
    "我也想过一些其他的事情。",
    "如果最后我们没有走到一起，",
    "这件事情其实也不会完全没有意义。",
    "至少以后某一天回想起来，",
    "你可能会记得：",
    "曾经有一个人，",
    "很认真地喜欢过你。",
  ],
  [
    "而且其实我觉得自己也还不错哈哈。",
    "虽然平时可能有一点不自信，",
    "但客观来说，",
    "我也算是挺受异性欢迎的人。",
    "也勉强算是被lyy那样优秀的人表白过。",
    "所以我也希望未来那个喜欢你的人，",
    "能够知道：",
    "你是一个值得被认真对待的人。",
  ],
  [
    "还有一个比较现实的小事情。",
    "就是关于狼人杀。",
    "zyj 好像不太想继续玩了。",
    "她觉得如果她不玩，",
    "可能你们也不会继续。",
    "但是我知道你其实还是喜欢玩的。",
  ],
  [
    "所以我也想过，",
    "如果我告诉你我的心意，",
    "无论最后结果是什么，",
    "你可能都会需要一点时间调整。",
    "也许之后你也不会像以前一样自然地继续参加狼人杀。",
  ],
  [
    "如果那个时候，",
    "你没有告诉 zyj 发生了什么，",
    "她可能会以为：",
    "你是因为她不玩，",
    "所以也愿意陪她一起放弃。",
    "她可能会因此觉得：",
    "“原来她这么在乎我。”",
    "也许反而会让你们之间的友情变得更好。",
  ],
  [
    "当然，",
    "这些只是我提前想到的一些可能。",
    "我不是希望通过这件事情影响任何人，",
    "也不是希望你为了任何人做什么选择。",
    "我只是习惯在做决定之前，",
    "会想很多人的感受。",
  ],
  [
    "所以这次也是一样。",
    "我想了很多。",
    "想过你。",
    "想过自己。",
    "也想过可能带来的各种结果。",
    "最后还是觉得：",
    "如果一直因为害怕结果而不说，",
    "可能才是最大的遗憾。",
  ],
];

type HiddenLetterProps = { onReturnToLetter: () => void };

export default function HiddenLetter({ onReturnToLetter }: HiddenLetterProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    trackVisitor("hidden_letter_open", {
      source: "music_button",
      trigger: "long_press",
      duration_ms: 3000,
    }, "/hidden-letter");
    const timer = window.setInterval(() => {
      setVisibleLines((value) => Math.min(value + 1, sections.reduce((sum, section) => sum + section.length, 0)));
    }, 125);
    return () => window.clearInterval(timer);
  }, []);

  let lineIndex = 0;
  return (
    <main className="hidden-letter-scene">
      <div className="hidden-letter-moon" aria-hidden="true" />
      <Butterfly className="hidden-letter-butterfly hidden-letter-butterfly-one" variant="blue" />
      <Butterfly className="hidden-letter-butterfly hidden-letter-butterfly-two" variant="green" />
      <article className="hidden-letter-paper">
        <header className="hidden-letter-heading">
          <span className="eyebrow">A LETTER KEPT QUIET</span>
          <h1>关于一些没有写进信里的想法</h1>
          <span className="hidden-letter-rule" />
        </header>
        <div className="hidden-letter-body">
          {sections.map((section, sectionIndex) => (
            <section className="hidden-letter-section" key={sectionIndex}>
              {section.map((line) => {
                lineIndex += 1;
                return <p className={lineIndex <= visibleLines ? "is-visible" : ""} key={`${sectionIndex}-${line}`}>{line}</p>;
              })}
            </section>
          ))}
        </div>
        <button className="hidden-letter-return" type="button" onClick={onReturnToLetter}>
          <span aria-hidden="true">↩</span>
          返回那封信
        </button>
      </article>
    </main>
  );
}
