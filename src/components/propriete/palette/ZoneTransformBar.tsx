import React from 'react';
import { Check, Move, MoreHorizontal, Scaling, Spline, Trash2, Undo2, X } from 'lucide-react';
import { fmtArea } from './studio/geoMetrics';
import type { ZoneTransformApi } from '@/hooks/propriete/useZoneTransform';

/**
 * Mode Atelier — plot unique en bas de carte pendant la transformation d'un
 * emplacement : identité, surface vivante, trois actions. Lissage et
 * aide-mémoire se déplient sous « ⋯ ».
 */
export const ZoneTransformBar: React.FC<{
  api: ZoneTransformApi;
  color: string;
  /** Suppression de l'emplacement depuis le Mode Atelier (confirmée dans le rang « ⋯ »). */
  onDelete?: () => void;
}> = ({ api, color, onDelete }) => {
  const [more, setMore] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const zoneId = api.zone?.id ?? null;

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

  React.useEffect(() => {
    if (!zoneId) return;
    setMore(false);
    setConfirmDelete(false);
    setHint(true);
    const t = window.setTimeout(() => setHint(false), 3200);
    return () => window.clearTimeout(t);
  }, [zoneId]);

  if (!api.zone) return null;

  const delta = api.baseArea > 0 ? api.area / api.baseArea : 1;

  return (
    <>
      {hint && (
        <div className="pointer-events-none absolute inset-0 z-[755] flex items-center justify-center">
          <div className="animate-fade-in rounded-2xl bg-[hsl(var(--ds-forest-deep))]/80 px-5 py-3 text-center text-[hsl(var(--ds-cream))] shadow-2xl backdrop-blur">
            <p className="flex items-center gap-2 text-[12px] leading-6">
              <Move className="h-3.5 w-3.5 opacity-70" /> glissez la forme pour la déplacer
            </p>
            <p className="flex items-center gap-2 text-[12px] leading-6">
              <Scaling className="h-3.5 w-3.5 opacity-70" /> poignées = échelle (Maj = homothétie)
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[760] flex flex-col items-center gap-2 px-3">
        {more && (
          <div className="pointer-events-auto flex max-w-[92vw] flex-wrap items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/97 px-3 py-2 shadow-xl backdrop-blur">
            <button
              onClick={api.smooth}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
            >
              <Spline className="h-3 w-3" /> Lisser
              {api.smoothCount > 0 && <span className="opacity-60">×{api.smoothCount}</span>}
            </button>
            <button
              onClick={() => setHint(true)}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
            >
              Comment faire
            </button>
            {onDelete &&
              (confirmDelete ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/5 px-2 py-1">
                  <span className="text-[10.5px] text-red-700">Supprimer l'emplacement ?</span>
                  <button
                    onClick={() => {
                      setConfirmDelete(false);
                      onDelete();
                    }}
                    className="rounded-full bg-red-600 px-2 py-0.5 text-[10.5px] font-medium text-white hover:bg-red-700"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full border border-[hsl(var(--ds-line))] px-2 py-0.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
                  >
                    Garder
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-500/30 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" /> Supprimer cet emplacement
                </button>
              ))}
            <span className="text-[10.5px] text-[hsl(var(--ds-forest-deep))]/60">
              Échap = abandonner · Entrée = valider · ⌘Z = annuler le geste
            </span>
          </div>
        )}

        <div className="pointer-events-auto flex max-w-[94vw] items-center gap-2 overflow-hidden rounded-full border border-[#c8a24a]/45 bg-[hsl(var(--ds-cream))]/97 py-1.5 pl-3 pr-1.5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.55)] backdrop-blur">
          <span className="flex min-w-0 items-center gap-1.5 border-r border-[hsl(var(--ds-line))] pr-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate font-serif text-[13px] italic text-[hsl(var(--ds-forest-deep))]">
              {api.zone.nom}
            </span>
          </span>

          <span className="shrink-0 px-1 text-[11.5px] tabular-nums text-[hsl(var(--ds-forest-deep))]/75">
            {fmtArea(api.baseArea)} <span className="opacity-45">→</span>{' '}
            <strong className="text-[13px] text-[hsl(var(--ds-forest))]">{fmtArea(api.area)}</strong>
            {api.dirty && api.baseArea > 0 && (
              <span className="ml-1 opacity-55">
                ×{delta.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </span>
            )}
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-1.5 border-l border-[hsl(var(--ds-line))] pl-2">
            <button
              onClick={() => setMore((v) => !v)}
              title="Lisser, aide-mémoire"
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

export default ZoneTransformBar;
