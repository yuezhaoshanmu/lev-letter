"use client";

import { useMusic } from "./AudioProvider";

type MusicToggleProps = { visible?: boolean };

export default function MusicToggle({ visible = true }: MusicToggleProps) {
  const { isAvailable, isPlaying, isLoading, pauseMusic, resumeMusic } = useMusic();
  if (!isAvailable || !visible) return null;
  const toggle = () => (isPlaying ? pauseMusic() : resumeMusic());

  return (
    <button className={`music-toggle${isPlaying ? " is-playing" : ""}${isLoading ? " is-loading" : ""}`} type="button" onClick={toggle} aria-label={isPlaying ? "暂停这一页的声音" : "打开这一页的声音"} title={isPlaying ? "暂停这一页的声音" : "打开这一页的声音"} aria-pressed={isPlaying} disabled={isLoading}>
      <span className="music-symbol" aria-hidden="true">{isPlaying ? "♫" : "♪"}</span>
    </button>
  );
}
