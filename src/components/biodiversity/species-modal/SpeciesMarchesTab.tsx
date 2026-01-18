import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';

interface SpeciesMarchesTabProps {
  marches: SpeciesMarcheData[];
  isLoading?: boolean;
}

const SpeciesMarchesTab: React.FC<SpeciesMarchesTabProps> = ({ marches, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (marches.length === 0) {
    return (
      <div className="text-center py-6 text-white/40">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucune marche trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
      {marches.map((marche, index) => (
        <motion.div
          key={marche.marcheId}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-colors group"
        >
          {/* Order badge */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-xs font-medium text-emerald-300">
              #{marche.order}
            </span>
          </div>

          {/* Marche name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
              {marche.marcheName}
            </p>
          </div>

          {/* Observation count */}
          <div className="flex-shrink-0 px-2 py-1 rounded-full bg-white/10 text-xs text-white/60">
            {marche.observationCount} obs.
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SpeciesMarchesTab;
