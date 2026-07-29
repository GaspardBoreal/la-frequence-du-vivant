import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, EyeOff, Move, Magnet, ShieldAlert } from 'lucide-react';
import type { InlineGpsCuration } from '@/hooks/propriete/useInlineGpsCuration';
import { GEOFENCE_LABELS } from '@/lib/geofence';

/**
 * Bandeau de confirmation flottant du mode « curation sur place ».
 * Superposé à la carte (jamais une modale) pour que le zoom, les calques
 * et l'emplacement dessiné restent visibles pendant la correction.
 */
export const InlineGpsBar: React.FC<{ curation: InlineGpsCuration }> = ({ curation }) => {
  const { active, label, distanceM, status, snapped, saving, save, cancel, exclude } = curation;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="inline-gps-bar"
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-[330px] z-[1200] overflow-hidden rounded-2xl border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] shadow-[0_18px_48px_-12px_rgba(0,0,0,0.75)]"
        >
          {/* En-tête */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[hsl(var(--ds-cream))]/12">
            <span className="grid place-items-center w-6 h-6 rounded-full bg-[hsl(var(--ds-gold))]/20 shrink-0">
              <Move className="w-3.5 h-3.5 text-[hsl(var(--ds-gold))]" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight truncate">{label}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--ds-gold))]/85">
                Repositionnement
              </p>
            </div>
          </div>

          {/* Métriques */}
          <div className="px-4 py-2.5 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--ds-cream))]/12 text-[hsl(var(--ds-cream))]">
                {distanceM > 0 ? `déplacé de ${distanceM} m` : 'glissez le point'}
              </span>

              {status !== 'unknown' && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    status === 'inside'
                      ? 'bg-emerald-400/20 text-emerald-100'
                      : 'bg-[#b4462f]/45 text-[hsl(var(--ds-cream))]'
                  }`}
                >
                  {status === 'outside' && <ShieldAlert className="w-3 h-3" />}
                  {GEOFENCE_LABELS[status]}
                </span>
              )}

              {snapped && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--ds-cream))]/12 inline-flex items-center gap-1">
                  <Magnet className="w-3 h-3" /> aimanté
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || distanceM === 0}
                className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition"
              >
                <Check className="w-3.5 h-3.5" /> Enregistrer
              </button>
              <button
                type="button"
                onClick={() => void exclude()}
                disabled={saving}
                title="Écarter cette observation"
                className="text-[12px] px-3 py-2 rounded-xl border border-[hsl(var(--ds-cream))]/35 hover:bg-[hsl(var(--ds-cream))]/10 flex items-center gap-1.5 disabled:opacity-40 transition"
              >
                <EyeOff className="w-3.5 h-3.5" /> Écarter
              </button>
              <button
                type="button"
                onClick={cancel}
                title="Annuler"
                aria-label="Annuler"
                className="px-2.5 py-2 rounded-xl border border-[hsl(var(--ds-cream))]/35 hover:bg-[hsl(var(--ds-cream))]/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[10px] leading-snug text-[hsl(var(--ds-cream))]/60">
              Échap annule · Entrée enregistre · la donnée source n'est jamais réécrite.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default InlineGpsBar;
