import React from 'react';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { toolByKey } from '@/lib/ouvrageRecoKb';
import { useOuvrageRecoKb } from '@/hooks/propriete/useOuvrageRecoKb';
import { fmtEuro, fmtMeasure, measureFor } from '@/components/propriete/palette/studio/geoMetrics';

const SHEETS_PER_PAGE = 2;

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

interface ZoneLite {
  id: string;
  nom: string | null;
}

export interface OuvrageSheetsProps {
  objets: ProprieteObjet[];
  zones: ZoneLite[];
  /** espèces déjà retenues dans la palette, par emplacement */
  zoneSelectedSpecies?: Record<string, string[]>;
  propertyName?: string;
  pageClassName?: string;
  /** pied de page optionnel, index de planche 0-based */
  renderFoot?: (plateIndex: number, plateCount: number) => React.ReactNode;
}

/** Nombre de planches A4 nécessaires aux fiches conseils (2 fiches / page). */
export const ouvrageSheetPageCount = (objets: ProprieteObjet[]): number => {
  const types = new Set(objets.map((o) => o.outil_key));
  return types.size === 0 ? 0 : Math.ceil(types.size / SHEETS_PER_PAGE);
};

interface SheetData {
  key: string;
  label: string;
  glyph: string;
  color: string;
  count: number;
  measureLabel: string;
  cout: number | null;
  retention: number | null;
  zoneNames: string[];
  notes: string[];
  paletteSelected: string[];
}

const Block: React.FC<{ title: string; ink: string; children: React.ReactNode }> = ({
  title,
  ink,
  children,
}) => (
  <div className="rounded-lg border border-[hsl(var(--ds-line))] bg-white/55 p-2.5 print-exact">
    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: ink }}>
      {title}
    </p>
    {children}
  </div>
);

/**
 * Fiche conseils imprimable d'un type d'ouvrage : mise en œuvre, calendrier,
 * entretien An 0 / 1 / 3, espèces & compagnonnage croisées avec la palette
 * retenue, vigilances et sources.
 */
const Sheet: React.FC<{ data: SheetData; reco: any }> = ({ data, reco }) => {
  const paletteNorm = data.paletteSelected.map(norm).filter((s) => s.length > 2);
  const inPalette = (line: string) => {
    const l = norm(line);
    return paletteNorm.some((p) => l.includes(p) || p.includes(l));
  };

  return (
    <article className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-4 text-[hsl(var(--ds-forest-deep))] print-exact print-avoid-break">
      <header className="flex items-start gap-2.5 border-b border-[hsl(var(--ds-line))]/70 pb-2">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] print-exact"
          style={{ backgroundColor: `${data.color}26` }}
        >
          {data.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-serif italic text-[19px] leading-tight" style={{ color: data.color }}>
            {data.label}
          </h4>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ds-forest-deep))]/60">
            {data.count} ouvrage{data.count > 1 ? 's' : ''} · {data.measureLabel}
            {data.zoneNames.length ? ` · ${data.zoneNames.join(', ')}` : ''}
          </p>
        </div>
        <div className="text-right text-[9.5px] text-[hsl(var(--ds-forest-deep))]/60">
          {data.cout != null && <div>{fmtEuro(data.cout)} indicatif</div>}
          {data.retention != null && data.retention > 0 && (
            <div>{Math.round(data.retention).toLocaleString('fr-FR')} L retenus</div>
          )}
        </div>
      </header>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Block title="Mise en œuvre" ink="#2f5d3a">
          <ol className="space-y-1">
            {reco.miseEnOeuvre.map((s: string, i: number) => (
              <li key={i} className="flex gap-1.5 text-[10.5px] leading-snug">
                <span
                  className="mt-[1px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#2f5d3a]/12 text-[8px] font-bold text-[#2f5d3a] print-exact"
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {reco.calendrier && (
            <p className="mt-1.5 border-t border-[hsl(var(--ds-line))]/60 pt-1.5 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/75">
              Calendrier — {reco.calendrier}
            </p>
          )}
        </Block>

        <div className="space-y-2.5">
          <Block title="Entretien An 0 · An 1 · An 3" ink="#8a6d3b">
            <div className="grid grid-cols-3 gap-1.5">
              {(['an0', 'an1', 'an3'] as const).map((k, i) => (
                <div key={k} className="rounded-md bg-[#fdf8ec] p-1.5 print-exact">
                  <p className="text-[8.5px] font-bold uppercase tracking-widest text-[#8a6d3b]">
                    An {[0, 1, 3][i]}
                  </p>
                  <p className="text-[10px] leading-snug">{reco.entretien?.[k] || '—'}</p>
                </div>
              ))}
            </div>
          </Block>

          {reco.vigilance?.length > 0 && (
            <Block title="Vigilances" ink="#8c3a2e">
              <ul className="space-y-0.5">
                {reco.vigilance.map((v: string, i: number) => (
                  <li key={i} className="text-[10.5px] leading-snug text-[#7a3126]">
                    · {v}
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      </div>

      <div className="mt-2.5">
        <Block title="Espèces & compagnonnage" ink="#2f7d4f">
          {reco.especes?.length ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {reco.especes.map((e: string, i: number) => {
                const chosen = inPalette(e);
                return (
                  <li key={i} className="flex items-baseline gap-1.5 text-[10.5px] leading-snug">
                    <span
                      className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full print-exact"
                      style={{ backgroundColor: chosen ? '#2f7d4f' : '#b08d57' }}
                    />
                    <span>{e}</span>
                    {chosen && (
                      <span className="text-[8.5px] font-bold uppercase tracking-widest text-[#2f7d4f]">
                        retenue
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[10.5px] italic opacity-60">Cortège à compléter pour ce type d’ouvrage.</p>
          )}
          {data.paletteSelected.length > 0 && (
            <p className="mt-1.5 text-[9.5px] italic text-[hsl(var(--ds-forest-deep))]/60">
              Pastille verte : espèce déjà retenue dans la palette de l’emplacement.
            </p>
          )}
        </Block>
      </div>

      {data.notes.length > 0 && (
        <div className="mt-2 rounded-lg border border-[hsl(var(--ds-gold))]/45 bg-[#fdf8ec] p-2 print-exact">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a6d3b]">
            Notes de chantier
          </p>
          {data.notes.map((n, i) => (
            <p key={i} className="text-[10.5px] leading-snug">
              · {n}
            </p>
          ))}
        </div>
      )}

      {reco.sources?.length > 0 && (
        <p className="mt-2 text-[9px] italic text-[hsl(var(--ds-forest-deep))]/55">
          Sources — {reco.sources.join(' · ')}
        </p>
      )}
    </article>
  );
};

/** Planches A4 des fiches conseils, deux fiches par page. */
export const OuvrageSheetsPrint: React.FC<OuvrageSheetsProps> = ({
  objets,
  zones,
  zoneSelectedSpecies,
  propertyName,
  pageClassName = 'synthesize-print-page',
  renderFoot,
}) => {
  const { resolve } = useOuvrageRecoKb();

  const sheets = React.useMemo<SheetData[]>(() => {
    const byType = new Map<string, ProprieteObjet[]>();
    objets.forEach((o) => byType.set(o.outil_key, [...(byType.get(o.outil_key) ?? []), o]));

    return [...byType.entries()].map(([key, items]) => {
      const tool = toolByKey(key);
      const unit = tool?.unit ?? 'u';
      const total = items.reduce((s, o) => s + measureFor(unit, o.geometry), 0);
      const zoneNames = [
        ...new Set(
          items
            .map((o) => zones.find((z) => z.id === o.zone_id)?.nom)
            .filter(Boolean) as string[],
        ),
      ];
      const paletteSelected = [
        ...new Set(items.flatMap((o) => (o.zone_id && zoneSelectedSpecies?.[o.zone_id]) || [])),
      ];
      return {
        key,
        label: tool?.label ?? key,
        glyph: tool?.glyph ?? '•',
        color: tool?.color ?? '#8a6d3b',
        count: items.length,
        measureLabel: fmtMeasure(unit, total),
        cout: tool?.impact?.coutSolVivant ? tool.impact.coutSolVivant * total : null,
        retention: tool?.impact?.retentionLpU ? tool.impact.retentionLpU * total : null,
        zoneNames,
        notes: items.map((o) => o.meta?.note).filter(Boolean) as string[],
        paletteSelected,
      };
    });
  }, [objets, zones, zoneSelectedSpecies]);

  if (sheets.length === 0) return null;

  const pages: SheetData[][] = [];
  for (let i = 0; i < sheets.length; i += SHEETS_PER_PAGE) {
    pages.push(sheets.slice(i, i + SHEETS_PER_PAGE));
  }

  return (
    <>
      {pages.map((page, pi) => (
        <section key={pi} className={pageClassName}>
          <div className="synthesize-print-rule" />
          <div className="synthesize-print-body">
            <header className="mb-3">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]">
                Étape 5 · Les conseils
              </span>
              <h3 className="mt-1 font-serif italic text-3xl leading-tight text-[hsl(var(--ds-forest-deep))]">
                Fiches d’ouvrage {pages.length > 1 ? `· ${pi + 1} / ${pages.length}` : ''}
              </h3>
              <p className="mt-1 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/70">
                Ce que chaque type d’ouvrage demande pour tenir dans le temps —{' '}
                {propertyName ?? 'Propriété'}.
              </p>
            </header>

            <div className="space-y-3">
              {page.map((s) => (
                <Sheet key={s.key} data={s} reco={resolve(s.key)} />
              ))}
            </div>
          </div>
          {renderFoot?.(pi, pages.length)}
        </section>
      ))}
    </>
  );
};

export default OuvrageSheetsPrint;
