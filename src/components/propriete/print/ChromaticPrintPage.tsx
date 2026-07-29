import React from 'react';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import {
  MOIS,
  MOIS_LONG,
  floraisonOf,
  harmonieOf,
  hexOf,
  isChromaticTool,
  labelOf,
  lireFloraison,
  nuancierName,
  teintesOf,
} from '@/lib/nuancierKb';
import { fmtMeasure, measureFor } from '@/components/propriete/palette/studio/geoMetrics';

interface Props {
  objets: ProprieteObjet[];
  propertyName?: string;
}

export const chromaticMassifs = (objets: ProprieteObjet[]) =>
  objets.filter((o) => isChromaticTool(o.outil_key));

export const hasChromaticPage = (objets: ProprieteObjet[]) => chromaticMassifs(objets).length > 0;

/**
 * « Grammaire chromatique du jardin » — page A4 : nuancier de chaque massif,
 * harmonie retenue, et continuité florale du site mois par mois.
 */
export const ChromaticPrintPage: React.FC<Props> = ({ objets, propertyName }) => {
  const massifs = chromaticMassifs(objets);
  const lecture = lireFloraison(massifs.map((o) => floraisonOf(o.meta)));

  const teintesSite = React.useMemo(() => {
    const set = new Set<string>();
    for (const o of massifs) for (const t of teintesOf(o.meta)) set.add(t);
    return Array.from(set);
  }, [massifs]);

  if (!massifs.length) return null;

  return (
    <div className="print-exact space-y-4 text-[hsl(var(--ds-forest-deep))]">
      <header>
        <p className="text-[9px] uppercase tracking-[0.28em] opacity-55">
          {propertyName ?? 'Propriété'} · Palette végétale
        </p>
        <h3 className="font-serif text-[26px] leading-tight">Grammaire chromatique du jardin</h3>
        <p className="mt-1 max-w-[78%] text-[10.5px] italic leading-snug opacity-70">
          « Une couleur n’existe que quelques semaines par an : composer un jardin, c’est composer
          un calendrier autant qu’un tableau. »
        </p>
      </header>

      {/* Nuancier du site */}
      <section className="rounded-xl border border-[hsl(var(--ds-line))] bg-white/55 px-3 py-2.5 print-avoid-break">
        <p className="text-[9px] uppercase tracking-[0.18em] opacity-55">Nuancier du site</p>
        <div className="mt-1.5 flex h-6 overflow-hidden rounded-md border border-black/10">
          {teintesSite.map((t) => (
            <span key={t} className="flex-1" style={{ backgroundColor: hexOf(t) }} />
          ))}
        </div>
        <p className="mt-1 text-[9.5px] opacity-65">
          {teintesSite.map(labelOf).join(' · ')} — {massifs.length} massif
          {massifs.length > 1 ? 's' : ''} composé{massifs.length > 1 ? 's' : ''}.
        </p>
      </section>

      {/* Continuité florale */}
      <section className="rounded-xl border border-[hsl(var(--ds-line))] bg-white/55 px-3 py-2.5 print-avoid-break">
        <p className="text-[9px] uppercase tracking-[0.18em] opacity-55">Continuité florale</p>
        <div className="mt-1.5 flex gap-[3px]">
          {MOIS.map((m, i) => {
            const on = lecture.couverts.includes(i + 1);
            return (
              <span
                key={i}
                className="flex h-6 flex-1 items-center justify-center rounded text-[9px] print-exact"
                style={{
                  backgroundColor: on ? '#2f5d3a' : 'rgba(0,0,0,.07)',
                  color: on ? '#f6f3ea' : 'rgba(0,0,0,.45)',
                }}
              >
                {m}
              </span>
            );
          })}
        </div>
        <p className="mt-1.5 font-serif text-[13px] leading-snug">{lecture.phrase}</p>
        {lecture.creux.length > 0 && (
          <p className="mt-0.5 text-[9.5px] italic opacity-65">
            Piste : combler {MOIS_LONG[lecture.creux[0] - 1]} par un bulbe précoce ou une
            floraison tardive selon la saison manquante.
          </p>
        )}
      </section>

      {/* Massif par massif */}
      <section className="space-y-2">
        <p className="text-[9px] uppercase tracking-[0.18em] opacity-55">Massif par massif</p>
        {massifs.map((o) => {
          const tool = TOOL_BY_KEY[o.outil_key];
          const teintes = teintesOf(o.meta);
          const flo = floraisonOf(o.meta);
          const h = harmonieOf(teintes);
          return (
            <div
              key={o.id}
              className="rounded-xl border border-[hsl(var(--ds-line))] bg-white/55 px-3 py-2 print-avoid-break"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[13.5px]">{o.nom || nuancierName(teintes)}</span>
                <span className="text-[9px] uppercase tracking-[0.14em] opacity-50">
                  {h.label}
                  {tool && tool.unit !== 'u'
                    ? ` · ${fmtMeasure(tool.unit, measureFor(tool.unit, o.geometry))}`
                    : ''}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-4 w-28 overflow-hidden rounded border border-black/10">
                  {teintes.length ? (
                    teintes.map((t) => (
                      <span key={t} className="flex-1" style={{ backgroundColor: hexOf(t) }} />
                    ))
                  ) : (
                    <span className="flex-1 bg-black/5" />
                  )}
                </span>
                <span className="text-[9.5px] opacity-65">
                  {teintes.length ? teintes.map(labelOf).join(' × ') : 'nuancier à composer'}
                </span>
                <span className="ml-auto flex gap-[2px]">
                  {MOIS.map((m, i) => (
                    <span
                      key={i}
                      className="h-3 w-[7px] rounded-[1px] print-exact"
                      style={{
                        backgroundColor: flo.includes(i + 1) ? '#2f5d3a' : 'rgba(0,0,0,.09)',
                      }}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-1 text-[9.5px] leading-snug opacity-70">{h.conseil}</p>
              {o.meta?.note && (
                <p className="mt-0.5 text-[9.5px] italic leading-snug opacity-60">
                  « {o.meta.note} »
                </p>
              )}
            </div>
          );
        })}
      </section>

      <p className="text-[8.5px] leading-snug opacity-45">
        Grammaire chromatique établie d’après Gertrude Jekyll (Colour in the Flower Garden, 1908),
        le cercle chromatique d’Itten et les principes de plantation naturaliste (Oudolf /
        Kingsbury).
      </p>
    </div>
  );
};

export default ChromaticPrintPage;
