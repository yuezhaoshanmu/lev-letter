"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Butterfly from "./Butterfly";

type UnlockRitualProps = { onOpenSound: () => Promise<void>; onSkipSound: () => void };

export default function UnlockRitual({ onOpenSound, onSkipSound }: UnlockRitualProps) {
  const reduceMotion = useReducedMotion();
  const [showButton, setShowButton] = useState(reduceMotion);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setShowButton(true), 2600);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const open = async () => {
    if (busy) return;
    setBusy(true);
    await onOpenSound();
    setBusy(false);
  };

  return (
    <main className="unlock-ritual" aria-live="polite">
      <Butterfly className="unlock-ritual-butterfly unlock-ritual-butterfly-blue" variant="blue" />
      <Butterfly className="unlock-ritual-butterfly unlock-ritual-butterfly-green" variant="green" />
      <div className="unlock-ritual-copy">
        <motion.p className="unlock-ritual-line" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1 }}>你好。<br /><br />饶饶。</motion.p>
        <motion.p className="unlock-ritual-line" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: reduceMotion ? 0 : .85 }}>在翻开这本书之前，<br />我想邀请你先听一首歌。</motion.p>
        <motion.p className="unlock-ritual-line unlock-ritual-line-soft" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: reduceMotion ? 0 : 1.7 }}>这首歌最近陪伴了你一些时间。<br />所以我想，<br />把它放在这里。</motion.p>
        {showButton ? <motion.div className="music-choice-actions" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9 }}>
          <button className="music-choice-primary" type="button" onClick={open} disabled={busy}><span>{busy ? "正在播放 ♪" : "听听这首歌"}</span></button>
          <button className="music-choice-secondary" type="button" onClick={onSkipSound}>先不用，我想直接看看</button>
        </motion.div> : null}
      </div>
    </main>
  );
}
