"use client";

import { ArrowDownRight, ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Butterfly from "./Butterfly";
import { trackVisitor } from "./VisitorTracker";

type EndingBufferProps = { onContinue: () => void };
type ChapterPage = { title: string; lines: string[] };

const pages: ChapterPage[] = [
  { title: "关于喜欢", lines: ["你曾经和我说。", "", "其实你不太理解，", "什么叫喜欢。", "", "为什么有些人可以很确定地说：", "", "“我喜欢这个人。”", "", "而有些人，", "却需要很久很久，", "才能确认自己的感觉。", "", "我觉得这其实没有关系。", "", "因为喜欢本来就没有标准答案。", "", "有些人的喜欢，", "像突然落下来的雨。", "", "很快，很明显。", "", "有些人的喜欢，", "更像夜里的月亮。", "", "一开始只是觉得有一点光。", "", "后来才发现，", "原来它已经陪自己走了很远。", "", "所以你不用急着知道答案。"] },
  { title: "关于自由", lines: ["你说过。", "", "你不喜欢别人管你太多。", "", "后来我想了一下。", "", "我觉得这其实是一件很珍贵的事情。", "", "因为喜欢一个人，", "不应该意味着改变她。", "", "不是希望她变成某个样子。", "", "也不是希望她按照自己的期待生活。", "", "真正的靠近，", "应该是两个完整的人，", "愿意分享一部分自己的世界。", "", "你还是你。", "", "我也还是我。", "", "只是偶尔，", "我们可以一起看看同一片风景。"] },
  { title: "关于那些小小的喜欢", lines: ["我后来发现。", "", "一个人的可爱，", "很多时候藏在一些很小的地方。", "", "喜欢一部作品。", "", "喜欢某种故事。", "", "喜欢某一种角色。", "", "喜欢某一个世界。", "", "这些事情看起来没有那么重要。", "", "可是它们组成了一个人的一部分。", "", "不是因为它们代表什么。", "", "只是因为：", "", "这是你喜欢的东西。", "", "而我觉得，", "能够知道这些，", "本身就是一件很温柔的事情。"] },
  { title: "关于《四月一日灵异事件簿》", lines: ["你告诉我，", "你很喜欢《四月一日灵异事件簿》。", "", "后来我想。", "", "也许我能理解一点，", "为什么你会喜欢这样的故事。", "", "那个世界里，", "很多事情没有简单答案。", "", "愿望需要交换。", "相遇有意义。", "人与人的缘分，", "总带着一点无法解释的部分。", "", "它没有告诉别人：", "", "应该怎样生活。", "", "也没有告诉别人：", "", "一定会得到什么。", "", "它只是安静地告诉我们：", "", "有些相遇，", "本身就是一种意义。", "", "我觉得这一点很像你。", "", "你不急着给很多事情下结论。", "", "你只是慢慢感受。"] },
];

const closingLines = ["其实这些都不是答案。", "", "也不是我想告诉你的道理。", "", "只是我想说：", "", "谢谢你曾经愿意告诉我这些。", "", "一个人的世界，", "其实就是由很多这样的小事情组成的。", "", "而我很幸运。", "", "曾经听见过其中一些。"];

export default function EndingBuffer({ onContinue }: EndingBufferProps) {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(-1);
  const chapterTopRef = useRef<HTMLDivElement>(null);
  const isCover = page === -1;
  const isClosing = page === pages.length;
  const pageData = page >= 0 && page < pages.length ? pages[page] : null;
  const advance = () => setPage((current) => { const next = Math.min(pages.length, current + 1); if (next < pages.length) trackVisitor("read_section", { section: pages[next].title }, "/"); return next; });
  const retreat = () => setPage((current) => Math.max(-1, current - 1));

  useEffect(() => {
    // Let the new page mount before bringing its chapter top into view.
    const frame = window.requestAnimationFrame(() => {
      chapterTopRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [page, reduceMotion]);

  return (
    <motion.main className="ending-buffer chapter-buffer" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.15 }}>
      <div ref={chapterTopRef} className="chapter-top-anchor" aria-hidden="true" />
      <div className="ending-stars" aria-hidden="true" />
      <Butterfly className="ending-butterfly ending-butterfly-blue" variant="blue" />
      <Butterfly className="ending-butterfly ending-butterfly-green" variant="green" />
      <div className="chapter-buffer-copy">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={page} className={`chapter-page ${isCover ? "chapter-page-cover" : ""} ${isClosing ? "chapter-page-closing" : ""}`} initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 0, transition: { duration: .3, ease: "easeOut" } }} transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}>
            {isCover ? <><span className="eyebrow">a softer chapter</span><h1>还有一些关于你的事情。<br />我想轻轻记下来。</h1><span className="chapter-page-rule" /><p className="chapter-intro">我记得你曾经告诉我的一些事情。</p></> : isClosing ? <><span className="eyebrow">a quiet note</span><div className="chapter-lines chapter-closing-lines">{closingLines.map((line, index) => line ? <p key={`${line}-${index}`}>{line}</p> : <span className="chapter-line-break" aria-hidden="true" key={`blank-${index}`} />)}</div></> : pageData ? <><div className="chapter-page-heading"><span className="chapter-page-index">0{page + 1} / 04</span><span className="chapter-page-rule" /></div><h1>{pageData.title}</h1><div className="chapter-lines">{pageData.lines.map((line, index) => line ? <p key={`${line}-${index}`}>{line}</p> : <span className="chapter-line-break" aria-hidden="true" key={`blank-${index}`} />)}</div></> : null}
          </motion.section>
        </AnimatePresence>
        <nav className="chapter-navigation" aria-label="章节翻页">
          {!isCover ? <button type="button" className="chapter-nav-back" onClick={retreat}><ArrowLeft size={15} strokeWidth={1.15} /><span>上一页</span></button> : <span />}
          {isClosing ? <button className="ending-buffer-continue" type="button" onClick={onContinue}><span>继续往后走</span><ArrowDownRight size={16} strokeWidth={1.15} /></button> : <button className="ending-buffer-continue" type="button" onClick={advance}><span>下一页</span><ArrowRight size={16} strokeWidth={1.15} /></button>}
        </nav>
      </div>
    </motion.main>
  );
}
