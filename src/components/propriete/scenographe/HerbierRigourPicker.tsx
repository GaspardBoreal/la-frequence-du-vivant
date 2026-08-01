import React from 'react';
import { Crosshair } from 'lucide-react';

export type Rigour = 'strict' | 'lisiere' | 'voisinage';

export interface RigourCounts {
  dedans: number;
  lisiere: number;
  voisinage: number;
}

interface Props {
  value: Rigour;
  onChange: (r: Rigour) => void;
  neighbourM: number;
  onNeighbourM: (m: number) => void;
  counts: RigourCounts;
}

const CRANS: Array<{ key: Rigour; label: string; hint: string }> = [
  { key: 'strict', label: 'Strict', hint: 'uniquement dans l’emprise dessinée' },
  { key: 'lisiere', label: 'Lisière +3 m', hint: 'collier de tolérance GPS autour du bord' },
  { key: 'voisinage', label: 'Voisinage', hint: 'ce qui pousse juste à côté de l’ouvrage' },
];

/**
 * Le curseur de rigueur : jusqu'où l'ouvrage « écoute » le vivant déjà présent.
 * Strict = la géométrie vraie, rien d'autre. On montre toujours ce qui est
 * écarté — un chiffre exclu en silence est un chiffre faux.
 */
export const HerbierRigourPicker: React.FC<Props> = ({
  value,
  onChange,
  neighbourM,
  onNeighbourM,
  counts,
}) => {
  const active = CRANS.find((c) => c.key === value)!;
  const kept =
    counts.dedans +
    (value !== 'strict' ? counts.lisiere : 0) +
    (value === 'voisinage' ? counts.voisinage : 0);

  return (
    <div className="space-y-1.5 rounded-lg border border-[hsl(var(--ds-line))] bg-white/55 p-1.5">
      <div className="flex items-center gap-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-60">
        <Crosshair className="h-3 w-3" />
        Rigueur du périmètre
        <span className="ml-auto tabular-nums opacity-80">{kept} retenues</span>
      </div>

      <div className="flex gap-0.5 rounded-full bg-[hsl(var(--ds-forest-deep))]/8 p-0.5">
        {CRANS.map((c) => (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            title={c.hint}
            className={`flex-1 rounded-full px-1.5 py-1 text-[9.5px] font-medium transition-colors ${
              value === c.key
                ? 'bg-[hsl(var(--ds-forest-deep))] text-white shadow-sm'
                : 'text-[hsl(var(--ds-forest-deep))]/70 hover:bg-white/70'
            }`}
          >
            {c.key === 'voisinage' ? `Voisinage +${neighbourM} m` : c.label}
          </button>
        ))}
      </div>

      {value === 'voisinage' && (
        <input
          type="range"
          min={1}
          max={15}
          step={1}
          value={neighbourM}
          onChange={(e) => onNeighbourM(Number(e.target.value))}
          className="w-full accent-[#c8a24a]"
          aria-label="Rayon de voisinage en mètres"
        />
      )}

      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded-full bg-[hsl(var(--ds-forest-deep))]/12 px-1.5 py-px text-[9px] font-medium text-[hsl(var(--ds-forest-deep))]">
          {counts.dedans} dedans
        </span>
        <span
          className={`rounded-full px-1.5 py-px text-[9px] font-medium transition-opacity ${
            value === 'strict' ? 'bg-white/70 opacity-45 line-through' : 'bg-[#c8a24a]/20 text-[#8a6b23]'
          }`}
        >
          {counts.lisiere} lisière
        </span>
        <span
          className={`rounded-full px-1.5 py-px text-[9px] font-medium transition-opacity ${
            value === 'voisinage' ? 'bg-[#3b7ea1]/18 text-[#2b5f7a]' : 'bg-white/70 opacity-45 line-through'
          }`}
        >
          {counts.voisinage} voisinage
        </span>
      </div>

      <p className="px-0.5 text-[9px] italic leading-snug opacity-50">{active.hint}</p>
    </div>
  );
};

export default HerbierRigourPicker;
