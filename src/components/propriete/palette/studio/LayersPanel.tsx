import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Layers,
  Check,
  Pencil,
  Move3d,
} from 'lucide-react';
import type { ProprieteCalque } from '@/hooks/propriete/usePropertyCalques';
import type { ProprieteZone } from '@/hooks/propriete/usePropertyZones';
import { ZONE_COLORS } from '@/hooks/propriete/usePropertyZones';
import { fmtArea } from './geoMetrics';
import { calqueMeta } from '@/lib/calqueMeta';
import VivantScopeSwitch from '@/components/propriete/VivantScopeSwitch';
import VivantPeriodFilter from '@/components/propriete/VivantPeriodFilter';

export interface SystemLayerState {
  parcelles: boolean;
  zones: boolean;
  vivant: boolean;
  /** Carottes de sol · prélèvements de l'étape « J'analyse ». */
  sol: boolean;
}


interface Props {
  calques: ProprieteCalque[];
  activeCalqueId: string | null;
  onActivate: (id: string) => void;
  onPatchCalque: (c: ProprieteCalque, patch: Partial<ProprieteCalque>) => void;
  onDeleteCalque: (id: string, moveObjetsToCalqueId?: string | null) => void;
  onCreateCalque: () => void;
  onMove: (c: ProprieteCalque, dir: -1 | 1) => void;

  zones: ProprieteZone[];
  activeZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  onPatchZone: (z: ProprieteZone, patch: Partial<ProprieteZone>) => void;
  onDeleteZone: (id: string) => void;
  onRedrawZone: (id: string) => void;
  onTransformZone?: (id: string) => void;

  system: SystemLayerState;
  onSystem: (patch: Partial<SystemLayerState>) => void;
  /** Compteurs de portée (cadastre / tous) pour le sélecteur d'observations. */
  scopeCounts?: { cadastre: number | null; all: number };
  /** Nombre de prélèvements de sol posés sur la carte. */
  soilCount?: number;


  objetCountByCalque: Record<string, number>;
  readOnly?: boolean;
}

const rowBase =
  'group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] transition-colors';

const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, title, children, danger }) => (
  <button
    type="button"
    title={title}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`shrink-0 rounded-md p-1 transition-colors ${
      danger
        ? 'text-red-600/70 hover:bg-red-500/10 hover:text-red-600'
        : 'text-[hsl(var(--ds-forest-deep))]/55 hover:bg-[hsl(var(--ds-forest))]/10 hover:text-[hsl(var(--ds-forest-deep))]'
    }`}
  >
    {children}
  </button>
);

export const LayersPanel: React.FC<Props> = ({
  calques,
  activeCalqueId,
  onActivate,
  onPatchCalque,
  onDeleteCalque,
  onCreateCalque,
  onMove,
  zones,
  activeZoneId,
  onSelectZone,
  onPatchZone,
  onDeleteZone,
  onRedrawZone,
  onTransformZone,
  system,
  onSystem,
  soilCount,

  scopeCounts,
  objetCountByCalque,
  readOnly,
}) => {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  const [showEmpty, setShowEmpty] = React.useState(false);

  const startEdit = (id: string, value: string) => {
    setEditing(id);
    setDraft(value);
  };

  const ordered = React.useMemo(() => [...calques].reverse(), [calques]);
  const nonEmpty = ordered.filter((c) => (objetCountByCalque[c.id] || 0) > 0);
  const emptyOnes = ordered.filter((c) => (objetCountByCalque[c.id] || 0) === 0);

  const askDelete = (c: ProprieteCalque, count: number) => {
    if (count > 0) {
      const target = calques.find((o) => o.id !== c.id);
      const ok = window.confirm(
        `Le calque « ${c.nom} » contient ${count} élément${count > 1 ? 's' : ''}.\n\n` +
          (target
            ? `OK : les déplacer vers « ${target.nom} » puis supprimer le calque.\nAnnuler : ne rien faire.`
            : `OK : supprimer le calque et ses éléments.\nAnnuler : ne rien faire.`),
      );
      if (!ok) return;
      onDeleteCalque(c.id, target?.id ?? null);
      return;
    }
    onDeleteCalque(c.id, null);
  };

  const renderCalques = (list: ProprieteCalque[]) => (
    <div className="space-y-0.5">
      {list.map((c) => {
        const active = c.id === activeCalqueId;
        const count = objetCountByCalque[c.id] || 0;
        const meta = calqueMeta(c.nom);
        const Icon = meta.icon;
        return (
          <div
            key={c.id}
            onClick={() => onActivate(c.id)}
            className={`group cursor-pointer rounded-lg px-2 py-1.5 text-[11px] transition-colors ${
              active
                ? 'bg-[hsl(var(--ds-forest))]/12 ring-1 ring-[hsl(var(--ds-forest))]/25'
                : 'hover:bg-[hsl(var(--ds-forest))]/5'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <IconBtn
                title={c.visible ? 'Masquer' : 'Afficher'}
                onClick={() => onPatchCalque(c, { visible: !c.visible })}
              >
                {c.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </IconBtn>
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
              {editing === `c-${c.id}` ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => {
                    onPatchCalque(c, { nom: draft.trim() || c.nom });
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  className="min-w-0 flex-1 rounded border border-[hsl(var(--ds-line))] bg-white/70 px-1 py-0.5 text-[11px]"
                />
              ) : (
                <span
                  className={`min-w-0 flex-1 truncate ${c.visible ? '' : 'opacity-45'}`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) startEdit(`c-${c.id}`, c.nom);
                  }}
                >
                  {c.nom}
                  <span
                    className={`ml-1 rounded-full px-1.5 py-[1px] text-[9px] ${
                      count > 0
                        ? 'bg-[hsl(var(--ds-forest))]/15 text-[hsl(var(--ds-forest-deep))]'
                        : 'opacity-40'
                    }`}
                  >
                    {count}
                  </span>
                </span>
              )}
              {!readOnly && (
                <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <IconBtn title="Renommer" onClick={() => startEdit(`c-${c.id}`, c.nom)}>
                    <Pencil className="h-3 w-3" />
                  </IconBtn>
                  <IconBtn title="Monter" onClick={() => onMove(c, 1)}>
                    <ChevronUp className="h-3 w-3" />
                  </IconBtn>
                  <IconBtn title="Descendre" onClick={() => onMove(c, -1)}>
                    <ChevronDown className="h-3 w-3" />
                  </IconBtn>
                  <IconBtn
                    title={c.verrouille ? 'Déverrouiller' : 'Verrouiller'}
                    onClick={() => onPatchCalque(c, { verrouille: !c.verrouille })}
                  >
                    {c.verrouille ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </IconBtn>
                  <IconBtn danger title="Supprimer le calque" onClick={() => askDelete(c, count)}>
                    <Trash2 className="h-3 w-3" />
                  </IconBtn>
                </span>
              )}
            </div>
            <p className="pl-[26px] text-[9.5px] italic leading-snug opacity-50">{meta.hint}</p>
          </div>
        );
      })}
    </div>
  );


  return (
    <div className="flex flex-col gap-4 text-[hsl(var(--ds-forest-deep))]">
      {/* Vues de fond */}
      <section>
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-forest))]/70">
          <Layers className="h-3 w-3" /> Vues de fond
        </h4>
        <div className="space-y-0.5">
          {(
            [
              ['parcelles', 'Parcelles cadastrales'],
              ['zones', 'Emplacements'],
            ] as Array<[keyof SystemLayerState, string]>
          ).map(([k, label]) => (
            <div key={k} className={`${rowBase} hover:bg-[hsl(var(--ds-forest))]/5`}>
              <IconBtn
                title={system[k] ? 'Masquer' : 'Afficher'}
                onClick={() => onSystem({ [k]: !system[k] } as any)}
              >
                {system[k] ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </IconBtn>
              <span className={system[k] ? '' : 'opacity-45'}>{label}</span>
            </div>
          ))}

          {/* Observations du vivant : affichage + portée (cadastre / tous) */}
          <div className={`${rowBase} hover:bg-[hsl(var(--ds-forest))]/5`}>
            <IconBtn
              title={system.vivant ? 'Masquer' : 'Afficher'}
              onClick={() => onSystem({ vivant: !system.vivant })}
            >
              {system.vivant ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </IconBtn>
            <span className={system.vivant ? '' : 'opacity-45'}>Observations du vivant</span>
          </div>
          <div
            className={`space-y-1.5 pl-8 pb-1 ${system.vivant ? '' : 'pointer-events-none opacity-45'}`}
          >
            <VivantScopeSwitch counts={scopeCounts} />
            <VivantPeriodFilter visibleCount={scopeCounts?.all} />
          </div>

          {/* Carottes de sol · issues de l'étape « J'analyse le sol » */}
          <div className={`${rowBase} hover:bg-[hsl(var(--ds-forest))]/5`}>
            <IconBtn
              title={system.sol ? 'Masquer' : 'Afficher'}
              onClick={() => onSystem({ sol: !system.sol })}
            >
              {system.sol ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </IconBtn>
            <span className={system.sol ? '' : 'opacity-45'}>
              Prélèvements de sol
              {typeof soilCount === 'number' && (
                <span className="ml-1 opacity-55">· {soilCount}</span>
              )}
            </span>
          </div>
          {system.sol && (
            <p className="pl-8 pb-1 text-[9.5px] italic leading-snug opacity-55">
              Carottes A, B, C… de l’étape « J’analyse ». Glissez-les pour corriger leur
              position, reliez-les à un ouvrage depuis son éditeur.
            </p>
          )}

        </div>
      </section>


      {/* Emplacements */}
      <section>
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-forest))]/70">
          Emplacements · {zones.length}
        </h4>
        <div className="space-y-0.5">
          {zones.length === 0 && (
            <p className="px-2 text-[11px] italic opacity-55">
              Aucun emplacement. Dessinez-en un pour obtenir une palette par lieu.
            </p>
          )}
          {zones.map((z, i) => {
            const color = z.couleur || ZONE_COLORS[i % ZONE_COLORS.length];
            const active = z.id === activeZoneId;
            return (
              <div
                key={z.id}
                onClick={() => onSelectZone(active ? null : z.id)}
                className={`${rowBase} cursor-pointer ${
                  active ? 'bg-[hsl(var(--ds-forest))]/12' : 'hover:bg-[hsl(var(--ds-forest))]/5'
                }`}
              >
                <IconBtn
                  title={z.visible ? 'Masquer' : 'Afficher'}
                  onClick={() => onPatchZone(z, { visible: !z.visible })}
                >
                  {z.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </IconBtn>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {editing === `z-${z.id}` ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      onPatchZone(z, { nom: draft.trim() || z.nom });
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    className="min-w-0 flex-1 rounded border border-[hsl(var(--ds-line))] bg-white/70 px-1 py-0.5 text-[11px]"
                  />
                ) : (
                  <span
                    className={`min-w-0 flex-1 truncate ${z.visible ? '' : 'opacity-45'}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!readOnly) startEdit(`z-${z.id}`, z.nom);
                    }}
                  >
                    {z.nom}
                    {z.surface_m2 ? (
                      <span className="ml-1 opacity-50">· {fmtArea(z.surface_m2)}</span>
                    ) : null}
                  </span>
                )}
                {!readOnly && (
                  <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn title="Renommer" onClick={() => startEdit(`z-${z.id}`, z.nom)}>
                      <Pencil className="h-3 w-3" />
                    </IconBtn>
                    {onTransformZone && (
                      <IconBtn
                        title="Transformer : déplacer, redimensionner, lisser"
                        onClick={() => onTransformZone(z.id)}
                      >
                        <Move3d className="h-3 w-3" />
                      </IconBtn>
                    )}
                    <IconBtn title="Redessiner le contour" onClick={() => onRedrawZone(z.id)}>
                      <Check className="h-3 w-3 rotate-45" />
                    </IconBtn>
                    <IconBtn
                      title={z.verrouille ? 'Déverrouiller' : 'Verrouiller'}
                      onClick={() => onPatchZone(z, { verrouille: !z.verrouille })}
                    >
                      {z.verrouille ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      )}
                    </IconBtn>
                    <IconBtn danger title="Supprimer" onClick={() => onDeleteZone(z.id)}>
                      <Trash2 className="h-3 w-3" />
                    </IconBtn>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Calques */}
      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--ds-forest))]/70">
            Calques · {calques.length}
          </h4>
          {!readOnly && (
            <button
              onClick={onCreateCalque}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2 py-0.5 text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
            >
              <Plus className="h-3 w-3" /> Calque
            </button>
          )}
        </div>
        {renderCalques(nonEmpty)}
        {emptyOnes.length > 0 && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowEmpty((v) => !v)}
              className="flex w-full items-center gap-1 rounded-lg px-2 py-1 text-[10px] italic opacity-60 hover:bg-[hsl(var(--ds-forest))]/5 hover:opacity-90"
            >
              {showEmpty ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3 rotate-90" />
              )}
              {emptyOnes.length} calque{emptyOnes.length > 1 ? 's' : ''} vide
              {emptyOnes.length > 1 ? 's' : ''}
            </button>
            {showEmpty && <div className="mt-0.5 space-y-0.5">{renderCalques(emptyOnes)}</div>}
          </div>
        )}

        {activeCalqueId && !readOnly && (
          <div className="mt-2 px-2">
            <label className="flex items-center gap-2 text-[10px] opacity-70">
              Opacité
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={calques.find((c) => c.id === activeCalqueId)?.opacite ?? 1}
                onChange={(e) => {
                  const c = calques.find((x) => x.id === activeCalqueId);
                  if (c) onPatchCalque(c, { opacite: Number(e.target.value) });
                }}
                className="flex-1 accent-[hsl(var(--ds-forest))]"
              />
            </label>
          </div>
        )}
      </section>
    </div>
  );
};

export default LayersPanel;
