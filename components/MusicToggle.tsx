"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/music/background.mp3", { method: "HEAD" })
      .then((response) => mounted && setAvailable(response.ok))
      .catch(() => mounted && setAvailable(false));
    return () => { mounted = false; };
  }, []);

  const fadeTo = (target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const start = audio.volume;
    const started = performance.now();
    const step = (time: number) => {
      const progress = Math.min((time - started) / 1200, 1);
      audio.volume = start + (target - start) * progress;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      fadeTo(0);
      window.setTimeout(() => audio.pause(), 1250);
      setPlaying(false);
      return;
    }
    audio.volume = 0;
    try {
      await audio.play();
      fadeTo(0.2);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  if (!available) return null;
  return (
    <>
      <audio ref={audioRef} src="/music/background.mp3" loop preload="none" onError={() => setAvailable(false)} />
      <button className="music-toggle" type="button" onClick={toggle} aria-label={playing ? "暂停音乐" : "播放音乐"} title={playing ? "暂停音乐" : "播放音乐"}>
        {playing ? <Volume2 size={15} strokeWidth={1.3} /> : <VolumeX size={15} strokeWidth={1.3} />}
      </button>
    </>
  );
}
