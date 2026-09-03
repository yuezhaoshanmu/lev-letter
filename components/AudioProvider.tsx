"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TARGET_VOLUME = 0.15;
const FADE_IN_MS = 2000;
const FADE_OUT_MS = 1000;

type MusicContextValue = {
  isAvailable: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  startForLetterUnlock: () => Promise<void>;
  confirmLetterUnlock: () => void;
  cancelPreparedPlayback: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within AudioProvider");
  return context;
}

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const shouldBePlayingRef = useRef(false);
  const preparedPlayRef = useRef<Promise<void> | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const stopFade = useCallback(() => {
    if (fadeFrameRef.current !== null) window.cancelAnimationFrame(fadeFrameRef.current);
    fadeFrameRef.current = null;
  }, []);

  const fadeTo = useCallback((target: number, duration: number, onComplete?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    stopFade();
    const start = audio.volume;
    const started = performance.now();
    const step = (time: number) => {
      const progress = Math.min((time - started) / duration, 1);
      audio.volume = start + (target - start) * progress;
      if (progress < 1) fadeFrameRef.current = window.requestAnimationFrame(step);
      else { fadeFrameRef.current = null; onComplete?.(); }
    };
    fadeFrameRef.current = window.requestAnimationFrame(step);
  }, [stopFade]);

  const beginFadeIn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    shouldBePlayingRef.current = true;
    setIsPlaying(true);
    setIsLoading(false);
    fadeTo(TARGET_VOLUME, FADE_IN_MS);
  }, [fadeTo]);

  const startForLetterUnlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve();
    stopFade();
    shouldBePlayingRef.current = false;
    audio.volume = 0;
    setIsLoading(true);
    if (process.env.NODE_ENV !== "production") console.debug("[music] gesture play requested");
    const playPromise = audio.play();
    preparedPlayRef.current = playPromise;
    playPromise.then(() => {
      if (process.env.NODE_ENV !== "production") console.debug("[music] play succeeded");
    }).catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") console.debug("[music] play blocked", error instanceof DOMException ? error.name : "unknown");
    });
    return playPromise.catch(() => undefined);
  }, [stopFade]);

  const confirmLetterUnlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    shouldBePlayingRef.current = true;
    const preparedPlay = preparedPlayRef.current;
    if (!audio.paused) {
      beginFadeIn();
    } else if (preparedPlay) {
      preparedPlay.then(() => {
        if (shouldBePlayingRef.current && !audio.paused) beginFadeIn();
      }).catch(() => {
        setIsLoading(false);
        shouldBePlayingRef.current = false;
      });
    } else {
      setIsLoading(false);
      shouldBePlayingRef.current = false;
    }
  }, [beginFadeIn]);

  const cancelPreparedPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    stopFade();
    shouldBePlayingRef.current = false;
    preparedPlayRef.current = null;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    setIsPlaying(false);
    setIsLoading(false);
  }, [stopFade]);

  const pauseMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    shouldBePlayingRef.current = false;
    setIsPlaying(false);
    fadeTo(0, FADE_OUT_MS, () => audio.pause());
  }, [fadeTo]);

  const resumeMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    stopFade();
    setIsLoading(true);
    audio.volume = 0;
    const playPromise = audio.play();
    preparedPlayRef.current = null;
    playPromise.then(beginFadeIn).catch(() => {
      setIsLoading(false);
      shouldBePlayingRef.current = false;
      setIsPlaying(false);
    });
  }, [beginFadeIn, stopFade]);

  useEffect(() => {
    fetch("/music/background.mp3", { method: "HEAD" })
      .then((response) => setIsAvailable(response.ok))
      .catch(() => setIsAvailable(false));
    return stopFade;
  }, [stopFade]);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) cancelPreparedPlayback();
  }, [cancelPreparedPlayback, pathname]);

  const value = useMemo(() => ({ isAvailable, isPlaying, isLoading, startForLetterUnlock, confirmLetterUnlock, cancelPreparedPlayback, pauseMusic, resumeMusic }), [isAvailable, isPlaying, isLoading, startForLetterUnlock, confirmLetterUnlock, cancelPreparedPlayback, pauseMusic, resumeMusic]);

  return <MusicContext.Provider value={value}>
    {children}
    <audio id="global-background-audio" ref={audioRef} src="/music/background.mp3" preload="metadata" loop onError={() => { setIsAvailable(false); setIsPlaying(false); shouldBePlayingRef.current = false; }} />
  </MusicContext.Provider>;
}
