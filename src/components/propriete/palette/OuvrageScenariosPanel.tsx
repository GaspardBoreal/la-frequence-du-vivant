import React from 'react';
import { Copy, Layers, Pencil, Plus, Star, Trash2, Wand2 } from 'lucide-react';
import { useOuvrageScenarios } from '@/hooks/propriete/useOuvrageScenarios';
import { openScenographe } from '@/components/propriete/scenographe/scenographeStore';
import { STRATES } from '@/lib/plantSpread';

interface Props {
  proprieteId?: string;
  objetId: string;
  readOnly?: boolean;
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';

/**
 * Les scénographies déjà composées pour cet ouvrage : on les relit, on les
 * renomme, on en retient une pour le rapport — sans repasser par le plan.
 */
export const OuvrageScenariosPanel: React.FC<Props> = ({ proprieteId, objetId, readOnly }) => {
  const { scenarios, loading, create, patch, remove, setRetenu, duplicate } = useOuvrageScenarios(
    proprieteId,
    objetId,
  );
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');

  const commit = () => {
    if (editing && draft.trim()) void patch(editing, { nom: draft.trim() });
    setEditing(null);
  };

  return (
    <div className="mt-3 rounded-xl border border-[hsl(var(--ds-line))] bg-white/45 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]/80">
        <Wand2 className="h-3 w-3" /> Scénographies
        <span className="ml-auto font-normal tracking-normal opacity-60">
          {loading ? '…' : `${scenarios.length} scénario${scenarios.length > 1 ? 's' : ''}`}
        </span>
      </p>

      <div className="mt-2 space-y-1.5">
        {scenarios.map((s) => {
          const strates = Array.from(new Set((s.plantings || []).map((p) => p.strate)));
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-[hsl(var(--ds-line))]/70 bg-white/70 px-2.5 py-1.5"
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
                  className="min-w-0 flex-1 rounded border border-[hsl(var(--ds-line))] bg-white px-1.5 py-0.5 text-[11.5px] outline-none"
                />
              ) : (
                <button
                  onClick={() => openScenographe(objetId, { scenarioId: s.id })}
                  className="min-w-0 flex-1 text-left"
                  title="Ouvrir dans le Scénographe"
                >
                  <span className="block truncate text-[11.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                    {s.nom}
                  </span>
                  <span className="flex flex-wrap items-center gap-1 text-[9.5px] opacity-60">
                    {s.plantings?.length || 0} sujet{(s.plantings?.length || 0) > 1 ? 's' : ''}
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

              <span className="flex items-center gap-0.5">
                <button
                  onClick={() => openScenographe(objetId, { scenarioId: s.id })}
                  className="rounded-full px-2 py-1 text-[10px] font-medium text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest-deep))]/10"
                >
                  Ouvrir
                </button>
                {!readOnly && (
                  <>
                    <button
                      onClick={() => void setRetenu(s.id)}
                      disabled={s.retenu}
                      title="Retenir pour le rapport"
                      className="rounded-full p-1.5 opacity-55 hover:opacity-100 disabled:opacity-25"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(s.id);
                        setDraft(s.nom);
                      }}
                      title="Renommer"
                      className="rounded-full p-1.5 opacity-55 hover:opacity-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => void duplicate(s.id)}
                      title="Dupliquer"
                      className="rounded-full p-1.5 opacity-55 hover:opacity-100"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer « ${s.nom} » ?`)) void remove(s.id);
                      }}
                      title="Supprimer"
                      className="rounded-full p-1.5 opacity-55 hover:text-[#c1663f] hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </span>
            </div>
          );
        })}

        {!loading && !scenarios.length && (
          <p className="rounded-lg border border-dashed border-[hsl(var(--ds-line))] px-2.5 py-2 text-[10.5px] italic opacity-60">
            Aucune scénographie pour cet ouvrage — composez une première variante sur le plan.
          </p>
        )}

        {!readOnly && (
          <button
            onClick={async () => {
              if (!scenarios.length) await create([]);
              openScenographe(objetId);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-[hsl(var(--ds-line))] px-2.5 py-1.5 text-[10.5px] font-medium opacity-75 transition-opacity hover:opacity-100"
          >
            <Plus className="h-3 w-3" />
            {scenarios.length ? 'Nouveau scénario' : 'Ouvrir le Scénographe'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OuvrageScenariosPanel;
