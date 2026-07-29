import React from 'react';
import { AlertTriangle, Sparkles, Wand2 } from 'lucide-react';
import {
  TEINTES,
  MOIS,
  MOIS_LONG,
  harmonieOf,
  nuancierName,
  dissonancesOf,
  hasNeutre,
  complementaireOf,
  labelOf,
  hexOf,
} from '@/lib/nuancierKb';

interface Props {
  teintes: string[];
  floraison: number[];
  onChange: (patch: { teintes?: string[]; floraison?: number[] }) => void;
  onApplyName?: (name: string) => void;
  readOnly?: boolean;
}

const MAX_TEINTES = 5;

/**
 * Nuancier d'un massif : roue de teintes horticoles + frise de floraison.
 * Le TYPE de massif (monochrome / camaïeu / bicolore / polychrome) se déduit
 * tout seul des teintes retenues — l'utilisateur compose, le studio nomme.
 */
export const NuancierPicker: React.FC<Props> = ({
  teintes,
  floraison,
  onChange,
  onApplyName,
  readOnly,
}) => {
  const harmonie = harmonieOf(teintes);
  const dissonances = dissonancesOf(teintes);
  const complement = teintes.length === 1 ? complementaireOf(teintes[0]) : null;
  const nom = nuancierName(teintes);
  const neutre = hasNeutre(teintes);

  const toggleTeinte = (k: string) => {
    if (readOnly) return;
    const has = teintes.includes(k);
    if (!has && teintes.length >= MAX_TEINTES) return;
    onChange({ teintes: has ? teintes.filter((x) => x !== k) : [...teintes, k] });
  };

  const toggleMois = (m: number) => {
    if (readOnly) return;
    onChange({
      floraison: floraison.includes(m)
        ? floraison.filter((x) => x !== m)
        : [...floraison, m].sort((a, b) => a - b),
    });
  };

  const gradient = teintes.length
    ? `linear-gradient(100deg, ${teintes.map(hexOf).join(', ')})`
    : 'linear-gradient(100deg, #e6e1d4, #d5cfc0)';

  return (
    <div className="space-y-2.5 rounded-lg border border-[hsl(var(--ds-line))]/70 bg-white/45 p-2.5">
      {/* Bandeau vivant : le nuancier composé, lu comme un aplat */}
      <div className="overflow-hidden rounded-md border border-[hsl(var(--ds-line))]/60">
        <div className="h-8 w-full" style={{ background: gradient }} />
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{nom}</span>
          {onApplyName && !readOnly && teintes.length > 0 && (
            <button
              onClick={() => onApplyName(nom)}
              title="Nommer l’objet ainsi"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2 py-0.5 text-[9px] hover:border-[hsl(var(--ds-forest))]/60"
            >
              <Wand2 className="h-2.5 w-2.5" /> Nommer
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] leading-snug opacity-70">{harmonie.principe}</p>

      {/* Roue de teintes */}
      <div>
        <span className="mb-1 block text-[10px] uppercase tracking-wider opacity-55">
          Teintes ({teintes.length}/{MAX_TEINTES})
        </span>
        <div className="flex flex-wrap gap-1">
          {TEINTES.map((t) => {
            const on = teintes.includes(t.key);
            const rank = teintes.indexOf(t.key) + 1;
            return (
              <button
                key={t.key}
                onClick={() => toggleTeinte(t.key)}
                disabled={readOnly}
                title={`${t.label} — ${t.lecture}`}
                className={`relative flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] transition-all ${
                  on
                    ? 'border-[hsl(var(--ds-forest-deep))] font-semibold shadow-sm'
                    : 'border-[hsl(var(--ds-line))]/70 opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: t.hex }}
                />
                {t.label}
                {on && (
                  <span className="ml-0.5 rounded-full bg-[hsl(var(--ds-forest-deep))]/85 px-1 text-[8px] text-[hsl(var(--ds-cream))]">
                    {rank}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conseil de composition */}
      {teintes.length > 0 && (
        <p className="rounded-md bg-[hsl(var(--ds-forest))]/8 px-2 py-1.5 text-[10px] leading-snug">
          <Sparkles className="mr-1 inline h-2.5 w-2.5 opacity-70" />
          {harmonie.conseil}
        </p>
      )}

      {/* Suggestion complémentaire */}
      {complement && !readOnly && (
        <button
          onClick={() => toggleTeinte(complement.key)}
          className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-[hsl(var(--ds-line))] px-2 py-1 text-left text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full border border-black/10"
            style={{ backgroundColor: complement.hex }}
          />
          Complémentaire de {labelOf(teintes[0]).toLowerCase()} : ajouter{' '}
          {complement.label.toLowerCase()} pour un bicolore vibrant
        </button>
      )}

      {/* Dissonances */}
      {dissonances.map((d) => (
        <div
          key={d.pair.join('-')}
          className="flex gap-1.5 rounded-md border border-amber-600/30 bg-amber-500/10 px-2 py-1.5 text-[10px] leading-snug"
        >
          <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0 text-amber-700" />
          <span>
            <strong className="font-semibold">{d.message}</strong> {d.remede}
          </span>
        </div>
      ))}

      {teintes.length >= 3 && !neutre && (
        <div className="flex gap-1.5 rounded-md border border-amber-600/25 bg-amber-500/8 px-2 py-1.5 text-[10px] leading-snug">
          <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0 text-amber-700" />
          <span>
            Aucune teinte apaisante : ajoutez du blanc, de l’argenté ou du vert pour que l’œil
            respire entre les couleurs.
          </span>
        </div>
      )}

      {/* Frise de floraison */}
      <div>
        <span className="mb-1 block text-[10px] uppercase tracking-wider opacity-55">
          Floraison attendue
        </span>
        <div className="flex gap-[3px]">
          {MOIS.map((m, i) => {
            const mois = i + 1;
            const on = floraison.includes(mois);
            return (
              <button
                key={mois}
                onClick={() => toggleMois(mois)}
                disabled={readOnly}
                title={MOIS_LONG[i]}
                className={`h-6 flex-1 rounded text-[9px] font-medium transition-all ${
                  on
                    ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                    : 'bg-[hsl(var(--ds-line))]/35 opacity-60 hover:opacity-100'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[9.5px] opacity-60">
          {floraison.length
            ? `${floraison.length} mois de fleurs sur ce massif.`
            : 'Cochez les mois de floraison : le site en tire sa continuité florale.'}
        </p>
      </div>
    </div>
  );
};

export default NuancierPicker;
