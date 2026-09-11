import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MapPin, Leaf, Clock, Backpack, Sparkles, ArrowRight } from 'lucide-react';
import { useIdeesArret, type GroupeIdee } from '@/hooks/sauniers/useIdeesAnimation';

interface IdeesAnimationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waypointId: string | null;
  etapeNumero: number;
  etapeNom: string;
  groupeInitial: GroupeIdee;
  onExplorer?: () => void;
}

const ONGLETS: { cle: GroupeIdee; label: string; icone: typeof MapPin }[] = [
  { cle: 'lieu', label: 'Le lieu', icone: MapPin },
  { cle: 'vivant', label: 'Le vivant', icone: Leaf },
];

/** Fiche des idées d'animation d'une étape — lecture seule, mobile first. */
export const IdeesAnimationSheet: React.FC<IdeesAnimationSheetProps> = ({
  open,
  onOpenChange,
  waypointId,
  etapeNumero,
  etapeNom,
  groupeInitial,
  onExplorer,
}) => {
  const [groupe, setGroupe] = useState<GroupeIdee>(groupeInitial);
  const { lieu, vivant, chargement } = useIdeesArret(open ? waypointId : null);

  useEffect(() => {
    if (open) setGroupe(groupeInitial);
  }, [open, groupeInitial]);

  const liste = groupe === 'lieu' ? lieu : vivant;
  const accent = groupe === 'lieu' ? 'amber' : 'emerald';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto border-t border-white/10 bg-gradient-to-b from-[#0b1f1a] via-[#0a1714] to-[#070f0d] p-0 text-white"
      >
        {/* En-tête */}
        <div className="relative overflow-hidden px-5 pb-4 pt-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-sm font-bold text-emerald-200">
              {etapeNumero}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-emerald-300/80">
                <Sparkles className="h-3 w-3" /> Idées d’animation
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold leading-tight">{etapeNom}</h2>
            </div>
          </div>

          {/* Onglets */}
          <div className="relative mt-4 grid grid-cols-2 gap-2">
            {ONGLETS.map(({ cle, label, icone: Icone }) => {
              const actif = groupe === cle;
              const n = cle === 'lieu' ? lieu.length : vivant.length;
              return (
                <button
                  key={cle}
                  onClick={() => setGroupe(cle)}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${
                    actif
                      ? cle === 'lieu'
                        ? 'border-amber-400/50 bg-amber-400/20 text-amber-100'
                        : 'border-emerald-400/50 bg-emerald-400/20 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Icone className="h-4 w-4" />
                  {label}
                  <span className="text-xs opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Idées */}
        <div className="px-5 pb-2">
          {chargement && <p className="py-8 text-center text-sm text-white/50">Lecture des idées…</p>}
          {!chargement && liste.length === 0 && (
            <p className="py-8 text-center text-sm text-white/50">
              Aucune idée enregistrée pour ce volet.
            </p>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={groupe}
              initial={{ opacity: 0, x: groupe === 'lieu' ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: groupe === 'lieu' ? 24 : -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {liste.map((idee, i) => (
                <motion.article
                  key={idee.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className={`rounded-2xl border p-4 backdrop-blur-sm ${
                    accent === 'amber'
                      ? 'border-amber-400/20 bg-amber-400/[0.06]'
                      : 'border-emerald-400/20 bg-emerald-400/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold leading-snug">{idee.titre}</h3>
                    {idee.duree && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                        <Clock className="h-3 w-3" />
                        {idee.duree}
                      </span>
                    )}
                  </div>
                  {idee.description && (
                    <p className="mt-2 text-[13px] leading-relaxed text-white/75">{idee.description}</p>
                  )}
                  {idee.materiel && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Backpack className="h-3.5 w-3.5 text-white/40" />
                      {idee.materiel
                        .split(/[,;]/)
                        .map((m) => m.trim())
                        .filter(Boolean)
                        .map((m, k) => (
                          <span
                            key={k}
                            className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] text-white/60"
                          >
                            {m}
                          </span>
                        ))}
                    </div>
                  )}
                </motion.article>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pied */}
        <div className="sticky bottom-0 mt-2 border-t border-white/10 bg-black/40 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
          {onExplorer ? (
            <button
              onClick={onExplorer}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/30"
            >
              Explorer cette étape <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => onOpenChange(false)}
              className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 text-sm text-white/70"
            >
              Revenir à la carte
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IdeesAnimationSheet;
