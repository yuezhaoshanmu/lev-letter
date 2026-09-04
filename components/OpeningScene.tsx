"use client";

import { ArrowDownRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Butterfly from "./Butterfly";

type OpeningSceneProps = { closing: boolean; onOpen: () => void; onTitleClick: () => void };

export default function OpeningScene({ closing, onOpen, onTitleClick }: OpeningSceneProps) {
  const reduceMotion = useReducedMotion();
  return (
    <main className={`opening-scene ${closing ? "is-closing" : ""}`}>
      <div className="opening-quiet-line" />
      <Butterfly className="opening-butterfly opening-butterfly-one" variant="blue" />
      <Butterfly className="opening-butterfly opening-butterfly-two" variant="green" />
      <motion.div
        className="opening-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="opening-name" type="button" onClick={onTitleClick} aria-label="致饶饶，点击五次发现一个小彩蛋">致饶饶</button>
        <span className="opening-rule" />
        <p className="opening-lead">不用急着回答。</p>
        <p className="opening-sub">你可以慢慢读。</p>
        <button className="open-letter" type="button" onClick={onOpen}>
          <span>打开这封信</span><ArrowDownRight size={16} strokeWidth={1.2} />
        </button>
        <p className="opening-date">a letter written in the blue hour</p>
      </motion.div>
      <span className="opening-corner opening-corner-left">夏末</span>
      <span className="opening-corner opening-corner-right">/ 01</span>
    </main>
  );
}
