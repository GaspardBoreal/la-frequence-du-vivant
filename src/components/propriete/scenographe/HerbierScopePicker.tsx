import React from 'react';
import { Check, ChevronDown, Layers } from 'lucide-react';
import { TOOL_BY_KEY } from '@/lib/paysageTools';

export interface ScopeObjet {
  id: string;
  nom: string | null;
  outil_key: string;
  geometry: any;
}

export type ScopeMode = 'courant' | 'choisis' | 'tous';

interface Props {
  objets: ScopeObjet[];
  currentId: string;
  mode: ScopeMode;
  selectedIds: string[];
  onMode: (m: ScopeMode) => void;
  onSelected: (ids: string[]) => void;
}

const MODES: Array<{ key: ScopeMode; label: string }> = [
  { key: 'courant', label: 'Cet ouvrage' },
  { key: 'choisis', label: 'Ouvrages choisis' },
  { key: 'tous', label: 'Toute la propriété' },
];

/**
 * Portée de l'herbier « En place » : on écoute l'emprise de l'ouvrage courant,
 * celle de plusieurs ouvrages choisis, ou tout le lieu — pour composer vite
 * à partir de ce que le jardin porte déjà.
 */
export const HerbierScopePicker: React.FC<Props> = ({
  objets,
  currentId,
  mode,
  selectedIds,
  onMode,
  onSelected,
}) => {
  const [open, setOpen] = React.useState(false);
  const others = objets.filter((o) => o.id !== currentId);

  const toggle = (id: string) =>
    onSelected(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              onMode(m.key);
              setOpen(m.key === 'choisis');
            }}
            className={`rounded-full px-2 py-0.5 text-[9.5px] font-medium transition-colors ${
              mode === m.key
                ? 'bg-[hsl(var(--ds-forest-deep))] text-white'
                : 'bg-white/60 text-[hsl(var(--ds-forest-deep))]/70 hover:bg-white'
            }`}
          >
            {m.label}
            {m.key === 'choisis' && selectedIds.length > 0 && (
              <span className="ml-1 opacity-70">{selectedIds.length}</span>
            )}
          </button>
        ))}
      </div>

      {mode === 'choisis' && (
        <div className="rounded-lg border border-[hsl(var(--ds-line))] bg-white/60">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-70"
          >
            <Layers className="h-3 w-3" />
            Ouvrages écoutés
            <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="max-h-40 space-y-px overflow-y-auto border-t border-[hsl(var(--ds-line))]/60 px-1 py-1">
              {others.length ? (
                others.map((o) => {
                  const tool = TOOL_BY_KEY[o.outil_key];
                  const on = selectedIds.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(o.id)}
                      className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[10.5px] transition-colors ${
                        on ? 'bg-[hsl(var(--ds-forest-deep))]/10 font-medium' : 'hover:bg-white'
                      }`}
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                          on
                            ? 'border-[hsl(var(--ds-forest-deep))] bg-[hsl(var(--ds-forest-deep))] text-white'
                            : 'border-[hsl(var(--ds-line))]'
                        }`}
                      >
                        {on && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span className="text-[11px]">{tool?.glyph ?? '🌿'}</span>
                      <span className="truncate">{o.nom?.trim() || tool?.label || 'Ouvrage'}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-1.5 py-2 text-[10px] italic opacity-55">
                  Aucun autre ouvrage dessiné sur cette propriété.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HerbierScopePicker;
