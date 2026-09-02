"use client";

import { useEffect, useRef } from "react";

type AmbientBackgroundProps = { mood: string };

type Particle = { x: number; y: number; radius: number; speed: number; drift: number; phase: number; alpha: number };

export default function AmbientBackground({ mood }: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas || !field) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const particles: Particle[] = [];
    const count = coarse ? 13 : 28;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!particles.length) {
        for (let index = 0; index < count; index += 1) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 0.4 + Math.random() * 1.25,
            speed: 0.04 + Math.random() * 0.12,
            drift: 0.06 + Math.random() * 0.16,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.12 + Math.random() * 0.22,
          });
        }
      }
    };

    const paint = (time: number) => {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        const offset = reduced ? 0 : Math.sin(time * 0.00025 * particle.drift + particle.phase) * 5;
        context.beginPath();
        context.fillStyle = `rgba(164, 213, 202, ${particle.alpha})`;
        context.arc(particle.x + offset, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
        if (!reduced) {
          particle.y -= particle.speed;
          if (particle.y < -8) particle.y = height + 8;
        }
      }
      if (!reduced) frame = window.requestAnimationFrame(paint);
    };

    const move = (event: MouseEvent) => {
      if (coarse) return;
      field.style.setProperty("--cursor-x", `${event.clientX}px`);
      field.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    resize();
    paint(performance.now());
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <div ref={fieldRef} className="ambient-field" data-mood={mood} aria-hidden="true">
      <div className="ambient-haze ambient-haze-one" />
      <div className="ambient-haze ambient-haze-two" />
      <canvas ref={canvasRef} className="ambient-particles" />
      <div className="ambient-cursor" />
      <div className="ambient-ridge" />
    </div>
  );
}
