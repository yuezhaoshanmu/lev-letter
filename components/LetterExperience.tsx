"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LetterData } from "../lib/letter";
import AmbientBackground from "./AmbientBackground";
import Butterfly from "./Butterfly";
import EndingBuffer from "./EndingBuffer";
import FutureLetter from "./FutureLetter";
import HiddenLetter from "./HiddenLetter";
import LetterReader from "./LetterReader";
import MusicInvitation from "./MusicInvitation";
import MusicToggle from "./MusicToggle";
import NameReveal from "./NameReveal";
import PasswordGate from "./PasswordGate";
import UnlockRitual from "./UnlockRitual";
import { useMusic } from "./AudioProvider";
import { trackVisitor } from "./VisitorTracker";

type Stage = "ritual" | "name-reveal" | "leaving" | "reader" | "buffer" | "future-letter" | "hidden-letter";
type LetterExperienceProps = { data: LetterData | null; passwordRequired: boolean; initialUnlocked?: boolean };

export default function LetterExperience({ data, passwordRequired, initialUnlocked = false }: LetterExperienceProps) {
  const unlocked = !passwordRequired || initialUnlocked;
  const [hasLetterAccess, setHasLetterAccess] = useState(unlocked);
  const [ready, setReady] = useState(true);
  const [stage, setStage] = useState<Stage>("ritual");
  const [mood, setMood] = useState("forest");
  const [eggClicks, setEggClicks] = useState(0);
  const [eggVisible, setEggVisible] = useState(false);
  const [musicInvitationVisible, setMusicInvitationVisible] = useState(false);
  const [hiddenLetterOpening, setHiddenLetterOpening] = useState(false);
  const [hiddenLetterClosing, setHiddenLetterClosing] = useState(false);
  const hiddenLetterReturnPositionRef = useRef(0);
  const { isPlaying, resumeMusic, cancelPreparedPlayback } = useMusic();
  const router = useRouter();

  const unlock = (role: "letter" | "admin") => {
    if (role === "admin") window.location.assign("/admin");
    if (role === "letter") {
      setHasLetterAccess(true);
      setStage("ritual");
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
      setStage("name-reveal");
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
    setStage("name-reveal");
  };
  const finishMusicInvitation = useCallback(() => setStage("name-reveal"), []);
  const finishNameReveal = () => {
    setStage("leaving");
    window.setTimeout(() => {
      setStage("reader");
      window.setTimeout(() => document.getElementById("letter")?.scrollIntoView({ behavior: "smooth" }), 40);
    }, 350);
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
  const openHiddenLetter = useCallback(() => {
    hiddenLetterReturnPositionRef.current = window.scrollY;
    try {
      window.sessionStorage.setItem("hiddenLetterReturnPosition", String(window.scrollY));
    } catch {
    }
    setHiddenLetterOpening(true);
    window.setTimeout(() => {
      setHiddenLetterOpening(false);
      setStage("hidden-letter");
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 700);
  }, []);
  const returnToMainLetter = useCallback(() => {
    let returnPosition = hiddenLetterReturnPositionRef.current;
    try {
      const storedPosition = Number(window.sessionStorage.getItem("hiddenLetterReturnPosition"));
      if (Number.isFinite(storedPosition) && storedPosition >= 0) returnPosition = storedPosition;
    } catch {
    }
    trackVisitor("hidden_letter_close", {
      source: "hidden_letter",
      action: "return_main_letter",
    }, "/hidden-letter");
    setHiddenLetterClosing(true);
    window.setTimeout(() => {
      setHiddenLetterClosing(false);
      setStage("reader");
      window.setTimeout(() => window.scrollTo({ top: returnPosition, behavior: "smooth" }), 50);
    }, 700);
  }, []);
  const gate = passwordRequired && !hasLetterAccess;

  useEffect(() => {
    if (gate || stage === "ritual" || typeof window === "undefined") return;
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
  if (!gate && !data && stage !== "ritual") return null;
  return (
    <>
      {gate ? <><AmbientBackground mood="forest" /><PasswordGate onUnlock={unlock} /></> : <div className={`letter-experience stage-${stage}`} data-mood={mood}>
        <AmbientBackground mood={mood} />
        {stage === "ritual" ? <UnlockRitual onOpenSound={openSound} onSkipSound={skipSound} /> : null}
        {stage === "name-reveal" ? <NameReveal onComplete={finishNameReveal} /> : null}
        {stage === "reader" && data ? <LetterReader data={data} onNext={next} onMoodChange={changeMood} /> : null}
        {stage === "buffer" ? <EndingBuffer onContinue={continueToChoice} /> : null}
        {stage === "future-letter" ? <FutureLetter onBack={back} /> : null}
        {stage === "hidden-letter" ? <HiddenLetter onReturnToLetter={returnToMainLetter} /> : null}
      </div>}
      <MusicToggle visible={!gate && stage !== "ritual" && stage !== "hidden-letter"} onLongPress={openHiddenLetter} />
      {hiddenLetterOpening ? <div className="hidden-letter-opening" aria-hidden="true"><div className="hidden-letter-opening-moon" /><Butterfly className="hidden-letter-opening-butterfly" variant="green" /></div> : null}
      {hiddenLetterClosing ? <div className="hidden-letter-closing" aria-hidden="true"><div className="hidden-letter-closing-paper" /><Butterfly className="hidden-letter-closing-butterfly" variant="green" /></div> : null}
      <MusicInvitation visible={false} onClose={finishMusicInvitation} />
      {!gate ? <div className={`easter-egg ${eggVisible ? "is-visible" : ""}`} role="status" aria-live="polite">
        <span>你发现这里了。</span>
        <span>其实我也不知道该藏些什么。</span>
        <span>只是觉得，如果是你，也许会点到这里。</span>
      </div> : null}
    </>
  );
}
