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

  const ink = 'text-[hsl(var(--ds-ink))]';
  const soft = 'text-[hsl(var(--ds-ink-soft))]';

  return (
    <div className="fixed inset-0 z-[3400] flex items-center justify-center bg-[hsl(var(--ds-forest-deep))]/70 p-4 backdrop-blur-sm">
      <div
        className={`flex max-h-[86vh] w-full max-w-[880px] flex-col overflow-hidden rounded-[20px] border border-[hsl(var(--ds-gold))]/45 bg-[hsl(var(--ds-cream))] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ${ink}`}
      >
        <header className="relative overflow-hidden border-b border-[hsl(var(--ds-line))] px-6 py-5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[hsl(var(--ds-forest))] via-[hsl(var(--ds-gold))] to-transparent"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[hsl(var(--ds-earth))]">
            Le Chantier
          </p>
          <h2 className="mt-1 font-serif text-[26px] italic leading-tight text-[hsl(var(--ds-forest-deep))]">
            Quels ouvrages entrent dans ce chantier&nbsp;?
          </h2>
          <p className={`mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed ${soft}`}>
            Tout le module ne parlera plus que de ce périmètre : espèces, prélèvements, ICG,
            photographies, rapport.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          {/* Lots existants */}
          <section className="min-h-0 overflow-y-auto border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-line))]/20 p-5 md:border-b-0 md:border-r">
            <p className={`mb-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] ${soft}`}>
              Chantiers enregistrés
            </p>
            {chantiers.length === 0 && (
              <p
                className={`rounded-xl border border-dashed border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 px-4 py-7 text-center text-[12.5px] italic ${soft}`}
              >
                Aucun chantier encore ouvert sur cette propriété.
              </p>
            )}
            <ul className="space-y-2">
              {chantiers.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center gap-2 rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[hsl(var(--ds-gold))] hover:shadow-[0_4px_14px_-6px_rgba(0,0,0,0.35)]"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(c)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[13.5px] font-semibold">{c.nom}</span>
                    <span className={`mt-0.5 block text-[11px] ${soft}`}>
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
                    className={`rounded-md p-1.5 opacity-0 transition group-hover:opacity-70 hover:!opacity-100 hover:bg-[hsl(var(--ds-verdict-non))]/10 ${soft}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Nouveau lot */}
          <section className="min-h-0 overflow-y-auto p-5">
            <p className={`mb-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] ${soft}`}>
              Composer un nouveau lot
            </p>
            <ul className="mb-4 space-y-1.5">
              {objets.map((o) => {
                const on = selected.includes(o.id);
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => toggle(o.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] transition ${
                        on
                          ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15 font-semibold'
                          : 'border-[hsl(var(--ds-line))] bg-white/40 hover:border-[hsl(var(--ds-gold))]/70 hover:bg-[hsl(var(--ds-gold))]/[0.06]'
                      }`}
                    >
                      <span className="text-[15px] leading-none">
                        {TOOL_BY_KEY[o.outil_key]?.glyph ?? '🌿'}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{labelOf(o)}</span>
                      {on && <Check className="h-4 w-4 text-[hsl(var(--ds-forest))]" />}
                    </button>
                  </li>
                );
              })}
              {objets.length === 0 && (
                <li className={`text-[12.5px] italic ${soft}`}>
                  Dessinez d'abord un ouvrage dans l'Atelier.
                </li>
              )}
            </ul>

            <label className="mb-3 block">
              <span
                className={`mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] ${soft}`}
              >
                Nom du chantier
              </span>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={selected.length ? defaultName : 'Massif Fréquence 01'}
                className="w-full rounded-lg border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2 text-[13px] text-[hsl(var(--ds-ink))] placeholder:text-[hsl(var(--ds-ink-soft))]/60 outline-none transition focus:border-[hsl(var(--ds-gold))] focus:bg-white"
              />
            </label>
            <label className="mb-4 block">
              <span
                className={`mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${soft}`}
              >
                <CalendarDays className="h-3 w-3" /> Date des travaux
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2 text-[13px] text-[hsl(var(--ds-ink))] outline-none transition focus:border-[hsl(var(--ds-gold))] focus:bg-white"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--ds-forest-deep))] px-4 py-2.5 text-[13px] font-semibold text-[hsl(var(--ds-cream))] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)] transition hover:bg-[hsl(var(--ds-forest))] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              <Plus className="h-4 w-4" />
              {selected.length > 1
                ? `Ouvrir le chantier · ${selected.length} ouvrages`
                : 'Ouvrir le chantier'}
            </button>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-line))]/20 px-6 py-3.5">
          <span className={`inline-flex items-center gap-1.5 text-[11.5px] italic ${soft}`}>
            <Hammer className="h-3.5 w-3.5" /> Avant / après, preuve à l'appui.
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-4 py-1.5 text-[12.5px] font-medium transition hover:border-[hsl(var(--ds-gold))] hover:bg-white ${ink}`}
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ChantierLotPicker;
