import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  icon: React.FC<any>;
  title: string;
  description: string;
  isCurator?: boolean;
}

const SenseSoonPlaceholder: React.FC<Props> = ({ icon: Icon, title, description, isCurator }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-emerald-500/70" />
    </div>
    <h3 className="text-foreground text-sm font-semibold mb-1">{title}</h3>
    <p className="text-muted-foreground text-xs max-w-xs mb-3">{description}</p>
    {isCurator ? (
      <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Curation à venir
        </span>
      </div>
    ) : (
      <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-medium">Bientôt disponible</span>
      </div>
    )}
  </motion.div>
);

export default SenseSoonPlaceholder;
