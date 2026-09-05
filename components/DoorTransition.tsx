"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import Butterfly from "./Butterfly";
import styles from "./DoorTransition.module.css";

export default function DoorTransition({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const completeRef = useRef(onComplete);
  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => completeRef.current(), reduceMotion ? 1800 : 5600);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div className={styles.transition}>
      <div className={styles.confirmation} role="status">钥匙确认。</div>
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.spill} />
        <div className={styles.frame}>
          <div className={styles.beyond} />
          <div className={styles.leaf}>
            <div className={styles.upperPanel} />
            <div className={styles.lowerPanel} />
            <div className={styles.handle} />
          </div>
          <div className={styles.seam} />
        </div>
        <div className={styles.dust}><i /><i /><i /><i /><i /></div>
        <div className={styles.flight}><Butterfly variant="blue" /></div>
      </div>
    </div>
  );
}
