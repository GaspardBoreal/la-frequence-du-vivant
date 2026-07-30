import React from 'react';
import { Check, Move, RotateCw, Scaling, Spline, Undo2, X } from 'lucide-react';
import { fmtMeasure } from './geoMetrics';
import type { ObjetTransformApi } from '@/hooks/propriete/useObjetTransform';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { MAP_CHROME_TOP_PADDING } from '@/components/maps/mapChrome';

/**
 * Barre flottante du mode Transformer d'un ouvrage : mémo des gestes,
 * lissage, mesure avant → après, annulation et validation.
 */
export const ObjetTransformBar: React.FC<{ api: ObjetTransformApi; color: string }> = ({
  api,
  color,
}) => {
  React.useEffect(() => {
    if (!api.objet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        api.cancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        api.save();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        api.undo();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [api]);

  if (!api.objet) return null;

  const tool = TOOL_BY_KEY[api.objet.outil_key];
  const delta = api.baseMeasure > 0 ? api.measure / api.baseMeasure : 1;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-[600] flex justify-center px-3 ${MAP_CHROME_TOP_PADDING}`}
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/96 px-3 py-2 shadow-2xl backdrop-blur">
        <span className="mr-1 flex items-center gap-1.5 border-r border-[hsl(var(--ds-line))] pr-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
            style={{ backgroundColor: `${color}22` }}
          >
            {tool?.glyph ?? '◆'}
          </span>
          <span className="font-serif text-[13px] italic text-[hsl(var(--ds-forest-deep))]">
            {api.objet.nom || tool?.label || 'Ouvrage'}
          </span>
        </span>

        <span className="hidden items-center gap-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70 md:inline-flex">
          <Move className="h-3 w-3" /> glissez la forme
        </span>
        {api.kind !== 'Point' && (
          <>
            <span className="hidden items-center gap-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70 md:inline-flex">
              <Scaling className="h-3 w-3" /> poignées = échelle (Maj = homothétie)
            </span>
            <span className="hidden items-center gap-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70 lg:inline-flex">
              <RotateCw className="h-3 w-3" /> pastille dorée = rotation (Maj = 15°)
            </span>
          </>
        )}

        {api.canSmooth && (
          <button
            onClick={api.smooth}
            className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
          >
            <Spline className="h-3 w-3" /> Lisser
            {api.smoothCount > 0 && <span className="opacity-60">×{api.smoothCount}</span>}
          </button>
        )}

        <button
          onClick={api.undo}
          disabled={!api.canUndo}
          className={`inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] ${
            api.canUndo ? 'hover:border-[hsl(var(--ds-forest))]/60' : 'cursor-not-allowed opacity-40'
          }`}
        >
          <Undo2 className="h-3 w-3" /> Annuler le geste
        </button>

        {api.unit !== 'u' && (
          <span className="mx-1 text-[11px] tabular-nums text-[hsl(var(--ds-forest-deep))]/80">
            {fmtMeasure(api.unit, api.baseMeasure)} <span className="opacity-50">→</span>{' '}
            <strong className="text-[hsl(var(--ds-forest))]">
              {fmtMeasure(api.unit, api.measure)}
            </strong>
            {api.dirty && api.baseMeasure > 0 && (
              <span className="ml-1 opacity-60">
                ×{delta.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </span>
            )}
          </span>
        )}

        <button
          onClick={api.save}
          className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1 text-[11px] text-[hsl(var(--ds-cream))] hover:opacity-90"
        >
          <Check className="h-3 w-3" /> Valider
        </button>
        <button
          onClick={api.cancel}
          className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))]"
        >
          <X className="h-3 w-3" /> Abandonner
        </button>
      </div>
    </div>
  );
};

export default ObjetTransformBar;
