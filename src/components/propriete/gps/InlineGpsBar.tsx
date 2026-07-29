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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1200] max-w-[94%] rounded-2xl border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-forest-deep))]/96 px-4 py-2.5 text-[hsl(var(--ds-cream))] shadow-2xl backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-1.5 text-[12px] font-medium">
              <Move className="w-3.5 h-3.5 text-[hsl(var(--ds-gold))]" />
              {label}
            </span>

            <span className="text-[11px] opacity-80">
              {distanceM > 0 ? `déplacé de ${distanceM} m` : 'glissez le point ou cliquez la carte'}
            </span>

            {status !== 'unknown' && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  status === 'inside'
                    ? 'bg-[hsl(var(--ds-cream))]/15 text-[hsl(var(--ds-cream))]'
                    : 'bg-[#b4462f]/30 text-[hsl(var(--ds-cream))]'
                }`}
              >
                {status === 'outside' && <ShieldAlert className="w-3 h-3 inline mr-1" />}
                {GEOFENCE_LABELS[status]}
              </span>
            )}

            {snapped && (
              <span className="text-[10px] opacity-80 flex items-center gap-1">
                <Magnet className="w-3 h-3" /> aimanté à la parcelle
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || distanceM === 0}
                className="text-[11px] px-3 py-1.5 rounded-full bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))] font-medium flex items-center gap-1 disabled:opacity-45"
              >
                <Check className="w-3.5 h-3.5" /> Enregistrer
              </button>
              <button
                type="button"
                onClick={() => void exclude()}
                disabled={saving}
                className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-cream))]/40 flex items-center gap-1 disabled:opacity-45"
              >
                <EyeOff className="w-3.5 h-3.5" /> Écarter
              </button>
              <button
                type="button"
                onClick={cancel}
                className="text-[11px] px-3 py-1.5 rounded-full border border-[hsl(var(--ds-cream))]/40 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Annuler
              </button>
            </div>
          </div>

          <p className="mt-1 text-[9.5px] italic opacity-55">
            Échap annule · Entrée enregistre · la donnée source d'origine n'est jamais réécrite.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InlineGpsBar;
