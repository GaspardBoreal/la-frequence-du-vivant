import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  saving: boolean;
  savedAt?: string | null;
  filled: number;
  total: number;
  submitting: boolean;
  onFinish: () => void;
  onExit: () => void;
}

const hhmm = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;

/**
 * Barre collante du mode édition de « J'analyse ».
 * Toujours visible : état d'enregistrement + sortie possible à tout moment.
 */
export const AnalyzeStickyBar: React.FC<Props> = ({
  saving,
  savedAt,
  filled,
  total,
  submitting,
  onFinish,
  onExit,
}) => {
  const stamp = hhmm(savedAt);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="sticky top-0 z-30 -mx-1 px-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur px-3 py-2 shadow-[0_6px_24px_-16px_rgba(60,80,60,0.6)]">
        <div className="flex items-center gap-3 min-w-0 text-xs text-[hsl(var(--ds-forest-deep))]">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Enregistrement…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-[hsl(var(--ds-forest))]" aria-hidden="true" />
                {stamp ? `Enregistré à ${stamp}` : 'Aucune modification à enregistrer'}
              </>
            )}
          </span>
          <span className="hidden sm:inline text-[hsl(var(--ds-forest-deep))]/60 whitespace-nowrap">
            {filled} / {total} blocs renseignés
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onExit}
            className="text-xs text-[hsl(var(--ds-forest-deep))]"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            Sortir sans valider
          </Button>
          <Button
            size="sm"
            onClick={onFinish}
            disabled={submitting}
            className="bg-[hsl(var(--ds-forest))] hover:bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] text-xs"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            )}
            Terminer
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyzeStickyBar;
