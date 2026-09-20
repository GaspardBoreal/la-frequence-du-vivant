import React from 'react';
import { Check, Hammer, Plus, Trash2, CalendarDays, PenLine, Trees, X } from 'lucide-react';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY, type PaysageTool } from '@/lib/paysageTools';
import type { ProprieteChantier } from '@/hooks/propriete/useProprieteChantiers';

interface Props {
  objets: ProprieteObjet[];
  chantiers: ProprieteChantier[];
  onOpen: (chantier: ProprieteChantier) => void;
  onCreate: (input: { nom: string; objet_ids: string[]; date_travaux: string | null }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  /** Droit d'écriture sur le jardin (propriétaire, prestataire, équipe). */
  canEdit?: boolean;
  /** Arme un outil de dessin sur le plan pour créer un ouvrage sans quitter le chantier. */
  onDrawNew?: (tool: PaysageTool) => void;
  /** Ouvrages à cocher d'emblée (retour de dessin). */
  preselect?: string[];
  /** Renommage d'un ouvrage depuis cette fenêtre. */
  onRenameObjet?: (id: string, nom: string) => void | Promise<void>;
  /** Modification d'un chantier enregistré (nom, date, lot). */
  onPatch?: (
    id: string,
    values: { nom?: string; date_travaux?: string | null; objet_ids?: string[] },
  ) => void | Promise<void>;
}

/** Tracés les plus courants proposés directement dans la fenêtre du chantier. */
const QUICK_TOOL_KEYS = [
  'massif-polychrome',
  'potager',
  'haie-bocagere',
  'mare',
  'verger',
  'cheminement',
];

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
  canEdit = true,
  onDrawNew,
  preselect,
  onRenameObjet,
  onPatch,
}) => {
  const [selected, setSelected] = React.useState<string[]>(preselect ?? []);
  const [scope, setScope] = React.useState<'ouvrages' | 'jardin'>('ouvrages');
  const [nom, setNom] = React.useState('');
  const [date, setDate] = React.useState('');
  /** Bandeau de retour de tracé. */
  const [justDrawn, setJustDrawn] = React.useState<string | null>(null);
  /** Renommage inline d'un ouvrage. */
  const [renamingObjet, setRenamingObjet] = React.useState<string | null>(null);
  const [objetNom, setObjetNom] = React.useState('');
  /** Édition inline d'un chantier enregistré. */
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editNom, setEditNom] = React.useState('');
  const [editDate, setEditDate] = React.useState('');
  const [editLot, setEditLot] = React.useState<string[]>([]);

  const footerRef = React.useRef<HTMLDivElement | null>(null);

  const labelOf = (o: ProprieteObjet) =>
    o.nom?.trim() || TOOL_BY_KEY[o.outil_key]?.label || 'Ouvrage';

  /** Retour de dessin : le nouvel ouvrage arrive déjà coché, nommé et visible. */
  const preselectKey = (preselect ?? []).join(',');
  React.useEffect(() => {
    if (!preselectKey) return;
    const ids = preselectKey.split(',');
    setScope('ouvrages');
    setSelected((s) => Array.from(new Set([...s, ...ids])));
    setJustDrawn(ids[ids.length - 1] ?? null);
    const t = window.setTimeout(
      () => footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }),
      160,
    );
    return () => window.clearTimeout(t);
  }, [preselectKey]);

  const justDrawnLabel = React.useMemo(() => {
    const o = objets.find((x) => x.id === justDrawn);
    return o ? labelOf(o) : null;
  }, [justDrawn, objets]);

  /** Nom pré-rempli avec l'ouvrage tracé, tant que l'utilisateur n'a rien saisi. */
  React.useEffect(() => {
    if (justDrawnLabel && !nom.trim()) setNom(justDrawnLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justDrawnLabel]);

  const toggle = (id: string) => {
    setScope('ouvrages');
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const quickTools = React.useMemo(
    () => QUICK_TOOL_KEYS.map((k) => TOOL_BY_KEY[k]).filter(Boolean) as PaysageTool[],
    [],
  );

  const defaultName =
    scope === 'jardin'
      ? 'Chantier · tout le jardin'
      : selected.length === 1
        ? labelOf(objets.find((o) => o.id === selected[0])!)
        : `Chantier de ${selected.length} ouvrages`;

  const canSubmit = canEdit && (scope === 'jardin' || selected.length > 0);
  /** Lot composé mais non validé : on prévient avant de tout perdre. */
  const dirty = canSubmit && !editingId;

  const startEdit = (c: ProprieteChantier) => {
    setEditingId(c.id);
    setEditNom(c.nom);
    setEditDate(c.date_travaux ?? '');
    setEditLot(c.objet_ids);
  };

  const commitEdit = async () => {
    if (!editingId || !onPatch) return;
    await onPatch(editingId, {
      nom: editNom.trim() || 'Chantier',
      date_travaux: editDate || null,
      objet_ids: editLot,
    });
    setEditingId(null);
  };

  const handleClose = () => {
    if (
      dirty &&
      !window.confirm(
        'Ce lot n’a pas encore été ouvert en chantier. Fermer sans enregistrer ?',
      )
    )
      return;
    onClose();
  };

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
                Aucun chantier encore ouvert sur cette propriété. Composez un lot à droite, puis
                cliquez sur «&nbsp;Ouvrir le chantier&nbsp;» pour l'enregistrer.
              </p>
            )}
            <ul className="space-y-2">
              {chantiers.map((c) =>
                editingId === c.id ? (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-cream))] p-3"
                  >
                    <input
                      value={editNom}
                      onChange={(e) => setEditNom(e.target.value)}
                      placeholder="Nom du chantier"
                      className="mb-2 w-full rounded-lg border border-[hsl(var(--ds-line))] bg-white/70 px-2.5 py-1.5 text-[13px] outline-none focus:border-[hsl(var(--ds-gold))]"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="mb-2 w-full rounded-lg border border-[hsl(var(--ds-line))] bg-white/70 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[hsl(var(--ds-gold))]"
                    />
                    <p className={`mb-1.5 text-[10.5px] uppercase tracking-[0.14em] ${soft}`}>
                      Ouvrages du lot
                    </p>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {objets.map((o) => {
                        const on = editLot.includes(o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() =>
                              setEditLot((l) =>
                                l.includes(o.id) ? l.filter((x) => x !== o.id) : [...l, o.id],
                              )
                            }
                            className={`rounded-full border px-2.5 py-1 text-[11.5px] transition ${
                              on
                                ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15 font-semibold'
                                : 'border-[hsl(var(--ds-line))] bg-white/50'
                            }`}
                          >
                            {TOOL_BY_KEY[o.outil_key]?.glyph ?? '🌿'} {labelOf(o)}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setEditLot([])}
                        className={`rounded-full border px-2.5 py-1 text-[11.5px] transition ${
                          editLot.length === 0
                            ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15 font-semibold'
                            : 'border-dashed border-[hsl(var(--ds-line))] bg-white/50'
                        }`}
                      >
                        🌳 Tout le jardin
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void commitEdit()}
                        className="rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-[12px] font-semibold text-[hsl(var(--ds-cream))]"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={`rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[12px] ${soft}`}
                      >
                        Annuler
                      </button>
                    </div>
                  </li>
                ) : (
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
                        {c.objet_ids.length === 0
                          ? 'tout le jardin'
                          : `${c.objet_ids.length} ouvrage${c.objet_ids.length > 1 ? 's' : ''}`}{' '}
                        · {fmtDate(c.date_travaux)}
                      </span>
                    </button>
                    {canEdit && onPatch && (
                      <button
                        type="button"
                        title="Modifier ce chantier"
                        onClick={() => startEdit(c)}
                        className={`rounded-md p-1.5 opacity-0 transition group-hover:opacity-70 hover:!opacity-100 hover:bg-[hsl(var(--ds-gold))]/15 ${soft}`}
                      >
                        <PenLine className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canEdit && (
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
                    )}
                  </li>
                ),
              )}
            </ul>
          </section>

          {/* Nouveau lot */}
          <section className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <p className={`mb-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] ${soft}`}>
                Composer un nouveau lot
              </p>

              {justDrawnLabel && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/12 px-3.5 py-2.5 text-[12.5px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-forest))]" />
                  <span className="flex-1">
                    <strong>{justDrawnLabel}</strong> ajouté au lot — nommez puis ouvrez le chantier
                    pour l'enregistrer.
                  </span>
                  <button
                    type="button"
                    onClick={() => setJustDrawn(null)}
                    className={`rounded-md p-0.5 ${soft}`}
                    aria-label="Masquer ce rappel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <ul className="mb-4 space-y-1.5">
                {objets.map((o) => {
                  const on = selected.includes(o.id);
                  if (renamingObjet === o.id) {
                    return (
                      <li key={o.id} className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={objetNom}
                          onChange={(e) => setObjetNom(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void onRenameObjet?.(o.id, objetNom.trim());
                              setRenamingObjet(null);
                            }
                            if (e.key === 'Escape') setRenamingObjet(null);
                          }}
                          placeholder={labelOf(o)}
                          className="min-w-0 flex-1 rounded-lg border border-[hsl(var(--ds-gold))] bg-white px-3 py-2 text-[13px] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            void onRenameObjet?.(o.id, objetNom.trim());
                            setRenamingObjet(null);
                          }}
                          className="rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-[12px] font-semibold text-[hsl(var(--ds-cream))]"
                        >
                          OK
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={o.id} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggle(o.id)}
                        className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] transition ${
                          on
                            ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15 font-semibold'
                            : 'border-[hsl(var(--ds-line))] bg-white/40 hover:border-[hsl(var(--ds-gold))]/70 hover:bg-[hsl(var(--ds-gold))]/[0.06]'
                        } ${justDrawn === o.id ? 'ring-2 ring-[hsl(var(--ds-gold))]/60' : ''}`}
                      >
                        <span className="text-[15px] leading-none">
                          {TOOL_BY_KEY[o.outil_key]?.glyph ?? '🌿'}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{labelOf(o)}</span>
                        {on && <Check className="h-4 w-4 text-[hsl(var(--ds-forest))]" />}
                      </button>
                      {canEdit && onRenameObjet && (
                        <button
                          type="button"
                          title="Renommer cet ouvrage"
                          onClick={() => {
                            setRenamingObjet(o.id);
                            setObjetNom(o.nom ?? '');
                          }}
                          className={`rounded-md p-1.5 transition hover:bg-[hsl(var(--ds-gold))]/15 ${soft}`}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
                {objets.length === 0 && (
                  <li className={`text-[12.5px] italic ${soft}`}>
                    Aucun ouvrage dessiné pour l'instant — créez-en un ci-dessous, ou prenez tout le
                    jardin.
                  </li>
                )}
              </ul>

              {/* Tout le jardin : aucun tracé nécessaire */}
              <button
                type="button"
                onClick={() => {
                  setScope((s) => (s === 'jardin' ? 'ouvrages' : 'jardin'));
                  setSelected([]);
                }}
                className={`mb-4 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] transition ${
                  scope === 'jardin'
                    ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/15 font-semibold'
                    : 'border-dashed border-[hsl(var(--ds-line))] bg-white/40 hover:border-[hsl(var(--ds-gold))]/70'
                }`}
              >
                <Trees className="h-4 w-4 text-[hsl(var(--ds-forest))]" />
                <span className="min-w-0 flex-1">
                  Tout le jardin
                  <span className={`block text-[11px] font-normal ${soft}`}>
                    Le chantier prend l'ensemble de la propriété, sans tracé.
                  </span>
                </span>
                {scope === 'jardin' && <Check className="h-4 w-4 text-[hsl(var(--ds-forest))]" />}
              </button>

              {/* Créer un ouvrage sans quitter la fenêtre */}
              {canEdit && onDrawNew && (
                <div className="mb-4 rounded-xl border border-[hsl(var(--ds-line))] bg-white/45 p-3">
                  <p
                    className={`mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${soft}`}
                  >
                    <PenLine className="h-3 w-3" /> Nouvel ouvrage
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTools.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => onDrawNew(t)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-3 py-1.5 text-[12px] transition hover:border-[hsl(var(--ds-gold))] hover:bg-white"
                      >
                        <span className="leading-none">{t.glyph}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className={`mt-2 text-[11px] italic ${soft}`}>
                    Le plan s'ouvre pour le tracé, puis le chantier revient avec l'ouvrage coché.
                  </p>
                </div>
              )}

              {!canEdit && (
                <p
                  className={`mb-4 rounded-xl border border-dashed border-[hsl(var(--ds-line))] bg-white/50 px-3.5 py-3 text-[12px] italic ${soft}`}
                >
                  Vous consultez ce jardin en lecture seule : la création de chantier est réservée au
                  propriétaire et à l'équipe.
                </p>
              )}

              <label className="mb-3 block">
                <span
                  className={`mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] ${soft}`}
                >
                  Nom du chantier
                </span>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder={canSubmit ? defaultName : 'Massif Fréquence 01'}
                  className="w-full rounded-lg border border-[hsl(var(--ds-line))] bg-white/60 px-3 py-2 text-[13px] text-[hsl(var(--ds-ink))] placeholder:text-[hsl(var(--ds-ink-soft))]/60 outline-none transition focus:border-[hsl(var(--ds-gold))] focus:bg-white"
                />
              </label>
              <label className="mb-2 block">
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
            </div>

            {/* Pied collant : le bouton de validation reste toujours visible */}
            <div
              ref={footerRef}
              className="border-t border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] px-5 py-3"
            >
              <p className={`mb-1.5 text-[11px] ${soft}`}>
                Périmètre :{' '}
                {scope === 'jardin'
                  ? 'tout le jardin'
                  : selected.length === 0
                    ? 'aucun ouvrage coché'
                    : `${selected.length} ouvrage${selected.length > 1 ? 's' : ''}`}
              </p>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() =>
                  onCreate({
                    nom: nom.trim() || defaultName,
                    objet_ids: scope === 'jardin' ? [] : selected,
                    date_travaux: date || null,
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--ds-forest-deep))] px-4 py-2.5 text-[13px] font-semibold text-[hsl(var(--ds-cream))] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.6)] transition hover:bg-[hsl(var(--ds-forest))] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
              >
                <Plus className="h-4 w-4" />
                {scope === 'jardin'
                  ? 'Ouvrir le chantier · tout le jardin'
                  : selected.length > 1
                    ? `Ouvrir le chantier · ${selected.length} ouvrages`
                    : 'Ouvrir le chantier'}
              </button>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-line))]/20 px-6 py-3.5">
          <span className={`inline-flex items-center gap-1.5 text-[11.5px] italic ${soft}`}>
            <Hammer className="h-3.5 w-3.5" /> Avant / après, preuve à l'appui.
          </span>
          <button
            type="button"
            onClick={handleClose}
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
