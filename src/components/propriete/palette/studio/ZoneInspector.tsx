import React from 'react';
import { Trash2, X, Scaling, PencilLine, Eye, EyeOff } from 'lucide-react';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import { fmtArea } from './geoMetrics';

interface Props {
  zone: ProprieteZone;
  color: string;
  objetCount: number;
  /** Surface live si le mode Transformer est actif sur cette zone. */
  transformArea?: number | null;
  onPatch: (patch: Partial<ProprieteZone>) => void;
  onTransform: () => void;
  onRedraw: () => void;
  onDelete: () => void;
  onClose: () => void;
  readOnly?: boolean;
}

const field =
  'w-full rounded-md border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-1 text-[11px] outline-none focus:border-[hsl(var(--ds-forest))]/50';

/**
 * Éditeur d'emplacement affiché sur la carte de l'Atelier.
 * Même langage visuel que l'ObjectInspector : liseré de couleur, en-tête
 * collant, corps scrollable, tokens du design system.
 */
export const ZoneInspector: React.FC<Props> = ({
  zone,
  color,
  objetCount,
  transformArea,
  onPatch,
  onTransform,
  onRedraw,
  onDelete,
  onClose,
  readOnly,
}) => {
  const [nom, setNom] = React.useState(zone.nom || '');
  const [note, setNote] = React.useState(zone.note || '');
  const transforming = transformArea != null;

  React.useEffect(() => {
    setNom(zone.nom || '');
    setNote(zone.note || '');
  }, [zone.id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !transforming) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, transforming]);

  return (
    <div
      className="ds-inspector-in relative flex max-h-full flex-col overflow-hidden rounded-t-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/96 text-[hsl(var(--ds-forest-deep))] shadow-2xl backdrop-blur sm:rounded-xl"
      role="dialog"
      aria-label={`Édition de l'emplacement ${zone.nom}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: color }}
      />

      <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/96 px-3 py-2.5 backdrop-blur">
        <span
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/70"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold leading-tight">
            {zone.nom || 'Emplacement'}
          </p>
          <p className="truncate text-[10px] opacity-60">
            {transforming
              ? `${fmtArea(transformArea!)} · en transformation`
              : zone.surface_m2
                ? fmtArea(zone.surface_m2)
                : 'surface inconnue'}
            {objetCount > 0 ? ` · ${objetCount} ouvrage${objetCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer l'éditeur"
          className="rounded p-1 opacity-50 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {transforming ? (
        <p className="px-3 py-3 text-[10.5px] italic leading-relaxed opacity-65">
          Mode transformation en cours : utilise la barre en haut de la carte pour déplacer,
          redimensionner ou lisser le contour, puis valide.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">Nom</span>
            <input
              className={field}
              value={nom}
              disabled={readOnly}
              onChange={(e) => setNom(e.target.value)}
              onBlur={() => onPatch({ nom: nom.trim() || 'Emplacement' })}
              placeholder="Mare, verger, potager…"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
                Couleur
              </span>
              <input
                type="color"
                disabled={readOnly}
                value={zone.couleur || color}
                onChange={(e) => onPatch({ couleur: e.target.value })}
                className="h-7 w-full cursor-pointer rounded border border-[hsl(var(--ds-line))] bg-transparent"
              />
            </label>
            <label className="block">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
                Opacité
              </span>
              <input
                type="range"
                min={0.04}
                max={0.6}
                step={0.02}
                disabled={readOnly}
                value={zone.opacite}
                onChange={(e) => onPatch({ opacite: Number(e.target.value) })}
                className="mt-1.5 w-full accent-[hsl(var(--ds-forest))]"
              />
            </label>
          </div>

          <button
            onClick={() => onPatch({ visible: !zone.visible })}
            disabled={readOnly}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] py-1 text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
          >
            {zone.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {zone.visible ? 'Visible sur le plan' : 'Masqué'}
          </button>

          <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
              Intention / note de chantier
            </span>
            <textarea
              className={`${field} min-h-[52px] resize-y`}
              disabled={readOnly}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => onPatch({ note: note.trim() || null })}
              placeholder="Pourquoi ici ? quel usage, quelle saison ?"
            />
          </label>
        </div>
      )}

      {!readOnly && !transforming && (
        <div className="space-y-1.5 border-t border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/96 px-3 py-2.5">
          <div className="flex gap-1.5">
            <button
              onClick={onTransform}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[hsl(var(--ds-line))] py-1 text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
            >
              <Scaling className="h-3 w-3" /> Transformer
            </button>
            <button
              onClick={onRedraw}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[hsl(var(--ds-line))] py-1 text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
            >
              <PencilLine className="h-3 w-3" /> Redessiner
            </button>
          </div>
          <button
            onClick={onDelete}
            className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-red-500/30 py-1 text-[10px] text-red-600 hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" /> Supprimer l'emplacement
          </button>
        </div>
      )}
    </div>
  );
};

export default ZoneInspector;
