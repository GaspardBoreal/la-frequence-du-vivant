import React from 'react';
import {
  Check,
  Move,
  MoreHorizontal,
  Ruler,
  RotateCw,
  Scaling,
  Spline,
  Undo2,
  X,
} from 'lucide-react';
import { fmtMeasure } from './geoMetrics';
import type { ObjetTransformApi } from '@/hooks/propriete/useObjetTransform';
import { TOOL_BY_KEY } from '@/lib/paysageTools';

/**
 * Mode Atelier — plot unique posé en bas de la carte pendant la transformation
 * d'un ouvrage : identité, mesure vivante, trois actions. Les options
 * secondaires (Coter, Lisser, aide-mémoire des gestes) se déplient sous « ⋯ »,
 * pour que la barre ne se replie jamais sur deux lignes.
 */
export const ObjetTransformBar: React.FC<{ api: ObjetTransformApi; color: string }> = ({
  api,
  color,
}) => {
  const [more, setMore] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const objetId = api.objet?.id ?? null;

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

  /** Filigrane d'entrée : les gestes rappelés trois secondes, puis effacés. */
  React.useEffect(() => {
    if (!objetId) return;
    setMore(false);
    setHint(true);
    const t = window.setTimeout(() => setHint(false), 3200);
    return () => window.clearTimeout(t);
  }, [objetId]);

  if (!api.objet) return null;

  const tool = TOOL_BY_KEY[api.objet.outil_key];
  const delta = api.baseMeasure > 0 ? api.measure / api.baseMeasure : 1;
  const shaped = api.kind !== 'Point';

  const gestes = [
    { icon: Move, label: 'glissez la forme pour la déplacer' },
    ...(shaped
      ? [
          { icon: Scaling, label: 'poignées = échelle (Maj = homothétie)' },
          { icon: RotateCw, label: 'pastille dorée = rotation (Maj = 15°)' },
        ]
      : []),
  ];

  return (
    <>
      {/* Filigrane central : le mémo des gestes, à l'entrée du mode */}
      {hint && (
        <div className="pointer-events-none absolute inset-0 z-[755] flex items-center justify-center">
          <div className="animate-fade-in rounded-2xl bg-[hsl(var(--ds-forest-deep))]/80 px-5 py-3 text-center text-[hsl(var(--ds-cream))] shadow-2xl backdrop-blur">
            {gestes.map((g) => (
              <p key={g.label} className="flex items-center gap-2 text-[12px] leading-6">
                <g.icon className="h-3.5 w-3.5 opacity-70" />
                {g.label}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[760] flex flex-col items-center gap-2 px-3">
        {/* Rang déplié : options secondaires */}
        {more && (
          <div className="pointer-events-auto flex max-w-[92vw] flex-wrap items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/97 px-3 py-2 shadow-xl backdrop-blur">
            {shaped && (
              <button
                onClick={api.toggleDims}
                title="Afficher les dimensions exactes de chaque côté"
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${
                  api.showDims
                    ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/12 text-[hsl(var(--ds-forest-deep))]'
                    : 'border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60'
                }`}
              >
                <Ruler className="h-3 w-3" /> Coter
              </button>
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
              onClick={() => setHint(true)}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
            >
              Comment faire
            </button>
            <span className="text-[10.5px] text-[hsl(var(--ds-forest-deep))]/60">
              Échap = abandonner · Entrée = valider · ⌘Z = annuler le geste
            </span>
          </div>
        )}

        {/* Plot principal : une seule ligne, toujours */}
        <div className="pointer-events-auto flex max-w-[94vw] items-center gap-2 overflow-hidden rounded-full border border-[#c8a24a]/45 bg-[hsl(var(--ds-cream))]/97 py-1.5 pl-2 pr-1.5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.55)] backdrop-blur">
          <span className="flex min-w-0 items-center gap-1.5 border-r border-[hsl(var(--ds-line))] pr-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
              style={{ backgroundColor: `${color}22` }}
            >
              {tool?.glyph ?? '◆'}
            </span>
            <span className="truncate font-serif text-[13px] italic text-[hsl(var(--ds-forest-deep))]">
              {api.objet.nom || tool?.label || 'Ouvrage'}
            </span>
          </span>

          {api.unit !== 'u' && (
            <span className="shrink-0 px-1 text-[11.5px] tabular-nums text-[hsl(var(--ds-forest-deep))]/75">
              {fmtMeasure(api.unit, api.baseMeasure)} <span className="opacity-45">→</span>{' '}
              <strong className="text-[13px] text-[hsl(var(--ds-forest))]">
                {fmtMeasure(api.unit, api.measure)}
              </strong>
              {api.dirty && api.baseMeasure > 0 && (
                <span className="ml-1 opacity-55">
                  ×{delta.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                </span>
              )}
            </span>
          )}

          <span className="ml-auto flex shrink-0 items-center gap-1.5 border-l border-[hsl(var(--ds-line))] pl-2">
            <button
              onClick={() => setMore((v) => !v)}
              title="Coter, lisser, aide-mémoire"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                more
                  ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/12'
                  : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/60'
              }`}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-[hsl(var(--ds-forest-deep))]" />
            </button>
            <button
              onClick={api.undo}
              disabled={!api.canUndo}
              title="Annuler le geste (⌘Z)"
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-[hsl(var(--ds-line))] ${
                api.canUndo
                  ? 'hover:border-[hsl(var(--ds-forest))]/60'
                  : 'cursor-not-allowed opacity-35'
              }`}
            >
              <Undo2 className="h-3.5 w-3.5 text-[hsl(var(--ds-forest-deep))]" />
            </button>
            <button
              onClick={api.cancel}
              title="Abandonner (Échap)"
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
            >
              <X className="h-3 w-3" /> <span className="hidden sm:inline">Abandonner</span>
            </button>
            <button
              onClick={api.save}
              title="Valider (Entrée)"
              className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1 text-[11.5px] text-[hsl(var(--ds-cream))] hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Valider
            </button>
          </span>
        </div>
      </div>
    </>
  );
};

export default ObjetTransformBar;
