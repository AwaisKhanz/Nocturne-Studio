"use client";

import { useEffect, useRef } from "react";

export type BackgroundFxMode = "snow" | "ember" | "stars" | "rain";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
};

function createParticle(width: number, height: number, mode: BackgroundFxMode): Particle {
  const base =
    mode === "snow" ? 0.55 : mode === "stars" ? 0.3 : mode === "rain" ? 0.45 : 0.6;
  const r =
    mode === "snow"
      ? Math.random() * 2.2 + 0.8
      : mode === "stars"
        ? Math.random() * 1.6 + 0.4
        : mode === "rain"
          ? Math.random() * 1 + 0.6
          : Math.random() * 2 + 0.4;
  const speed =
    mode === "snow"
      ? Math.random() * 0.6 + 0.3
      : mode === "rain"
        ? Math.random() * 1.2 + 1.4
        : mode === "stars"
          ? Math.random() * 0.15 + 0.05
          : Math.random() * 0.4 + 0.1;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    r,
    vx:
      mode === "snow"
        ? (Math.random() - 0.5) * 0.35
        : mode === "rain"
          ? (Math.random() - 0.5) * 0.2
          : mode === "stars"
            ? (Math.random() - 0.5) * 0.05
            : (Math.random() - 0.5) * 0.2,
    vy:
      mode === "snow"
        ? speed
        : mode === "rain"
          ? speed
          : mode === "stars"
            ? speed
            : -speed,
    alpha: base + Math.random() * 0.5,
  };
}

export function BackgroundFx({
  active,
  mode,
  theme,
}: {
  active: boolean;
  mode: BackgroundFxMode;
  theme: "light" | "dark";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density =
        mode === "snow"
          ? 0.0002
          : mode === "stars"
            ? 0.00008
            : mode === "rain"
              ? 0.00018
              : 0.00008;
      const count = Math.max(40, Math.min(200, Math.floor(width * height * density)));
      particles = Array.from({ length: count }, () => createParticle(width, height, mode));
    };

    const draw = () => {
      if (!active) return;
      ctx.clearRect(0, 0, width, height);

      const color =
        mode === "snow"
          ? theme === "dark"
            ? "255,255,255"
            : "40,48,60"
          : mode === "ember"
            ? theme === "dark"
              ? "255,140,64"
              : "120,90,60"
            : mode === "stars"
              ? theme === "dark"
                ? "216,226,255"
                : "45,55,72"
              : theme === "dark"
                ? "170,190,255"
                : "60,70,90";

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (mode === "ember") {
          if (p.y < -10) p.y = height + 10;
        } else {
          if (p.y > height + 10) p.y = -10;
        }
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width + 10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        if (mode === "rain") {
          ctx.fillRect(p.x, p.y, p.r * 0.6, p.r * 6);
        } else {
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    if (active) {
      frameId = window.requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [active, mode, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
