import React from 'react';
import { ChevronDown, Minus, ThumbsDown, ThumbsUp } from 'lucide-react';
import SpeciesThumb from '@/components/species/SpeciesThumb';
import { useWaypointFrenchNames } from '@/hooks/propriete/useWaypointFrenchNames';
import type { SpeciesJuryResult, SpeciesVerdict } from '@/lib/chantierIcg';

const TONE = {
  up: '#4f8a5b',
  down: '#b4553f',
  flat: '#8b8578',
} as const;

const VerdictLine: React.FC<{
  v: SpeciesVerdict;
  frName: string;
  onFocus?: (v: SpeciesVerdict) => void;
}> = ({ v, frName, onFocus }) => (
  <li>
    <button
      type="button"
      onClick={() => onFocus?.(v)}
      className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition hover:border-white/25 hover:bg-white/[0.05]"
    >
      <SpeciesThumb
        scientificName={v.scientificName}
        commonName={frName}
        localPhoto={v.photoUrl}
        size="sm"
        showInatBadge={false}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold">{frName}</span>
        <span className="block truncate text-[10.5px] italic opacity-55">
          {v.scientificName}
        </span>
        {v.poles.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {v.poles.map((p) => (
              <span
                key={p.key}
                className="rounded-full border border-current/20 px-1.5 py-[1px] text-[9.5px] opacity-70"
              >
                {p.short}
                <span className="opacity-50"> ·{p.intensity}</span>
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span
          className="block text-[14px] font-semibold tabular-nums"
          style={{ color: TONE[v.direction] }}
        >
          {v.deltaIcg > 0 ? `+${v.deltaIcg}` : v.deltaIcg === 0 ? '—' : v.deltaIcg}
        </span>
        <span className="block text-[9.5px] opacity-45">pts ICG</span>
      </span>
    </button>
  </li>
);

const Column: React.FC<{
  title: string;
  icon: React.ReactNode;
  tone: string;
  items: SpeciesVerdict[];
  nameFor: (v: SpeciesVerdict) => string;
  empty: string;
  onFocus?: (v: SpeciesVerdict) => void;
}> = ({ title, icon, tone, items, nameFor, empty, onFocus }) => (
  <div
    className="rounded-2xl border p-2.5"
    style={{ borderColor: `${tone}55`, background: `${tone}0f` }}
  >
    <p
      className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]"
      style={{ color: tone }}
    >
      {icon} {title} · {items.length}
    </p>
    {items.length === 0 ? (
      <p className="px-1 py-3 text-[11.5px] italic opacity-55">{empty}</p>
    ) : (
      <ul className="space-y-1.5">
        {items.map((v) => (
          <VerdictLine key={v.plantId} v={v} frName={nameFor(v)} onFocus={onFocus} />
        ))}
      </ul>
    )}
  </div>
);

/**
 * « Le jury des espèces » — qui fait monter le score, qui le fait descendre.
 * Chaque contribution est obtenue par retrait à un sur le barème D.S. :
 * on rejoue l'ICG sans l'espèce, l'écart est sa part de responsabilité.
 */
export const SpeciesJury: React.FC<{
  jury: SpeciesJuryResult;
  title?: string;
  onFocus?: (v: SpeciesVerdict) => void;
}> = ({ jury, title = 'Le jury des espèces', onFocus }) => {
  const [showFlat, setShowFlat] = React.useState(false);
  const [showUnmatched, setShowUnmatched] = React.useState(false);

  const { displayNameFor } = useWaypointFrenchNames([
    ...jury.verdicts.map((v) => ({
      scientificName: v.scientificName,
      commonName: v.commonName,
    })),
    ...jury.unmatched,
  ]);

  const nameFor = React.useCallback(
    (v: SpeciesVerdict) =>
      displayNameFor({ scientificName: v.scientificName, commonName: v.commonName }) ||
      v.plantName,
    [displayNameFor],
  );

  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] opacity-55">{title}</p>
      <p className="mt-1 text-[12.5px] italic opacity-85">{jury.sentence}</p>
      <p className="mt-0.5 text-[10.5px] opacity-45">
        Méthode : l'ICG est recalculé sans l'espèce ; l'écart obtenu est sa contribution.
      </p>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <Column
          title="Elles confirment la lecture du sol"
          icon={<ThumbsUp className="h-3 w-3" />}
          tone={TONE.up}
          items={jury.up}
          nameFor={nameFor}
          empty="Aucune espèce ne conforte la lecture du sol."
          onFocus={onFocus}
        />
        <Column
          title="Elles contredisent la lecture du sol"
          icon={<ThumbsDown className="h-3 w-3" />}
          tone={TONE.down}
          items={jury.down}
          nameFor={nameFor}
          empty="Aucune espèce ne tire le score vers le bas."
          onFocus={onFocus}
        />
      </div>

      {jury.flat.length > 0 && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setShowFlat((s) => !s)}
            className="inline-flex items-center gap-1.5 text-[11px] opacity-65 hover:opacity-100"
          >
            <Minus className="h-3 w-3" />
            {jury.flat.length} espèce{jury.flat.length > 1 ? 's' : ''} reconnue
            {jury.flat.length > 1 ? 's' : ''} sans effet sur le score
            <ChevronDown
              className={`h-3 w-3 transition ${showFlat ? 'rotate-180' : ''}`}
            />
          </button>
          {showFlat && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {jury.flat.map((v) => (
                <li
                  key={v.plantId}
                  className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] opacity-75"
                >
                  {nameFor(v)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {jury.unmatched.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowUnmatched((s) => !s)}
            className="inline-flex items-center gap-1.5 text-[11px] opacity-55 hover:opacity-100"
          >
            {jury.unmatched.length} espèce{jury.unmatched.length > 1 ? 's' : ''} observée
            {jury.unmatched.length > 1 ? 's' : ''} hors référentiel bio-indicateur — sans
            influence
            <ChevronDown
              className={`h-3 w-3 transition ${showUnmatched ? 'rotate-180' : ''}`}
            />
          </button>
          {showUnmatched && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {jury.unmatched.map((s) => (
                <li
                  key={s.scientificName}
                  className="rounded-full border border-dashed border-white/12 px-2.5 py-1 text-[11px] opacity-60"
                >
                  {displayNameFor(s)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default SpeciesJury;
