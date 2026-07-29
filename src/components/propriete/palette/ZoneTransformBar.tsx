import React from 'react';
import { Check, Move, Scaling, Spline, Undo2, X } from 'lucide-react';
import { fmtArea } from './studio/geoMetrics';
import type { ZoneTransformApi } from '@/hooks/propriete/useZoneTransform';

/**
 * Barre flottante du mode Transformer : mémo des gestes, lissage,
 * surface avant → après, annulation et validation.
 */
export const ZoneTransformBar: React.FC<{ api: ZoneTransformApi; color: string }> = ({
  api,
  color,
}) => {
  React.useEffect(() => {
    if (!api.zone) return;
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

  if (!api.zone) return null;

  const delta = api.baseArea > 0 ? api.area / api.baseArea : 1;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-[600] flex justify-center px-3 ${MAP_CHROME_TOP_PADDING}`}
    >
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/96 px-3 py-2 shadow-2xl backdrop-blur">
        <span className="flex items-center gap-1.5 pr-2 mr-1 border-r border-[hsl(var(--ds-line))]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-serif italic text-[13px] text-[hsl(var(--ds-forest-deep))]">
            {api.zone.nom}
          </span>
        </span>

        <span className="hidden md:inline-flex items-center gap-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70">
          <Move className="w-3 h-3" /> glissez la forme
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70">
          <Scaling className="w-3 h-3" /> poignées = échelle (Maj = homothétie)
        </span>

        <button
          onClick={api.smooth}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1 hover:border-[hsl(var(--ds-forest))]/60"
        >
          <Spline className="w-3 h-3" /> Lisser
          {api.smoothCount > 0 && (
            <span className="opacity-60">×{api.smoothCount}</span>
          )}
        </button>

        <button
          onClick={api.undo}
          disabled={!api.canUndo}
          className={`text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1 ${
            api.canUndo ? 'hover:border-[hsl(var(--ds-forest))]/60' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3 h-3" /> Annuler le geste
        </button>

        <span className="mx-1 text-[11px] text-[hsl(var(--ds-forest-deep))]/80 tabular-nums">
          {fmtArea(api.baseArea)} <span className="opacity-50">→</span>{' '}
          <strong className="text-[hsl(var(--ds-forest))]">{fmtArea(api.area)}</strong>
          {api.dirty && api.baseArea > 0 && (
            <span className="ml-1 opacity-60">
              ×{delta.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </span>
          )}
        </span>

        <button
          onClick={api.save}
          className="text-[11px] px-3 py-1 rounded-full bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] inline-flex items-center gap-1 hover:opacity-90"
        >
          <Check className="w-3 h-3" /> Valider
        </button>
        <button
          onClick={api.cancel}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Abandonner
        </button>
      </div>
    </div>
  );
};

export default ZoneTransformBar;
