import React from 'react';
import { Check, Hammer, Plus, Trash2, CalendarDays } from 'lucide-react';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import type { ProprieteChantier } from '@/hooks/propriete/useProprieteChantiers';

interface Props {
  objets: ProprieteObjet[];
  chantiers: ProprieteChantier[];
  onOpen: (chantier: ProprieteChantier) => void;
  onCreate: (input: { nom: string; objet_ids: string[]; date_travaux: string | null }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'date à fixer';

/**
 * Choix du lot de chantier : reprendre un lot existant, ou composer un
 * nouvel ensemble d'ouvrages (un massif seul, ou massif + mare + haie).
 */
export const ChantierLotPicker: React.FC<Props> = ({
  objets,
  chantiers,
  onOpen,
  onCreate,
  onDelete,
  onClose,
}) => {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [nom, setNom] = React.useState('');
  const [date, setDate] = React.useState('');

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const labelOf = (o: ProprieteObjet) =>
    o.nom?.trim() || TOOL_BY_KEY[o.outil_key]?.label || 'Ouvrage';

  const defaultName =
    selected.length === 1
      ? labelOf(objets.find((o) => o.id === selected[0])!)
      : `Chantier de ${selected.length} ouvrages`;

  return (
    <div className="fixed inset-0 z-[3400] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[86vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-[#c8a24a]/40 bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-ink))] shadow-2xl">
        <header className="border-b border-[hsl(var(--ds-line))] px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8a6d3b]">Le Chantier</p>
          <h2 className="font-serif text-[24px] italic leading-tight">
            Quels ouvrages entrent dans ce chantier ?
          </h2>
          <p className="mt-1 text-[12px] opacity-65">
            Tout le module ne parlera plus que de ce périmètre : espèces, prélèvements, ICG,
            photographies, rapport.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          {/* Lots existants */}
          <section className="min-h-0 overflow-y-auto border-b border-[hsl(var(--ds-line))] p-4 md:border-b-0 md:border-r">
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] opacity-55">
              Chantiers enregistrés
            </p>
            {chantiers.length === 0 && (
              <p className="rounded-xl border border-dashed border-[hsl(var(--ds-line))] px-3 py-6 text-center text-[12px] italic opacity-60">
                Aucun chantier encore ouvert sur cette propriété.
              </p>
            )}
            <ul className="space-y-2">
              {chantiers.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center gap-2 rounded-xl border border-[hsl(var(--ds-line))] px-3 py-2.5 transition hover:border-[#c8a24a]"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(c)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[13px] font-semibold">{c.nom}</span>
                    <span className="block text-[11px] opacity-60">
                      {c.objet_ids.length} ouvrage{c.objet_ids.length > 1 ? 's' : ''} ·{' '}
                      {fmtDate(c.date_travaux)}
                    </span>
                  </button>
                  <button
                    type="button"
                    title="Supprimer ce chantier"
                    onClick={() => {
                      if (window.confirm(`Supprimer le chantier « ${c.nom} » ?`)) onDelete(c.id);
                    }}
                    className="rounded-md p-1 opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Nouveau lot */}
          <section className="min-h-0 overflow-y-auto p-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] opacity-55">
              Composer un nouveau lot
            </p>
            <ul className="mb-3 space-y-1.5">
              {objets.map((o) => {
                const on = selected.includes(o.id);
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => toggle(o.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[12.5px] transition ${
                        on
                          ? 'border-[#c8a24a] bg-[#c8a24a]/12'
                          : 'border-[hsl(var(--ds-line))] hover:border-[#c8a24a]/60'
                      }`}
                    >
                      <span className="text-[15px]">{TOOL_BY_KEY[o.outil_key]?.glyph ?? '🌿'}</span>
                      <span className="min-w-0 flex-1 truncate">{labelOf(o)}</span>
                      {on && <Check className="h-3.5 w-3.5 text-[#8a6d3b]" />}
                    </button>
                  </li>
                );
              })}
              {objets.length === 0 && (
                <li className="text-[12px] italic opacity-60">
                  Dessinez d'abord un ouvrage dans l'Atelier.
                </li>
              )}
            </ul>

            <label className="mb-2 block">
              <span className="mb-1 block text-[11px] opacity-60">Nom du chantier</span>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={selected.length ? defaultName : 'Massif Fréquence 01'}
                className="w-full rounded-lg border border-[hsl(var(--ds-line))] bg-transparent px-2.5 py-1.5 text-[13px] outline-none focus:border-[#c8a24a]"
              />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 flex items-center gap-1.5 text-[11px] opacity-60">
                <CalendarDays className="h-3 w-3" /> Date des travaux
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--ds-line))] bg-transparent px-2.5 py-1.5 text-[13px] outline-none focus:border-[#c8a24a]"
              />
            </label>

            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() =>
                onCreate({
                  nom: nom.trim() || defaultName,
                  objet_ids: selected,
                  date_travaux: date || null,
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--ds-forest-deep))] px-4 py-2 text-[12.5px] text-[hsl(var(--ds-cream))] transition disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Ouvrir le chantier
            </button>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-[hsl(var(--ds-line))] px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] italic opacity-55">
            <Hammer className="h-3.5 w-3.5" /> Avant / après, preuve à l'appui.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[12px] hover:border-[#c8a24a]"
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ChantierLotPicker;
