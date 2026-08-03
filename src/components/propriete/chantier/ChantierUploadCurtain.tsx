import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, AlertTriangle, Sparkles, X } from 'lucide-react';
import type { UploadItem } from '@/hooks/propriete/useObjetPhotos';
import { PHASE_LABEL, type MediaPhase } from '@/lib/chantierIcg';

const STATUS_LABEL: Record<UploadItem['status'], string> = {
  pending: 'En attente',
  reading: 'Lecture EXIF…',
  uploading: 'Envoi…',
  done: 'Versée',
  error: 'Échec',
};

const fmtSize = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`;

/**
 * « Le fil d'or » — indicateur de versement des photographies du chantier.
 * Anneau de progression + rang par image (lecture EXIF, envoi, rangement).
 */
export const ChantierUploadCurtain: React.FC<{
  items: UploadItem[];
  phase: MediaPhase;
  ouvrageLabel?: string;
  filing?: boolean;
  onClose: () => void;
}> = ({ items, phase, ouvrageLabel, filing, onClose }) => {
  const total = items.length;
  const done = items.filter((i) => i.status === 'done' || i.status === 'error').length;
  const errors = items.filter((i) => i.status === 'error').length;
  const finished = total > 0 && done === total && !filing;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Fermeture douce quand tout est versé sans incident
  React.useEffect(() => {
    if (finished && errors === 0) {
      const t = setTimeout(onClose, 1800);
      return () => clearTimeout(t);
    }
  }, [finished, errors, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed bottom-5 right-5 z-[12000] w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[#c8a24a]/35 bg-[#0e1512]/95 text-[#f2efe6] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl"
        >
          {/* Filet d'or animé */}
          <motion.div
            className="h-[2px] bg-gradient-to-r from-transparent via-[#c8a24a] to-transparent"
            animate={{ opacity: finished ? 1 : [0.35, 1, 0.35] }}
            transition={{ duration: 1.6, repeat: finished ? 0 : Infinity }}
          />

          <div className="flex items-start gap-3 p-3.5">
            {/* Anneau */}
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
                <circle cx="22" cy="22" r="19" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-15" />
                <motion.circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke="#c8a24a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 19}
                  animate={{ strokeDashoffset: 2 * Math.PI * 19 * (1 - pct / 100) }}
                  transition={{ duration: 0.4 }}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">
                {finished && errors === 0 ? <Check className="h-4 w-4 text-[#c8a24a]" /> : `${pct}%`}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] opacity-60">
                <Sparkles className="h-3 w-3" /> Versement au chantier
              </div>
              <p className="mt-0.5 truncate text-[12.5px]">
                {done}/{total} image{total > 1 ? 's' : ''} · {PHASE_LABEL[phase]}
                {ouvrageLabel ? ` · ${ouvrageLabel}` : ''}
              </p>
              <p className="mt-0.5 text-[11px] italic opacity-55">
                {filing
                  ? 'Rangement dans la phase…'
                  : finished
                    ? errors
                      ? `${errors} image(s) n'ont pas pu être versées.`
                      : 'Toutes les images ont rejoint le carnet.'
                    : 'Lecture EXIF, envoi puis rangement — ne fermez pas l’onglet.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 opacity-50 transition hover:opacity-100"
              aria-label="Fermer l’indicateur"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <ul className="max-h-52 space-y-1 overflow-auto border-t border-white/10 px-3 py-2">
            {items.map((it) => (
              <li key={it.key} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-4 shrink-0">
                  {it.status === 'done' ? (
                    <Check className="h-3.5 w-3.5 text-[#c8a24a]" />
                  ) : it.status === 'error' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  ) : it.status === 'pending' ? (
                    <span className="ml-1 block h-1.5 w-1.5 rounded-full bg-white/30" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c8a24a]" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate opacity-85">{it.name}</span>
                <span className="shrink-0 text-[10px] opacity-45">{fmtSize(it.sizeBytes)}</span>
                <span
                  className={`shrink-0 text-[10px] ${
                    it.status === 'error' ? 'text-red-400' : 'opacity-60'
                  }`}
                >
                  {STATUS_LABEL[it.status]}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ChantierUploadCurtain;
