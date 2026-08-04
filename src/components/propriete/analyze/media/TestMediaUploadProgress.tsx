import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertTriangle, X, Video, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { formatBytes, type UploadItem } from '@/hooks/propriete/usePropertyTestMedias';

const STATUS_LABEL: Record<UploadItem['status'], string> = {
  pending: 'En attente',
  preparing: 'Lecture du fichier',
  uploading: 'Transfert',
  saving: 'Enregistrement',
  done: 'Déposé',
  error: 'Refusé',
};

/**
 * File d'envoi des preuves de terrain : une ligne par fichier, jauge réelle
 * (octets transférés), état lisible et cause d'échec explicite.
 */
export const TestMediaUploadProgress: React.FC<{
  items: UploadItem[];
  accent: string;
  onDismiss: (key: string) => void;
  onRetry?: (item: UploadItem) => void;
}> = ({ items, accent, onDismiss }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((it) => {
          const pct =
            it.status === 'done'
              ? 100
              : it.size > 0
                ? Math.min(99, Math.round((it.sent / it.size) * 100))
                : 0;
          const err = it.status === 'error';
          const running = it.status === 'preparing' || it.status === 'uploading' || it.status === 'saving';

          return (
            <motion.div
              key={it.key}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={`relative overflow-hidden rounded-xl border px-3 py-2.5 ${
                err
                  ? 'border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/8'
                  : 'border-[hsl(var(--ds-line))] bg-white/75'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${
                    running ? 'animate-pulse' : ''
                  }`}
                  style={{
                    background: err ? 'hsl(var(--destructive) / 0.14)' : `hsl(${accent} / 0.14)`,
                    color: err ? 'hsl(var(--destructive))' : `hsl(${accent})`,
                  }}
                >
                  {err ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : it.status === 'done' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : it.isVideo ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate text-[12.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                      {it.name}
                    </div>
                    <div className="shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--ds-forest-deep))]/55">
                      {STATUS_LABEL[it.status]}
                    </div>
                  </div>

                  {err ? (
                    <div className="mt-1 text-[11.5px] leading-snug text-[hsl(var(--destructive))]">
                      {it.error}
                    </div>
                  ) : (
                    <>
                      <div className="mt-1.5 h-1.5 rounded-full bg-[hsl(var(--ds-forest))]/12 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, hsl(${accent}) 0%, hsl(var(--ds-gold)) 100%)`,
                          }}
                          animate={{ width: `${pct}%` }}
                          transition={{ ease: 'easeOut', duration: 0.25 }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10.5px] tabular-nums text-[hsl(var(--ds-forest-deep))]/60">
                        <span>
                          {formatBytes(Math.min(it.sent, it.size))} / {formatBytes(it.size)}
                        </span>
                        <span>{pct}%</span>
                      </div>
                    </>
                  )}
                </div>

                {(err || it.status === 'done') && (
                  <button
                    type="button"
                    onClick={() => onDismiss(it.key)}
                    aria-label="Masquer"
                    className="mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[hsl(var(--ds-forest-deep))]/50 hover:bg-[hsl(var(--ds-forest))]/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export { RotateCcw };
