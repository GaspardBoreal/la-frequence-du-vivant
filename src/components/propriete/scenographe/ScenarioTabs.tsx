import React from 'react';
import { Plus, Copy, Trash2, Star, Check, Pencil } from 'lucide-react';
import type { OuvrageScenario } from '@/hooks/propriete/useOuvrageScenarios';

interface Props {
  scenarios: OuvrageScenario[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRetenu: (id: string) => void;
  onRename: (id: string, nom: string) => void;
  readOnly?: boolean;
}

/**
 * Les variantes d'un même lieu. On ne dessine jamais un seul projet : on en
 * compare plusieurs, et l'un d'eux est « retenu » pour le rapport client.
 */
export const ScenarioTabs: React.FC<Props> = ({
  scenarios,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onRetenu,
  onRename,
  readOnly,
}) => {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');

  const commit = () => {
    if (editing && draft.trim()) onRename(editing, draft.trim());
    setEditing(null);
  };

  const active = scenarios.find((s) => s.id === activeId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {scenarios.map((s) => {
        const isActive = s.id === activeId;
        return (
          <div
            key={s.id}
            className={`group flex items-center gap-1 rounded-full border px-2.5 py-1 transition-all ${
              isActive
                ? 'border-[hsl(var(--ds-forest-deep))] bg-[hsl(var(--ds-forest-deep))] text-white'
                : 'border-[hsl(var(--ds-line))] bg-white/70 text-[hsl(var(--ds-forest-deep))] hover:bg-white'
            }`}
          >
            {s.retenu && <Star className="h-3 w-3 fill-[#c8a24a] text-[#c8a24a]" />}
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
                className="w-24 bg-transparent text-[11px] outline-none"
              />
            ) : (
              <button
                onClick={() => onSelect(s.id)}
                onDoubleClick={() => {
                  if (readOnly) return;
                  setEditing(s.id);
                  setDraft(s.nom);
                }}
                className="text-[11px] font-medium"
              >
                {s.nom}
                <span className={`ml-1 text-[9.5px] ${isActive ? 'opacity-65' : 'opacity-45'}`}>
                  {s.plantings.length}
                </span>
              </button>
            )}
          </div>
        );
      })}

      {!readOnly && (
        <button
          onClick={onCreate}
          className="flex items-center gap-1 rounded-full border border-dashed border-[hsl(var(--ds-line))] px-2.5 py-1 text-[11px] opacity-70 transition-opacity hover:opacity-100"
        >
          <Plus className="h-3 w-3" />
          Scénario
        </button>
      )}

      {active && !readOnly && (
        <span className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onRetenu(active.id)}
            disabled={active.retenu}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
              active.retenu
                ? 'bg-[#c8a24a]/18 text-[#8a6b1f]'
                : 'bg-[#c8a24a] text-white hover:bg-[#b58f3d]'
            }`}
          >
            {active.retenu ? <Check className="h-3 w-3" /> : <Star className="h-3 w-3" />}
            {active.retenu ? 'Retenu' : 'Retenir'}
          </button>
          <button
            onClick={() => {
              setEditing(active.id);
              setDraft(active.nom);
            }}
            title="Renommer"
            className="rounded-full p-1.5 opacity-55 hover:opacity-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDuplicate(active.id)}
            title="Dupliquer"
            className="rounded-full p-1.5 opacity-55 hover:opacity-100"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Supprimer « ${active.nom} » ?`)) onDelete(active.id);
            }}
            title="Supprimer"
            className="rounded-full p-1.5 opacity-55 hover:text-[#c1663f] hover:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>
  );
};

export default ScenarioTabs;
