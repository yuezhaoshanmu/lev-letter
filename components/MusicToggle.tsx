"use client";

import { Music2 } from "lucide-react";
import { useMusic } from "./AudioProvider";

type MusicToggleProps = { visible?: boolean };

export default function MusicToggle({ visible = true }: MusicToggleProps) {
  const { isAvailable, isPlaying, isLoading, pauseMusic, resumeMusic } = useMusic();
  if (!isAvailable || !visible) return null;
  const toggle = () => (isPlaying ? pauseMusic() : resumeMusic());

  return (
    <button className={`music-toggle${isPlaying ? " is-playing" : ""}${isLoading ? " is-loading" : ""}`} type="button" onClick={toggle} aria-label={isPlaying ? "暂停背景音乐" : "播放背景音乐"} title={isPlaying ? "暂停背景音乐" : "播放背景音乐"} aria-pressed={isPlaying} disabled={isLoading}>
      <Music2 size={15} strokeWidth={1.3} aria-hidden="true" />
    </button>
  );
}
