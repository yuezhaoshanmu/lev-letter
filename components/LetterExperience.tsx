"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LetterData } from "../lib/letter";
import AmbientBackground from "./AmbientBackground";
import BookOpening from "./BookOpening";
import EndingBuffer from "./EndingBuffer";
import FutureLetter from "./FutureLetter";
import LetterReader from "./LetterReader";
import MusicInvitation from "./MusicInvitation";
import MusicToggle from "./MusicToggle";
import OpeningScene from "./OpeningScene";
import PasswordGate from "./PasswordGate";
import UnlockRitual from "./UnlockRitual";
import { useMusic } from "./AudioProvider";

type Stage = "ritual" | "book-opening" | "opening" | "leaving" | "reader" | "buffer" | "future-letter";
type LetterExperienceProps = { data: LetterData | null; passwordRequired: boolean; initialUnlocked?: boolean };

export default function LetterExperience({ data, passwordRequired, initialUnlocked = false }: LetterExperienceProps) {
  const unlocked = !passwordRequired || initialUnlocked;
  const [hasLetterAccess, setHasLetterAccess] = useState(unlocked);
  const [ready, setReady] = useState(true);
  const [stage, setStage] = useState<Stage>("opening");
  const [mood, setMood] = useState("forest");
  const [eggClicks, setEggClicks] = useState(0);
  const [eggVisible, setEggVisible] = useState(false);
  const [musicInvitationVisible, setMusicInvitationVisible] = useState(false);
  const { isPlaying, resumeMusic, cancelPreparedPlayback } = useMusic();
  const router = useRouter();

  const unlock = (role: "letter" | "admin") => {
    if (role === "admin") window.location.assign("/admin");
    if (role === "letter") {
      setHasLetterAccess(true);
      try {
        const choice = window.localStorage.getItem("musicChoice");
        const hasChoice = choice === "played" || choice === "skipped";
        setStage(hasChoice ? "book-opening" : "ritual");
        if (!hasChoice) window.sessionStorage.setItem("music_invitation_pending", "true");
      } catch {
        setStage("ritual");
      }
    }
  };
  const openSound = async () => {
    const started = await resumeMusic();
    if (started) {
      try {
        window.localStorage.setItem("musicChoice", "played");
        window.localStorage.setItem("music_enabled", "true");
        window.sessionStorage.removeItem("music_invitation_pending");
      } catch {
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 700));
      router.refresh();
      setStage("book-opening");
    }
  };
  const skipSound = () => {
    cancelPreparedPlayback();
    try {
      window.localStorage.setItem("musicChoice", "skipped");
      window.sessionStorage.removeItem("music_invitation_pending");
    } catch {
    }
    setMusicInvitationVisible(false);
    setStage("book-opening");
  };
  const finishBookOpening = useCallback(() => setStage("opening"), []);
  const open = () => {
    setStage("leaving");
    window.setTimeout(() => {
      setStage("reader");
      window.setTimeout(() => document.getElementById("letter")?.scrollIntoView({ behavior: "smooth" }), 80);
    }, 1100);
  };
  const next = () => {
    setStage("buffer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const continueToChoice = () => {
    setStage("future-letter");
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
  const gate = passwordRequired && !hasLetterAccess;

  useEffect(() => {
    if (gate || stage === "ritual" || stage === "book-opening" || typeof window === "undefined") return;
    try {
      const choice = window.localStorage.getItem("musicChoice");
      const pending = window.sessionStorage.getItem("music_invitation_pending") === "true";
      if (isPlaying) {
        window.localStorage.setItem("musicChoice", "played");
        window.localStorage.setItem("music_enabled", "true");
        window.sessionStorage.removeItem("music_invitation_pending");
        setMusicInvitationVisible(false);
      } else if (choice === "played" || choice === "skipped") {
        window.sessionStorage.removeItem("music_invitation_pending");
        setMusicInvitationVisible(false);
      } else if (pending) {
        setMusicInvitationVisible(true);
      }
    } catch {
    }
  }, [gate, isPlaying, stage]);

  if (!ready) return <div className="preload-screen" aria-hidden="true" />;
  if (!gate && !data && stage !== "ritual" && stage !== "book-opening") return null;
  return (
    <>
      {gate ? <><AmbientBackground mood="forest" /><PasswordGate onUnlock={unlock} /></> : <div className={`letter-experience stage-${stage}`} data-mood={mood}>
        <AmbientBackground mood={mood} />
        {stage === "ritual" ? <UnlockRitual onOpenSound={openSound} onSkipSound={skipSound} /> : null}
        {stage === "book-opening" ? <BookOpening onComplete={finishBookOpening} /> : null}
        {stage === "opening" || stage === "leaving" ? <OpeningScene closing={stage === "leaving"} onOpen={open} onTitleClick={clickTitle} /> : null}
        {stage === "reader" && data ? <LetterReader data={data} onNext={next} onMoodChange={changeMood} /> : null}
        {stage === "buffer" ? <EndingBuffer onContinue={continueToChoice} /> : null}
        {stage === "future-letter" ? <FutureLetter onBack={back} /> : null}
      </div>}
      <MusicToggle visible={!gate && stage !== "ritual" && stage !== "book-opening"} />
      <MusicInvitation visible={!gate && stage !== "ritual" && stage !== "book-opening" && musicInvitationVisible} onClose={() => setMusicInvitationVisible(false)} />
      {!gate ? <div className={`easter-egg ${eggVisible ? "is-visible" : ""}`} role="status" aria-live="polite">
        <span>你发现这里了。</span>
        <span>其实我也不知道该藏些什么。</span>
        <span>只是觉得，如果是你，也许会点到这里。</span>
      </div> : null}
    </>
  );
}
