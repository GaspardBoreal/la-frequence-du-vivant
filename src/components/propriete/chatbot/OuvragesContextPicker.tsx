import React, { useMemo } from 'react';
import { Check, Layers, Sparkles, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProprieteObjets } from '@/hooks/propriete/usePropertyObjets';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { linkedSampleIds } from '@/lib/soilLinkEngine';
import { classifyObservations } from '@/lib/ouvrageScope';
import { measureFor } from '@/components/propriete/palette/studio/geoMetrics';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import {
  proprieteChatFocus,
  useProprieteChatFocus,
  type OuvrageDetailLevel,
} from './proprieteChatFocus';

const DETAILS: { key: OuvrageDetailLevel; label: string; hint: string }[] = [
  { key: 'resume', label: 'Résumé', hint: 'Nom, type, surface, intention' },
  { key: 'complet', label: 'Complet', hint: 'Sol relié, contraintes, palette retenue' },
  { key: 'especes', label: '+ Espèces', hint: 'Ce qui pousse dans le tracé et en lisière' },
];

/**
 * Plateau des ouvrages — table de montage du contexte.
 * L'utilisateur retient 1, plusieurs, tous ou aucun ouvrage, et choisit la
 * profondeur de données transmise. Rien n'est envoyé tant qu'aucun ouvrage
 * n'est retenu.
 */
export const OuvragesContextPicker: React.FC<{ proprieteId?: string }> = ({ proprieteId }) => {
  const focus = useProprieteChatFocus();
  const { objets } = useProprieteObjets(proprieteId);
  const { state: soil } = usePropertySoil(proprieteId);
  const { waypoints } = usePropertySpeciesPool(proprieteId);

  const rows = useMemo(() => {
    return (objets ?? []).map((o) => {
      const tool = TOOL_BY_KEY[o.outil_key];
      const linked = linkedSampleIds(o.meta).length;
      let dedans = 0;
      try {
        dedans = classifyObservations(o.geometry, waypoints ?? [], 0).dedans.length;
      } catch {
        dedans = 0;
      }
      const surface = Math.round(measureFor(tool?.unit ?? 'u', o.geometry) || 0);
      return {
        id: o.id,
        nom: o.nom || tool?.label || o.outil_key,
        glyph: tool?.glyph ?? '📍',
        color: tool?.color ?? '#6b7f76',
        unit: tool?.unit ?? 'u',
        surface,
        linked,
        dedans,
        recommended: linked > 0 || dedans > 0,
      };
    });
  }, [objets, waypoints, soil]);

  if (rows.length === 0) return null;

  const selected = new Set(focus.selectedObjetIds);
  const allIds = rows.map((r) => r.id);
  const recommendedIds = rows.filter((r) => r.recommended).map((r) => r.id);

  return (
    <div className="mb-2 rounded-xl border border-primary/25 bg-primary/5 p-2.5">
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          Plateau des ouvrages
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {selected.size}/{rows.length} retenu{selected.size > 1 ? 's' : ''}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        Retenez à la carte les emplacements dont l'IA doit parler.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => proprieteChatFocus.setSelectedObjets(allIds)}
          className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] hover:bg-muted transition-colors"
        >
          Tous
        </button>
        <button
          onClick={() => proprieteChatFocus.clearSelectedObjets()}
          disabled={selected.size === 0}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        >
          <Eraser className="h-3 w-3" /> Aucun
        </button>
        {recommendedIds.length > 0 && (
          <button
            onClick={() => proprieteChatFocus.setSelectedObjets(recommendedIds)}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="h-3 w-3" /> Pertinents
          </button>
        )}
      </div>

      {/* Vignettes */}
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {rows.map((r) => {
          const on = selected.has(r.id);
          const framed = focus.objetId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => proprieteChatFocus.toggleObjetSelection(r.id)}
              className={cn(
                'group relative rounded-lg border px-2 py-1.5 text-left transition-all',
                on
                  ? 'border-primary/50 bg-primary/12 shadow-sm'
                  : 'border-border bg-background/60 hover:bg-muted/60',
                framed && 'ring-1 ring-amber-400/60',
              )}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]"
                  style={{ backgroundColor: `${r.color}26` }}
                >
                  {r.glyph}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground">
                  {r.nom}
                </span>
                {on && <Check className="h-3 w-3 shrink-0 text-primary" />}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 pl-[22px] text-[10px] tabular-nums text-muted-foreground">
                <span>
                  {r.surface} {r.unit === 'm2' ? 'm²' : r.unit === 'ml' ? 'ml' : 'u'}
                </span>
                {r.dedans > 0 && <span className="text-primary/80">· {r.dedans} obs</span>}
                {r.linked > 0 && <span>· {r.linked} carotte{r.linked > 1 ? 's' : ''}</span>}
              </div>
              {framed && (
                <span className="absolute right-1.5 bottom-1 text-[9px] font-medium uppercase tracking-wide text-amber-500">
                  cadré
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Profondeur de données */}
      <div className="mt-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Profondeur de données
        </p>
        <div className="mt-1 flex rounded-lg border border-border bg-background/60 p-0.5">
          {DETAILS.map((d) => (
            <button
              key={d.key}
              onClick={() => proprieteChatFocus.setOuvrageDetail(d.key)}
              title={d.hint}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                focus.ouvrageDetail === d.key
                  ? 'bg-primary/15 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
          {DETAILS.find((d) => d.key === focus.ouvrageDetail)?.hint}
        </p>
      </div>
    </div>
  );
};

export default OuvragesContextPicker;
