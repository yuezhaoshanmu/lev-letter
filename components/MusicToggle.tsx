"use client";

import { useMusic } from "./AudioProvider";
import { useEffect, useRef, useState } from "react";
import Butterfly from "./Butterfly";

type MusicToggleProps = { visible?: boolean; onLongPress?: () => void };

export default function MusicToggle({ visible = true, onLongPress }: MusicToggleProps) {
  const { isAvailable, isPlaying, isLoading, pauseMusic, resumeMusic } = useMusic();
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const toggle = () => (isPlaying ? pauseMusic() : resumeMusic());
  const clearPress = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setPressing(false);
  };
  const beginPress = () => {
    if (isLoading || typeof onLongPress !== "function") return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setPressing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      setPressing(false);
      onLongPress();
    }, 3000);
  };
  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    toggle();
  };
  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  if (!isAvailable || !visible) return null;

  return (
    <button className={`music-toggle${isPlaying ? " is-playing" : ""}${isLoading ? " is-loading" : ""}${pressing ? " is-pressing" : ""}`} type="button" onClick={handleClick} onPointerDown={beginPress} onPointerUp={clearPress} onPointerCancel={clearPress} onPointerLeave={clearPress} aria-label={isPlaying ? "暂停这一页的声音" : "打开这一页的声音"} title={isPlaying ? "暂停这一页的声音" : "打开这一页的声音"} aria-pressed={isPlaying} disabled={isLoading}>
      <span className="music-symbol" aria-hidden="true">{isPlaying ? "♫" : "♪"}</span>
      {pressing ? <Butterfly className="music-egg-butterfly" variant="green" /> : null}
    </button>
  );
}
