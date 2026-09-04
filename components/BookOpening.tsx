"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type BookOpeningProps = { onComplete: () => void };

export default function BookOpening({ onComplete }: BookOpeningProps) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const timer = window.setTimeout(onComplete, reduceMotion ? 500 : 2600);
    return () => window.clearTimeout(timer);
  }, [onComplete, reduceMotion]);

  return <main className="book-opening" aria-live="polite"><motion.p initial={reduceMotion ? false : { opacity: 0, letterSpacing: ".45em" }} animate={{ opacity: 1, letterSpacing: ".24em" }} transition={{ duration: 1.2 }}>THE NEXT PAGE</motion.p><motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: reduceMotion ? 0 : .8 }}>致饶饶</motion.h1></main>;
}
