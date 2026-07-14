import React from 'react';
import { motion } from 'framer-motion';

export interface Gauge {
  label: string;
  value: number;    // 0..100 (or absolute display)
  display?: string; // custom display string
  color?: string;
  icon?: React.ReactNode;
}

interface Props {
  title: string;
  subtitle?: string;
  gauges: Gauge[];
  accent?: string;
  side?: 'left' | 'right';
}

const StratPanel: React.FC<Props> = ({ title, subtitle, gauges, accent = '#c9a24a', side = 'right' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'right' ? 60 : -60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-20%' }}
      transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
      className="relative z-30 rounded-[2rem] p-6 md:p-7 border border-white/15 bg-black/40 backdrop-blur-xl shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)] max-w-sm w-full"
      style={{ borderColor: `${accent}55` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: accent }}>
            {subtitle ?? 'Panneau vivant'}
          </div>
          <h3 className="mt-1 font-serif text-xl text-[#f4ecd4] leading-tight">{title}</h3>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${accent}22`, border: `1px solid ${accent}66` }}
        >
          <span className="text-lg" style={{ color: accent }}>✦</span>
        </div>
      </div>

      <div className="space-y-4">
        {gauges.map((g, i) => {
          const pct = Math.max(0, Math.min(100, g.value));
          const color = g.color ?? accent;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="flex items-center gap-2 text-[#f4ecd4]/90">
                  {g.icon && <span style={{ color }}>{g.icon}</span>}
                  {g.label}
                </span>
                <span className="font-mono text-[#f4ecd4]" style={{ color }}>
                  {g.display ?? `${Math.round(pct)}%`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.1 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default StratPanel;
