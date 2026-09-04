"use client";

import { useState } from "react";
import { useMusic } from "./AudioProvider";

type MusicInvitationProps = { visible: boolean; onClose: () => void };

export default function MusicInvitation({ visible, onClose }: MusicInvitationProps) {
  const { isAvailable, isPlaying, isLoading, resumeMusic, cancelPreparedPlayback } = useMusic();
  const [opening, setOpening] = useState(false);

  if (!visible || !isAvailable) return null;

  const openSound = async () => {
    if (opening || isLoading) return;
    setOpening(true);
    const started = isPlaying || await resumeMusic();
    if (started) {
      try {
        window.localStorage.setItem("musicChoice", "played");
        window.localStorage.setItem("music_enabled", "true");
        window.sessionStorage.removeItem("music_invitation_pending");
      } catch {
      }
      onClose();
    }
    setOpening(false);
  };
  const skipSound = () => {
    cancelPreparedPlayback();
    try {
      window.localStorage.setItem("musicChoice", "skipped");
      window.sessionStorage.removeItem("music_invitation_pending");
    } catch {
    }
    onClose();
    window.requestAnimationFrame(() => {
      const nextSection = document.getElementById("letter");
      if (nextSection) nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    });
  };

  return (
    <aside className="music-invitation" aria-live="polite">
      <p className="music-invitation-title">如果这封信有一个声音，<br />我希望它是这一首。</p>
      <p className="music-invitation-subtitle">你可以听听，也可以继续往下看。</p>
      <div className="music-choice-actions">
        <button className="music-choice-primary" type="button" onClick={openSound} disabled={opening || isLoading}><span>{opening || isLoading ? "正在播放 ♪" : "听听这首歌"}</span></button>
        <button className="music-choice-secondary" type="button" onClick={skipSound} disabled={opening || isLoading}>先不用，我继续看看</button>
      </div>
    </aside>
  );
}
