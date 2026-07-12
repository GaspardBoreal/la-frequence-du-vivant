import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';

const FILTERS: Record<Season, string> = {
  printemps: 'saturate(1.05) hue-rotate(-6deg) brightness(1.02)',
  ete: 'saturate(1.2) brightness(1.08) contrast(1.05)',
  automne: 'sepia(0.25) hue-rotate(-15deg) saturate(1.15)',
  hiver: 'saturate(0.55) brightness(1.05) contrast(0.95) hue-rotate(190deg)',
};

interface Props {
  season: Season;
  intensity?: number; // 0..1
}

interface Particle {
  x: number; y: number; vx: number; vy: number; r: number; a: number; drift: number;
}

const SeasonOverlay: React.FC<Props> = ({ season, intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduce) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const config: Record<Season, { count: number; color: string; size: [number, number]; vy: [number, number]; drift: number }> = {
      printemps: { count: 45, color: '#f6d16b', size: [1, 2.2], vy: [0.15, 0.5], drift: 0.6 },
      ete:       { count: 25, color: '#fff2a8', size: [1, 1.6], vy: [0.05, 0.2], drift: 0.3 },
      automne:   { count: 30, color: '#b7562a', size: [3, 6],   vy: [0.4, 1.1], drift: 1.2 },
      hiver:     { count: 60, color: '#eaf2ff', size: [1.5, 3], vy: [0.4, 1.0], drift: 0.8 },
    };
    const cfg = config[season];

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const particles: Particle[] = Array.from({ length: Math.round(cfg.count * intensity) }, () => ({
      x: rand(0, window.innerWidth),
      y: rand(-window.innerHeight, window.innerHeight),
      vx: 0,
      vy: rand(cfg.vy[0], cfg.vy[1]),
      r: rand(cfg.size[0], cfg.size[1]),
      a: rand(0.4, 0.9),
      drift: rand(-cfg.drift, cfg.drift),
    }));

    let t = 0;
    const tick = () => {
      t += 0.01;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.y += p.vy;
        p.x += Math.sin(t + p.y * 0.01) * p.drift * 0.3;
        if (p.y > window.innerHeight + 8) {
          p.y = -8;
          p.x = rand(0, window.innerWidth);
        }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = cfg.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [season, intensity, reduce]);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] transition-[backdrop-filter,filter] duration-1000"
        style={{ backdropFilter: FILTERS[season], WebkitBackdropFilter: FILTERS[season] }}
      />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[6]" />
    </>
  );
};

export default SeasonOverlay;
