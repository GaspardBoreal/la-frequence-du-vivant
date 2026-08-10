import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, MapPin, Route, X, Crosshair } from 'lucide-react';
import type { Consultation } from '@/hooks/propriete/useGardenClinique';
import {
  STATUS_COLOR,
  fmtDistance,
  type CareRound,
  type FocusPoint,
  type ContagionChain,
} from '@/lib/gardenSpread';

interface Props {
  /** Consultations actives sans coordonnées : elles attendent d'être situées. */
  toPlace: Consultation[];
  placingId: string | null;
  onPlacing: (id: string | null) => void;
  round: CareRound;
  showRound: boolean;
  onToggleRound: () => void;
  chains: ContagionChain[];
  points: FocusPoint[];
  onOpen: (c: Consultation) => void;
}

/**
 * Bandeau de terrain de l'état sanitaire : ce qui reste à situer, la tournée
 * du jour et les chaînes de contagion — tout ce qu'il faut pour décider où
 * poser le pied en premier, sans quitter le plan.
 */
export const CliniqueDock: React.FC<Props> = ({
  toPlace,
  placingId,
  onPlacing,
  round,
  showRound,
  onToggleRound,
  chains,
  points,
  onOpen,
}) => {
  const actifs = points.filter(
    (p) => p.consultation.status === 'observation' || p.consultation.status === 'traitement',
  ).length;

  return (
    <div className="pointer-events-none absolute left-3 right-3 bottom-3 z-[1100] flex flex-col items-start gap-2 sm:left-4 sm:right-auto sm:max-w-[330px]">
      <AnimatePresence>
        {placingId && (
          <motion.div
            key="placing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto flex w-full items-center gap-2 rounded-2xl border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest-deep))] px-3 py-2 text-[hsl(var(--ds-cream))] shadow-lg"
          >
            <Crosshair className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" />
            <p className="flex-1 text-[11px] leading-snug">
              Cliquez sur le plan à l’endroit exact du foyer.
            </p>
            <button
              type="button"
              onClick={() => onPlacing(null)}
              className="rounded-full border border-[hsl(var(--ds-cream))]/35 p-1"
              aria-label="Annuler la pose"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto w-full rounded-2xl border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-cream))]/95 p-3 text-[hsl(var(--ds-forest-deep))] shadow-[0_14px_38px_-16px_rgba(20,30,15,.6)] backdrop-blur"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-[hsl(var(--ds-forest))]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ds-forest))]/80">
            État sanitaire
          </span>
          <span className="ml-auto text-[10px] opacity-65">{actifs} foyer(s) actif(s)</span>
        </div>

        {round.stops.length > 0 && (
          <button
            type="button"
            onClick={onToggleRound}
            className={`mb-2 flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] transition-colors ${
              showRound
                ? 'border-[hsl(var(--ds-forest))]/45 bg-[hsl(var(--ds-forest))]/12'
                : 'border-[hsl(var(--ds-forest))]/20 hover:bg-[hsl(var(--ds-forest))]/8'
            }`}
          >
            <Route className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--ds-forest))]" />
            <span className="leading-snug">
              Tournée de soin — {round.stops.length} arrêts · {round.pendingActions} gestes ·{' '}
              {fmtDistance(round.distanceM)}
            </span>
          </button>
        )}

        {chains.length > 0 && (
          <p className="mb-2 rounded-xl bg-[hsl(4_68%_48%)]/12 px-2.5 py-1.5 text-[10.5px] leading-snug text-[hsl(4_60%_30%)]">
            {chains.length} chaîne(s) de contagion : {chains[0].members.length} foyers de{' '}
            {chains[0].pathogen} se touchent.
          </p>
        )}

        {toPlace.length > 0 ? (
          <>
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] opacity-60">
              À situer · {toPlace.length}
            </p>
            <div className="flex max-h-[132px] flex-wrap gap-1.5 overflow-y-auto pr-1">
              {toPlace.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPlacing(placingId === c.id ? null : c.id)}
                  onDoubleClick={() => onOpen(c)}
                  title="Cliquez, puis désignez l’endroit sur le plan"
                  className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10.5px] transition-colors ${
                    placingId === c.id
                      ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/25'
                      : 'border-[hsl(var(--ds-forest))]/25 hover:bg-[hsl(var(--ds-forest))]/10'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: STATUS_COLOR[c.status] }}
                  />
                  {c.subject_label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-[10.5px] italic opacity-60">
            <MapPin className="h-3 w-3" /> Tous les foyers sont situés sur le plan.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default CliniqueDock;
