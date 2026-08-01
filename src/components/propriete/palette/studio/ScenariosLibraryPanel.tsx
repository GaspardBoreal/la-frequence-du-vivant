import React from 'react';
import { Copy, Layers, Pencil, Star, Trash2, Wand2, X } from 'lucide-react';
import { useProprieteScenarios } from '@/hooks/propriete/useProprieteScenarios';
import { openScenographe } from '@/components/propriete/scenographe/scenographeStore';
import { STRATES } from '@/lib/plantSpread';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import type { OuvrageScenario } from '@/hooks/propriete/useOuvrageScenarios';

interface Props {
  proprieteId: string;
  objets: ProprieteObjet[];
  /** Ouvrage sélectionné sur le plan — active le filtre « cet ouvrage ». */
  selectedObjetId?: string | null;
  readOnly?: boolean;
  onClose: () => void;
  /** Survol d'une ligne : met en évidence l'emprise correspondante. */
  onHoverObjet?: (objetId: string | null) => void;
}

type Filter = 'tous' | 'courant' | 'retenus';

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';

/**
 * La bibliothèque des scénographies : toutes les variantes composées sur la
 * propriété, regroupées par ouvrage, rouvrables d'un clic.
 */
export const ScenariosLibraryPanel: React.FC<Props> = ({
  proprieteId,
  objets,
  selectedObjetId,
  readOnly,
  onClose,
  onHoverObjet,
}) => {
  const { scenarios, loading, patch, remove, setRetenu, duplicate } =
    useProprieteScenarios(proprieteId);
  const [filter, setFilter] = React.useState<Filter>(selectedObjetId ? 'courant' : 'tous');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');

  const labelOf = React.useCallback(
    (objetId: string) => {
      const o = objets.find((x) => x.id === objetId);
      return o?.nom?.trim() || TOOL_BY_KEY[o?.outil_key ?? '']?.label || 'Ouvrage';
    },
    [objets],
  );

  const filtered = React.useMemo(() => {
    if (filter === 'retenus') return scenarios.filter((s) => s.retenu);
    if (filter === 'courant' && selectedObjetId)
      return scenarios.filter((s) => s.objet_id === selectedObjetId);
    return scenarios;
  }, [scenarios, filter, selectedObjetId]);

  const groups = React.useMemo(() => {
    const by = new Map<string, OuvrageScenario[]>();
    filtered.forEach((s) => {
      const arr = by.get(s.objet_id) ?? [];
      arr.push(s);
      by.set(s.objet_id, arr);
    });
    return Array.from(by.entries());
  }, [filtered]);

  const commit = () => {
    if (editing && draft.trim()) void patch(editing, { nom: draft.trim() });
    setEditing(null);
  };

  const chip = (k: Filter, label: string, disabled?: boolean) => (
    <button
      key={k}
      disabled={disabled}
      onClick={() => setFilter(k)}
      className={`rounded-full px-2 py-0.5 text-[9.5px] transition-colors disabled:opacity-30 ${
        filter === k
          ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]'
          : 'border border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/60'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex max-h-full flex-col overflow-hidden rounded-xl border border-[#c8a24a]/45 bg-[hsl(var(--ds-cream))]/97 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-[hsl(var(--ds-line))] px-3 py-2">
        <Wand2 className="h-3.5 w-3.5 text-[#c8a24a]" />
        <span className="text-[11.5px] font-semibold">Scénographies</span>
        <span className="rounded-full bg-[#c8a24a]/15 px-1.5 text-[9.5px] text-[#8a6b1f]">
          {loading ? '…' : scenarios.length}
        </span>
        <button
          onClick={onClose}
          className="ml-auto rounded-md p-1 opacity-55 hover:opacity-100"
          aria-label="Fermer la bibliothèque"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[hsl(var(--ds-line))]/70 px-3 py-1.5">
        {chip('tous', 'Tous')}
        {chip('courant', 'Cet ouvrage', !selectedObjetId)}
        {chip('retenus', 'Retenus')}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {!loading && !filtered.length && (
          <p className="rounded-lg border border-dashed border-[hsl(var(--ds-line))] px-2.5 py-3 text-[10.5px] italic opacity-60">
            Aucune scénographie — sélectionnez un ouvrage sur le plan et composez-en une.
          </p>
        )}

        {groups.map(([objetId, list]) => (
          <div key={objetId} className="mb-2.5">
            <p
              onMouseEnter={() => onHoverObjet?.(objetId)}
              onMouseLeave={() => onHoverObjet?.(null)}
              className="mb-1 truncate text-[9.5px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--ds-forest))]/80"
            >
              {labelOf(objetId)}
            </p>
            <div className="space-y-1">
              {list.map((s) => {
                const strates = Array.from(new Set((s.plantings || []).map((p) => p.strate)));
                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => onHoverObjet?.(s.objet_id)}
                    onMouseLeave={() => onHoverObjet?.(null)}
                    className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--ds-line))]/70 bg-white/70 px-2 py-1.5"
                  >
                    {s.retenu && <Star className="h-3 w-3 shrink-0 fill-[#c8a24a] text-[#c8a24a]" />}
                    {editing === s.id ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commit();
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="min-w-0 flex-1 rounded border border-[hsl(var(--ds-line))] bg-white px-1.5 py-0.5 text-[11px] outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => openScenographe(s.objet_id, { scenarioId: s.id })}
                        title="Ouvrir dans le Scénographe"
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                          {s.nom}
                        </span>
                        <span className="flex flex-wrap items-center gap-1 text-[9px] opacity-60">
                          {s.plantings?.length || 0} sujet
                          {(s.plantings?.length || 0) > 1 ? 's' : ''}
                          {strates.length > 0 && (
                            <span className="flex items-center gap-0.5">
                              · <Layers className="h-2.5 w-2.5" />
                              {strates.map((st) => STRATES[st]?.glyph ?? '').join(' ')}
                            </span>
                          )}
                          <span>· {fmtDate(s.updated_at || s.created_at)}</span>
                        </span>
                      </button>
                    )}

                    {!readOnly && (
                      <span className="flex items-center">
                        <button
                          onClick={() => void setRetenu(s.id)}
                          disabled={s.retenu}
                          title="Retenir pour le rapport"
                          className="rounded-full p-1 opacity-55 hover:opacity-100 disabled:opacity-20"
                        >
                          <Star className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditing(s.id);
                            setDraft(s.nom);
                          }}
                          title="Renommer"
                          className="rounded-full p-1 opacity-55 hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => void duplicate(s.id)}
                          title="Dupliquer"
                          className="rounded-full p-1 opacity-55 hover:opacity-100"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Supprimer « ${s.nom} » ?`)) void remove(s.id);
                          }}
                          title="Supprimer"
                          className="rounded-full p-1 opacity-55 hover:text-[#c1663f] hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenariosLibraryPanel;
