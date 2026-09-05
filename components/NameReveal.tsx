"use client";

import { motion, useReducedMotion } from "framer-motion";
import Butterfly from "./Butterfly";

export default function NameReveal({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <main className="name-reveal">
      <div className="name-reveal-stage-light" aria-hidden="true" />
      <motion.div
        className="name-reveal-copy"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : .75, ease: "easeOut" }}
        onAnimationComplete={() => window.setTimeout(onComplete, reduceMotion ? 0 : 850)}
      >
        <p className="name-reveal-name">饶饶</p>
        <p className="name-reveal-line">今晚，<br />想请你听一个故事。</p>
        <p className="name-reveal-note">向下看看吧。</p>
      </motion.div>
    </main>
  );
}
