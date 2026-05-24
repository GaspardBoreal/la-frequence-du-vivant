import React from 'react';
import { Check, Loader2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import type { PrepStep } from '@/hooks/useFullscreenPreparation';
import { cn } from '@/lib/utils';

interface Props {
  visible: boolean;
  progress: number; // 0..1
  steps: PrepStep[];
}

const InatFullscreenLoadingOverlay: React.FC<Props> = ({ visible, progress, steps }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[450] flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-[min(420px,90vw)] rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Préparation du plein écran
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cartographie des photos en cours…
              </p>
            </div>

            <div className="space-y-1.5">
              <Progress value={Math.round(progress * 100)} className="h-2" />
              <div className="text-right text-[11px] tabular-nums text-muted-foreground">
                {Math.round(progress * 100)}%
              </div>
            </div>

            <ul className="space-y-2">
              {steps.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    {s.status === 'done' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                      </motion.span>
                    )}
                    {s.status === 'doing' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    )}
                    {s.status === 'todo' && (
                      <Circle className="w-3 h-3 text-muted-foreground/40" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'flex-1 transition-colors',
                      s.status === 'done' && 'text-foreground',
                      s.status === 'doing' && 'text-foreground font-medium',
                      s.status === 'todo' && 'text-muted-foreground/60',
                    )}
                  >
                    {s.label}
                    {typeof s.count === 'number' && s.status === 'done' && (
                      <span className="ml-1 text-muted-foreground">({s.count})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InatFullscreenLoadingOverlay;
