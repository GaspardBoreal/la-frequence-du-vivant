import React from 'react';
import { Hand, MousePointerClick, Timer, X } from 'lucide-react';

/**
 * « Premiers pas » — le liseré qui n'apparaît que tant qu'aucune espèce n'est
 * posée. Trois repères, puis il s'efface : le Scénographe n'a pas besoin de
 * mode d'emploi une fois la première plante en terre.
 */
export const PremiersPas: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="pointer-events-auto absolute left-1/2 top-3 z-[1001] w-[min(560px,92vw)] -translate-x-1/2 rounded-2xl border border-[#c8a24a]/50 bg-[hsl(var(--ds-forest-deep))]/92 p-3 text-white shadow-2xl backdrop-blur">
    <div className="flex items-start gap-2">
      <p className="flex-1 text-[10px] uppercase tracking-[0.2em] opacity-60">
        Premiers pas · composer l’après
      </p>
      <button
        onClick={onDismiss}
        aria-label="Masquer l’aide"
        className="opacity-50 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
    <ol className="mt-2 grid gap-2 sm:grid-cols-3">
      {[
        {
          icon: <Hand className="h-3.5 w-3.5" />,
          t: 'Choisir dans l’Herbier',
          d: 'Colonne de gauche : cliquez une espèce, elle s’arme.',
        },
        {
          icon: <MousePointerClick className="h-3.5 w-3.5" />,
          t: 'Cliquer la carte',
          d: 'Chaque clic pose un sujet dans l’emprise de l’ouvrage.',
        },
        {
          icon: <Timer className="h-3.5 w-3.5" />,
          t: 'Faire grandir',
          d: 'La frise An 0 / 3 / 10 montre le massif en devenir.',
        },
      ].map((s, i) => (
        <li key={s.t} className="rounded-xl border border-white/12 bg-black/25 p-2">
          <p className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] opacity-55">
            {s.icon} {i + 1}
          </p>
          <p className="mt-0.5 text-[12px] font-semibold">{s.t}</p>
          <p className="text-[10.5px] leading-snug opacity-70">{s.d}</p>
        </li>
      ))}
    </ol>
  </div>
);

export default PremiersPas;
