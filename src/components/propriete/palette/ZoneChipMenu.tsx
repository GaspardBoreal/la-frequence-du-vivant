import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Eye, EyeOff, Lock, Unlock, Trash2, Check, X } from 'lucide-react';
import { ZONE_COLORS, type ProprieteZone } from '@/hooks/propriete/usePropertyZones';

interface Props {
  zone: ProprieteZone;
  label: string;
  color: string;
  speciesCount?: number;
  onPatch: (patch: Partial<ProprieteZone>) => void;
  onDelete: () => void;
  onClose: () => void;
  anchor: { x: number; y: number };
}

/**
 * Panneau flottant de gestion d'un emplacement :
 * renommer, recolorer, masquer, verrouiller, supprimer.
 */
const ZoneChipMenu: React.FC<Props> = ({
  zone,
  label,
  color,
  speciesCount = 0,
  onPatch,
  onDelete,
  onClose,
  anchor,
}) => {
  const [nom, setNom] = React.useState(zone.nom);
  const [confirming, setConfirming] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setNom(zone.nom), [zone.nom]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const commitName = () => {
    const next = nom.trim();
    if (next && next !== zone.nom) onPatch({ nom: next });
  };

  const left = Math.min(Math.max(8, anchor.x - 130), window.innerWidth - 276);
  const top = Math.min(anchor.y + 8, window.innerHeight - 340);

  return createPortal(
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[4000] w-[268px] rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] shadow-2xl p-3 space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-semibold tracking-wide text-[hsl(var(--ds-forest))]">
          Emplacement {label}
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-[hsl(var(--ds-forest-deep))]/60 hover:text-[hsl(var(--ds-forest-deep))]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/60">
          Nom
        </span>
        <input
          value={nom}
          autoFocus
          onChange={(e) => setNom(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitName();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full rounded-lg border border-[hsl(var(--ds-line))] bg-white/70 px-2.5 py-1.5 text-xs text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))]"
        />
      </label>

      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--ds-forest-deep))]/60">
          Couleur
        </span>
        <div className="flex items-center gap-1.5">
          {ZONE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onPatch({ couleur: c })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                (zone.couleur || color) === c ? 'border-[hsl(var(--ds-forest-deep))]' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPatch({ visible: !zone.visible })}
          className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-[hsl(var(--ds-line))] inline-flex items-center justify-center gap-1.5 text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
        >
          {zone.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {zone.visible ? 'Visible' : 'Masqué'}
        </button>
        <button
          onClick={() => onPatch({ verrouille: !zone.verrouille })}
          className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-[hsl(var(--ds-line))] inline-flex items-center justify-center gap-1.5 text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]/60"
        >
          {zone.verrouille ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          {zone.verrouille ? 'Verrouillé' : 'Libre'}
        </button>
      </div>

      {zone.surface_m2 != null && (
        <p className="text-[10px] text-[hsl(var(--ds-forest-deep))]/60">
          Surface estimée · {Math.round(zone.surface_m2).toLocaleString('fr-FR')} m²
        </p>
      )}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={zone.verrouille}
          className={`w-full text-[11px] px-2 py-1.5 rounded-lg border border-red-300 text-red-700 inline-flex items-center justify-center gap-1.5 ${
            zone.verrouille ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-3 h-3" /> Supprimer cet emplacement
        </button>
      ) : (
        <div className="rounded-lg border border-red-300 bg-red-50/60 p-2 space-y-2">
          <p className="text-[10.5px] leading-snug text-red-800">
            Supprimer « {zone.nom} » ?
            {speciesCount > 0
              ? ` Cet emplacement contient ${speciesCount} espèce${speciesCount > 1 ? 's' : ''} choisie${speciesCount > 1 ? 's' : ''} — la palette associée sera perdue.`
              : ' Cette action est définitive.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="flex-1 text-[11px] px-2 py-1 rounded-md bg-red-600 text-white inline-flex items-center justify-center gap-1 hover:bg-red-700"
            >
              <Check className="w-3 h-3" /> Confirmer
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 text-[11px] px-2 py-1 rounded-md border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

export const ZoneChipCaret: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <span
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => e.key === 'Enter' && onClick(e as any)}
    className="ml-0.5 -mr-1 inline-flex items-center rounded-full p-0.5 hover:bg-black/10"
  >
    <ChevronDown className="w-3 h-3" />
  </span>
);

export default ZoneChipMenu;
