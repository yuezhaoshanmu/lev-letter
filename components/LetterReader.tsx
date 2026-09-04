"use client";

import { useEffect, useMemo, useState } from "react";
import type { Chapter, LetterData, LetterParagraph } from "../lib/letter";
import { chapters, highlightParagraphs } from "../lib/letter";
import Butterfly from "./Butterfly";
import ReadingProgress from "./ReadingProgress";

type LetterReaderProps = { data: LetterData; onNext: () => void; onMoodChange: (mood: string) => void };

function Paragraph({ paragraph }: { paragraph: LetterParagraph }) {
  if (paragraph.sourceIndex >= 1498 && paragraph.sourceIndex <= 1509) return null;
  if (paragraph.sourceIndex === 1497) return <p className="letter-paragraph letter-opening-replacement reveal">不用急着回答。<br />也不用急着决定什么。<br />你可以慢慢读。<br />如果某一句话，<br />刚好落在你的心里。<br />那就已经很好。</p>;
  if (paragraph.type === "blank") return <div className="letter-blank" aria-hidden="true" data-source-index={paragraph.sourceIndex} />;
  if (paragraph.type === "rule") return <div className="letter-rule" data-source-index={paragraph.sourceIndex} aria-hidden="true" />;
  const breathing = highlightParagraphs.has(paragraph.sourceIndex);
  const quote = /^[“「]/.test(paragraph.text) || paragraph.text.includes("——");
  return (
    <p className={`letter-paragraph reveal ${breathing ? "is-breathing" : ""} ${quote ? "is-quote" : ""}`} data-source-index={paragraph.sourceIndex}>
      {paragraph.runs.map((run, index) => <span key={`${paragraph.sourceIndex}-${index}`} className={run.bold ? "is-bold" : ""}>{run.text}</span>)}
    </p>
  );
}

function ChapterMarker({ chapter }: { chapter: Chapter }) {
  const chapterNumber = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"].indexOf(chapter.number) + 1;
  return (
    <div className="chapter-marker reveal" data-chapter={chapter.number}>
      <span className="chapter-index">Chapter {String(chapterNumber).padStart(2, "0")}</span>
      <span className="chapter-line" />
      <span className="chapter-title">{chapter.title}</span>
      <Butterfly className="chapter-butterfly" variant={chapter.mood === "memory" ? "green" : "moon"} />
    </div>
  );
}

export default function LetterReader({ data, onNext, onMoodChange }: LetterReaderProps) {
  const [progress, setProgress] = useState(0);
  const sectionGroups = useMemo(() => {
    const sorted = [...chapters].sort((a, b) => a.at - b.at);
    const groups: Array<{ chapter?: Chapter; paragraphs: LetterParagraph[] }> = [];
    const intro = data.paragraphs.filter((paragraph) => paragraph.sourceIndex < sorted[0].at);
    if (intro.length) groups.push({ paragraphs: intro });
    sorted.forEach((chapter, index) => {
      const end = sorted[index + 1]?.at ?? Number.POSITIVE_INFINITY;
      groups.push({ chapter, paragraphs: data.paragraphs.filter((paragraph) => paragraph.sourceIndex >= chapter.at && paragraph.sourceIndex < end) });
    });
    return groups;
  }, [data.paragraphs]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("letter_reading_position");
      if (saved) window.setTimeout(() => window.scrollTo({ top: Number(saved), behavior: "smooth" }), 80);
    } catch {
    }
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      const element = document.getElementById("letter");
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const total = Math.max(1, element.scrollHeight - window.innerHeight);
      const current = Math.max(0, Math.min(1, (window.scrollY - (window.scrollY + rect.top)) / total));
      setProgress(current);
      const sourcePosition = current * data.paragraphs.length;
      const active = chapters.reduce((last, chapter) => (chapter.at <= sourcePosition ? chapter : last), chapters[0]);
      onMoodChange(active?.mood ?? "forest");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [data.paragraphs.length, onMoodChange]);

  return (
    <div id="letter" className="letter-shell">
      <ReadingProgress progress={progress} />
      <header className="letter-header reveal">
        <span className="eyebrow">a private letter</span>
        <h1>致饶饶</h1>
        <p>从一个夏天写到另一个清晨。</p>
        <div className="header-mark"><span /> <Butterfly variant="moon" /></div>
      </header>
      <article className="letter-body">
        {sectionGroups.map((group) => (
          <section className={`letter-section ${group.chapter ? `mood-${group.chapter.mood}` : "letter-opening"}`} key={group.chapter?.at ?? "opening"}>
            {group.chapter && <ChapterMarker chapter={group.chapter} />}
            {group.paragraphs.map((paragraph) => <Paragraph paragraph={paragraph} key={paragraph.sourceIndex} />)}
          </section>
        ))}
      </article>
      <footer className="letter-end reveal">
        <Butterfly className="letter-end-butterfly" variant="moon" />
        <span className="eyebrow">A QUIET MOMENT</span>
        <p className="letter-end-main">有些话。<br />写完以后，<br />需要一点时间沉淀。</p>
        <div className="letter-end-breath" aria-hidden="true"><span /><span /><span /></div>
        <p className="letter-end-follow">如果你愿意。<br />我们继续往下走。</p>
        <button type="button" className="letter-end-continue" onClick={onNext}>继续听我说</button>
      </footer>
    </div>
  );
}
