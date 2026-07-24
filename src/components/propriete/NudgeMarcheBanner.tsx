import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  proprieteNom: string;
  monthsSinceLastEvent: number | null;
}

export const NudgeMarcheBanner: React.FC<Props> = ({ proprieteNom, monthsSinceLastEvent }) => {
  const noEvent = monthsSinceLastEvent === null;
  const stale = typeof monthsSinceLastEvent === 'number' && monthsSinceLastEvent > 12;
  if (!noEvent && !stale) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-50/80 to-emerald-50/60 dark:from-amber-900/20 dark:to-emerald-900/10 p-4 md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {noEvent
              ? `Aucune Marche du Vivant n'a encore eu lieu à ${proprieteNom}`
              : `Cela fait ${monthsSinceLastEvent} mois sans Marche du Vivant à ${proprieteNom}`}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Organiser une marche permet d'actualiser l'inventaire vivant du lieu et de nourrir votre diagnostic.
          </p>
          <Link
            to="/marches-du-vivant/carte-marches-du-vivant?tab=carte"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium bg-primary text-primary-foreground rounded-full px-3 py-1.5 hover:bg-primary/90 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Organiser une Marche
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
