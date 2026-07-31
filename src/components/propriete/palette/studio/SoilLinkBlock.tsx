import React from 'react';
import { Layers, Link2, Sparkles, AlertTriangle, Leaf } from 'lucide-react';
import type { SoilSample } from '@/hooks/propriete/usePropertySoil';
import {
  fmtDistance,
  linkedSampleIds,
  mergeSamples,
  ouvrageSoilAlerts,
  rankSamplesForGeometry,
  suggestSampleIds,
  withLinkedSamples,
} from '@/lib/soilLinkEngine';

interface Props {
  outilKey: string;
  geometry: any;
  meta: any;
  samples: SoilSample[];
  readOnly?: boolean;
  onChange: (meta: any) => void;
}

/**
 * « Ancrage au sol » : relie un ouvrage de l'Atelier aux prélèvements
 * de l'étape « J'analyse le sol », et en tire une lecture agronomique.
 */
export const SoilLinkBlock: React.FC<Props> = ({
  outilKey,
  geometry,
  meta,
  samples,
  readOnly,
  onChange,
}) => {
  const linked = linkedSampleIds(meta);
  const ranked = React.useMemo(
    () => rankSamplesForGeometry(geometry, samples),
    [geometry, samples],
  );
  const linkedSamples = React.useMemo(
    () => samples.filter((s) => linked.includes(s.id)),
    [samples, linked],
  );
  const merged = React.useMemo(() => mergeSamples(linkedSamples), [linkedSamples]);
  const alerts = React.useMemo(
    () => ouvrageSoilAlerts(outilKey, merged),
    [outilKey, merged],
  );

  const toggle = (id: string) =>
    onChange(
      withLinkedSamples(
        meta,
        linked.includes(id) ? linked.filter((x) => x !== id) : [...linked, id],
      ),
    );

  const suggested = React.useMemo(
    () => suggestSampleIds(geometry, samples),
    [geometry, samples],
  );
  const canSuggest =
    suggested.length > 0 && suggested.some((id) => !linked.includes(id));

  if (!ranked.length) {
    return (
      <div className="rounded-lg border border-dashed border-[hsl(var(--ds-line))] px-2.5 py-2 text-[10px] leading-relaxed opacity-60">
        <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider">
          <Layers className="h-3 w-3" /> Ancrage au sol
        </span>
        <p className="mt-1">
          Aucun prélèvement posé sur la carte. Placez vos carottes A, B, C… à l’étape
          « J’analyse le sol » pour ancrer cet ouvrage dans le terrain réel.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--ds-line))] bg-white/50 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <Layers className="h-3 w-3 text-[hsl(var(--ds-forest))]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
          Ancrage au sol
        </span>
        <span className="ml-auto text-[9.5px] opacity-55">
          {linked.length ? `${linked.length} prélèvement${linked.length > 1 ? 's' : ''}` : 'non relié'}
        </span>
      </div>

      {/* Prélèvements ordonnés par pertinence spatiale */}
      <div className="mt-2 space-y-1">
        {ranked.map(({ sample, inside, distanceM }) => {
          const on = linked.includes(sample.id);
          return (
            <button
              key={sample.id}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(sample.id)}
              className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                on
                  ? 'border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-gold))]/12'
                  : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50 hover:bg-[hsl(var(--ds-forest))]/5'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-serif text-[10px] font-bold ${
                  on
                    ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                    : 'bg-[hsl(var(--ds-forest))]/12'
                }`}
              >
                {sample.label}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10.5px] font-medium leading-tight">
                  {sample.location || `Prélèvement ${sample.label}`}
                </span>
                <span className="block text-[9px] leading-tight opacity-60">
                  {inside ? 'dans l’emprise de l’ouvrage' : `à ${fmtDistance(distanceM)}`}
                </span>
              </span>
              {on && <Link2 className="h-3 w-3 shrink-0 text-[hsl(var(--ds-gold))]" />}
            </button>
          );
        })}
      </div>

      {!readOnly && canSuggest && (
        <button
          type="button"
          onClick={() => onChange(withLinkedSamples(meta, [...linked, ...suggested]))}
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full border border-[hsl(var(--ds-forest))]/40 py-1 text-[10px] hover:bg-[hsl(var(--ds-forest))]/8"
        >
          <Sparkles className="h-3 w-3" /> Rattacher le prélèvement pertinent
        </button>
      )}

      {/* Lecture fusionnée */}
      {merged.hasData && (
        <p className="mt-2 border-t border-[hsl(var(--ds-line))]/60 pt-2 font-serif text-[11px] italic leading-snug text-[hsl(var(--ds-forest-deep))]">
          <Leaf className="mr-1 inline h-3 w-3 opacity-60" />
          {merged.sentence}
        </p>
      )}

      {/* Contraintes ouvrage ↔ sol */}
      {alerts.map((a) => (
        <div
          key={a.title}
          className={`mt-1.5 rounded-md border px-2 py-1.5 text-[9.5px] leading-relaxed ${
            a.tone === 'alerte'
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-forest))]/8'
          }`}
        >
          <span className="flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider">
            {a.tone === 'alerte' ? (
              <AlertTriangle className="h-2.5 w-2.5" />
            ) : (
              <Sparkles className="h-2.5 w-2.5" />
            )}
            {a.title}
          </span>
          <span className="mt-0.5 block opacity-80">{a.text}</span>
        </div>
      ))}
    </div>
  );
};

export default SoilLinkBlock;
