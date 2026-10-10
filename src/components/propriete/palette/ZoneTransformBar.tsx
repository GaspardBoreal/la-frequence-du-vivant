import React from 'react';
import { Check, FlipHorizontal2, FlipVertical2, Loader2, Move, MoreHorizontal, RotateCw, Scaling, Spline, Trash2, Undo2, X } from 'lucide-react';
import { fmtArea } from './studio/geoMetrics';
import type { ZoneTransformApi } from '@/hooks/propriete/useZoneTransform';

/**
 * Mode Atelier — plot unique en bas de carte pendant la transformation d'un
 * emplacement : identité, surface vivante, trois actions. En composition
 * (copie), l'aide reste ancrée au-dessus de la barre, jamais sur la forme.
 */
export const ZoneTransformBar: React.FC<{
  api: ZoneTransformApi;
  color: string;
  /** Suppression de l'emplacement depuis le Mode Atelier (confirmée dans le rang « ⋯ »). */
  onDelete?: () => void;
  composition?: boolean;
}> = ({ api, color, onDelete, composition = false }) => {
  const [more, setMore] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const zoneId = api.zone?.id ?? null;
  const apiRef = React.useRef(api);
  apiRef.current = api;
  const active = !!api.zone;

  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        apiRef.current.cancel();
      } else if (e.key === 'Enter' && !typing) {
        e.preventDefault();
        e.stopPropagation();
        apiRef.current.save();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        apiRef.current.undo();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active]);

  React.useEffect(() => {
    if (!zoneId) return;
    setMore(false);
    setConfirmDelete(false);
    // Hors composition : filigrane bref. En composition, l'aide est ancrée sous la forme.
    if (composition) return;
    setHint(true);
    const t = window.setTimeout(() => setHint(false), 3200);
    return () => window.clearTimeout(t);
  }, [zoneId, composition]);

  if (!api.zone) return null;

  const delta = api.baseArea > 0 ? api.area / api.baseArea : 1;
  const chip =
    'inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60';
  const iconBtn =
    'inline-flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60 disabled:opacity-40';

  return (
    <>
      {hint && !composition && (
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
        {api.saveError && (
          <div className="pointer-events-auto flex max-w-[94vw] items-center gap-2 rounded-full border border-red-500/30 bg-[hsl(var(--ds-cream))]/97 px-3 py-1.5 text-[11.5px] text-red-700 shadow-lg">
            <span>{api.saveError}</span>
            <button onClick={api.save} disabled={api.saving} className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50">
              Réessayer
            </button>
          </div>
        )}

        {composition && (
          <div className="pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[#c8a24a]/40 bg-[hsl(var(--ds-cream))]/95 px-2 py-1.5 shadow-lg backdrop-blur">
            <span className="hidden items-center gap-1 px-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70 md:inline-flex">
              <Move className="h-3 w-3" /> glisser = déplacer · poignées = échelle · pastille dorée = rotation
            </span>
            <span className="px-1 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/70 md:hidden">
              Glisser · poignées · pastille dorée
            </span>
            <button onClick={api.rotate90} title="Pivoter de 90°" className={chip}>
              <RotateCw className="h-3.5 w-3.5" /> 90°
            </button>
            <button onClick={() => api.reflect('horizontal')} title="Miroir horizontal" className={chip}>
              <FlipHorizontal2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Miroir horizontal</span>
            </button>
            <button onClick={() => api.reflect('vertical')} title="Miroir vertical" className={chip}>
              <FlipVertical2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Miroir vertical</span>
            </button>
          </div>
        )}

        {more && (
          <div className="pointer-events-auto flex max-w-[92vw] flex-wrap items-center justify-center gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/97 px-3 py-2 shadow-xl backdrop-blur">
            {!composition && (
              <>
                <button onClick={api.smooth} className={chip}>
                  <Spline className="h-3 w-3" /> Lisser
                  {api.smoothCount > 0 && <span className="opacity-60">×{api.smoothCount}</span>}
                </button>
                <button onClick={api.rotate90} className={chip}>
                  <RotateCw className="h-3 w-3" /> 90°
                </button>
                <button onClick={() => api.reflect('horizontal')} className={chip}>
                  <FlipHorizontal2 className="h-3 w-3" /> Miroir horizontal
                </button>
                <button onClick={() => api.reflect('vertical')} className={chip}>
                  <FlipVertical2 className="h-3 w-3" /> Miroir vertical
                </button>
                <button onClick={() => setHint(true)} className={chip}>
                  Comment faire
                </button>
              </>
            )}
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
                  <button onClick={() => setConfirmDelete(false)} className={chip}>
                    Garder
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-500/30 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" /> {composition ? 'Supprimer cette copie' : 'Supprimer cet emplacement'}
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

          <span className="hidden shrink-0 px-1 text-[11.5px] tabular-nums text-[hsl(var(--ds-forest-deep))]/75 min-[420px]:inline">
            {fmtArea(api.baseArea)} <span className="opacity-45">→</span>{' '}
            <strong className="text-[13px] text-[hsl(var(--ds-forest))]">{fmtArea(api.area)}</strong>
            {api.dirty && api.baseArea > 0 && Math.abs(delta - 1) > 0.005 && (
              <span className="ml-1 opacity-55">
                ×{delta.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
              </span>
            )}
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-1.5 border-l border-[hsl(var(--ds-line))] pl-2">
            <button
              onClick={() => setMore((v) => !v)}
              title="Options, aide-mémoire"
              className={`${iconBtn} ${more ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/12' : ''}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            <button onClick={api.undo} disabled={!api.canUndo || api.saving} title="Annuler le geste (⌘Z)" className={iconBtn}>
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={api.cancel}
              disabled={api.saving}
              title="Abandonner (Échap)"
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60 disabled:opacity-40 sm:min-h-0"
            >
              <X className="h-3 w-3" /> <span className="hidden sm:inline">Abandonner</span>
            </button>
            <button
              onClick={api.save}
              disabled={api.saving}
              title="Valider (Entrée)"
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1 text-[11.5px] text-[hsl(var(--ds-cream))] hover:opacity-90 disabled:opacity-70 sm:min-h-0"
            >
              {api.saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Valider
                </>
              )}
            </button>
          </span>
        </div>
      </div>
    </>
  );
};

export default ZoneTransformBar;
