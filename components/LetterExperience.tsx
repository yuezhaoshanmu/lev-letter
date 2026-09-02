"use client";

import { useCallback, useEffect, useState } from "react";
import type { LetterData } from "../lib/letter";
import AmbientBackground from "./AmbientBackground";
import EndingScene from "./EndingScene";
import LetterReader from "./LetterReader";
import MusicToggle from "./MusicToggle";
import OpeningScene from "./OpeningScene";
import PasswordGate from "./PasswordGate";

type Stage = "opening" | "leaving" | "reader" | "ending";
type LetterExperienceProps = { data: LetterData | null; passwordRequired: boolean; initialUnlocked?: boolean };

export default function LetterExperience({ data, passwordRequired, initialUnlocked = false }: LetterExperienceProps) {
  const [unlocked, setUnlocked] = useState(!passwordRequired || initialUnlocked);
  const [ready, setReady] = useState(true);
  const [stage, setStage] = useState<Stage>("opening");
  const [mood, setMood] = useState("forest");
  const [eggClicks, setEggClicks] = useState(0);
  const [eggVisible, setEggVisible] = useState(false);

  const unlock = (role: "letter" | "admin") => {
    if (role === "admin") window.location.assign("/admin");
    else setUnlocked(true);
  };
  const open = () => {
    setStage("leaving");
    window.setTimeout(() => {
      setStage("reader");
      window.setTimeout(() => document.getElementById("letter")?.scrollIntoView({ behavior: "smooth" }), 80);
    }, 1100);
  };
  const next = () => {
    setStage("ending");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setStage("reader");
    window.setTimeout(() => document.getElementById("letter")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const clickTitle = () => {
    setEggClicks((value) => {
      const nextValue = value + 1;
      if (nextValue >= 5) setEggVisible(true);
      return nextValue >= 5 ? 0 : nextValue;
    });
  };
  const changeMood = useCallback((nextMood: string) => setMood(nextMood), []);

  if (!ready) return <div className="preload-screen" aria-hidden="true" />;
  if (passwordRequired && !unlocked) return <><AmbientBackground mood="forest" /><PasswordGate onUnlock={unlock} /></>;
  if (!data) return null;
  return (
    <div className={`letter-experience stage-${stage}`} data-mood={mood}>
      <AmbientBackground mood={mood} />
      {stage === "opening" || stage === "leaving" ? <OpeningScene closing={stage === "leaving"} onOpen={open} onTitleClick={clickTitle} /> : null}
      {stage === "reader" ? <LetterReader data={data} onNext={next} onMoodChange={changeMood} /> : null}
      {stage === "ending" ? <EndingScene onBack={back} /> : null}
      <MusicToggle />
      <div className={`easter-egg ${eggVisible ? "is-visible" : ""}`} role="status" aria-live="polite">
        <span>你发现这里了。</span>
        <span>其实我也不知道该藏些什么。</span>
        <span>只是觉得，如果是你，也许会点到这里。</span>
      </div>
    </div>
  );
}
