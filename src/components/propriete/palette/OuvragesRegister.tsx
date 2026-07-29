import React from 'react';
import { ChevronDown, Hammer, MapPin } from 'lucide-react';
import { useProprieteObjets } from '@/hooks/propriete/usePropertyObjets';
import { useOuvrageRecoKb, useCanEditOuvrageKb } from '@/hooks/propriete/useOuvrageRecoKb';
import { TOOL_FAMILIES, type ToolFamilyKey } from '@/lib/paysageTools';
import { toolByKey } from '@/lib/ouvrageRecoKb';
import { measureFor, fmtMeasure } from './studio/geoMetrics';
import OuvrageRecoCard from './OuvrageRecoCard';

interface ZoneLite {
  id: string;
  nom: string | null;
  couleur?: string | null;
}

interface Props {
  proprieteId?: string;
  zones: ZoneLite[];
  readOnly?: boolean;
  /** sélectionner l'emplacement de rattachement sur la carte */
  onSelectZone?: (id: string) => void;
  /** ouvrage désigné depuis la carte : sa fiche s'ouvre et défile jusqu'à elle */
  focusObjetId?: string | null;
  /** espèces déjà retenues dans la palette, par emplacement */
  zoneSelectedSpecies?: Record<string, string[]>;
}

/**
 * Registre des ouvrages dessinés dans l'Atelier : chaque objet est listé avec
 * son type, son métré et son emplacement de rattachement, et se déplie sur une
 * fiche de recommandation propre à son type.
 */
export const OuvragesRegister: React.FC<Props> = ({
  proprieteId,
  zones,
  readOnly,
  onSelectZone,
  focusObjetId,
  zoneSelectedSpecies,
}) => {
  const { objets, upsertObjet } = useProprieteObjets(proprieteId);
  const { resolve, saveReco, resetReco } = useOuvrageRecoKb();
  const canEditKb = useCanEditOuvrageKb();
  const [openIds, setOpenIds] = React.useState<string[]>([]);
  const rowRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    if (!focusObjetId) return;
    setOpenIds((ids) => (ids.includes(focusObjetId) ? ids : [...ids, focusObjetId]));
    const node = rowRefs.current[focusObjetId];
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusObjetId]);


  const grouped = React.useMemo(() => {
    const map = new Map<ToolFamilyKey, typeof objets>();
    for (const o of objets) {
      const fam = (toolByKey(o.outil_key)?.family ?? 'usage') as ToolFamilyKey;
      map.set(fam, [...(map.get(fam) ?? []), o]);
    }
    return TOOL_FAMILIES.filter((f) => map.has(f.key)).map((f) => ({
      family: f,
      items: map.get(f.key)!,
    }));
  }, [objets]);

  if (!objets.length) return null;

  const allOpen = openIds.length === objets.length;
  const zoneOf = (id: string | null) => zones.find((z) => z.id === id);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--ds-forest))]/75">
          <Hammer className="h-3 w-3" /> Registre des ouvrages
        </span>
        <span className="text-[11px] text-[hsl(var(--ds-forest-deep))]/65">
          {objets.length} ouvrage{objets.length > 1 ? 's' : ''} dessiné
          {objets.length > 1 ? 's' : ''} dans l’Atelier · recommandations par type
        </span>
        <button
          type="button"
          onClick={() => setOpenIds(allOpen ? [] : objets.map((o) => o.id))}
          className="ml-auto rounded-full border border-[hsl(var(--ds-line))] px-3 py-1 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))] transition hover:border-[hsl(var(--ds-forest))]"
        >
          {allOpen ? 'Tout replier' : 'Tout déplier'}
        </button>
      </div>

      {grouped.map(({ family, items }) => (
        <div key={family.key} className="space-y-1.5">
          <p className="flex items-baseline gap-2 px-1">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: family.color }}
            >
              {family.label}
            </span>
            <span className="text-[10.5px] italic opacity-55">{family.tagline}</span>
          </p>

          {items.map((o) => {
            const tool = toolByKey(o.outil_key);
            const color = (o.style?.color as string) || tool?.color || family.color;
            const open = openIds.includes(o.id);
            const unit = tool?.unit ?? 'u';
            const measure = measureFor(unit, o.geometry);
            const zone = zoneOf(o.zone_id);
            const reco = resolve(o.outil_key);

            return (
              <div
                key={o.id}
                ref={(el) => {
                  rowRefs.current[o.id] = el;
                }}
                className={`overflow-hidden rounded-xl border bg-[hsl(var(--ds-cream))]/55 text-[hsl(var(--ds-forest-deep))] transition ${
                  focusObjetId === o.id
                    ? 'border-[hsl(var(--ds-forest))] ring-1 ring-[hsl(var(--ds-forest))]/30'
                    : 'border-[hsl(var(--ds-line))]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIds((ids) =>
                      ids.includes(o.id) ? ids.filter((x) => x !== o.id) : [...ids, o.id],
                    )
                  }
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/40"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px]"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    {tool?.glyph ?? '•'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                      {o.nom || tool?.label || 'Ouvrage'}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 text-[10.5px] opacity-60">
                      <span>{tool?.label ?? o.outil_key}</span>
                      <span>· {fmtMeasure(unit, measure)}</span>
                      {zone && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone?.(zone.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              onSelectZone?.(zone.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                        >
                          <MapPin className="h-2.5 w-2.5" />
                          {zone.nom || 'Emplacement'}
                        </span>
                      )}
                      {reco.enriched && (
                        <span className="text-[hsl(var(--ds-gold))]">· fiche enrichie</span>
                      )}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && tool && (
                  <div className="border-t border-[hsl(var(--ds-line))]/70 px-3 py-3">
                    <OuvrageRecoCard
                      tool={tool}
                      reco={reco}
                      measure={measure}
                      note={o.meta?.note ?? ''}
                      zoneNom={zone?.nom ?? null}
                      zoneSelected={(o.zone_id && zoneSelectedSpecies?.[o.zone_id]) || []}
                      readOnly={readOnly}
                      canEditKb={canEditKb}
                      onSaveKb={(r) => saveReco(o.outil_key, r)}
                      onResetKb={() => resetReco(o.outil_key)}
                      onNoteChange={(v) =>
                        upsertObjet({
                          id: o.id,
                          outil_key: o.outil_key,
                          geometry: o.geometry,
                          calque_id: o.calque_id,
                          zone_id: o.zone_id,
                          nom: o.nom,
                          style: o.style,
                          meta: { ...(o.meta ?? {}), note: v || null },
                          ordre: o.ordre,
                        }).catch(() => {})
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default OuvragesRegister;
