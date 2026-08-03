import React from 'react';
import { Scale } from 'lucide-react';
import type { SpeciesVerdict } from '@/lib/chantierIcg';

const TONE = { up: '#4f8a5b', down: '#b4553f' } as const;

/**
 * « La balance du lot » — les contributions positives à droite, négatives à
 * gauche, empilées en segments larges de leur poids. Survoler un segment
 * surligne la ligne correspondante dans la liste du tri.
 */
export const CortegeBalance: React.FC<{
  up: SpeciesVerdict[];
  down: SpeciesVerdict[];
  sentence: string;
  nameFor: (v: SpeciesVerdict) => string;
  hovered?: string | null;
  onHover?: (plantId: string | null) => void;
  onSelect?: (v: SpeciesVerdict) => void;
}> = ({ up, down, sentence, nameFor, hovered, onHover, onSelect }) => {
  const sumUp = up.reduce((a, v) => a + Math.abs(v.deltaPoints), 0);
  const sumDown = down.reduce((a, v) => a + Math.abs(v.deltaPoints), 0);
  const total = sumUp + sumDown;
  if (!total) return null;

  const Side: React.FC<{ items: SpeciesVerdict[]; dir: 'up' | 'down' }> = ({ items, dir }) => (
    <span
      className="flex h-full"
      style={{
        width: `${((dir === 'up' ? sumUp : sumDown) / total) * 100}%`,
        justifyContent: dir === 'down' ? 'flex-end' : 'flex-start',
      }}
    >
      {(dir === 'down' ? [...items].reverse() : items).map((v) => (
        <button
          key={v.plantId}
          type="button"
          title={`${nameFor(v)} · ${v.deltaIcg > 0 ? '+' : ''}${v.deltaIcg} pts ICG`}
          onMouseEnter={() => onHover?.(v.plantId)}
          onMouseLeave={() => onHover?.(null)}
          onClick={() => onSelect?.(v)}
          className="h-full border-r border-black/25 last:border-r-0 transition"
          style={{
            width: `${(Math.abs(v.deltaPoints) / (dir === 'up' ? sumUp : sumDown)) * 100}%`,
            background: TONE[dir],
            opacity: hovered && hovered !== v.plantId ? 0.35 : 0.85,
          }}
        />
      ))}
    </span>
  );

  return (
    <div className="mb-2.5 rounded-xl border border-white/12 bg-white/[0.02] p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] opacity-50">
        <Scale className="h-3 w-3" /> La balance du lot
      </p>
      <div className="flex items-center gap-2">
        <span
          className="w-[54px] shrink-0 text-right text-[11px] font-semibold tabular-nums"
          style={{ color: TONE.down }}
        >
          −{sumDown}
        </span>
        <span className="flex h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <Side items={down} dir="down" />
          <Side items={up} dir="up" />
        </span>
        <span
          className="w-[54px] shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ color: TONE.up }}
        >
          +{sumUp}
        </span>
      </div>
      <p className="mt-1.5 text-[11.5px] italic opacity-75">{sentence}</p>
    </div>
  );
};

export default CortegeBalance;
