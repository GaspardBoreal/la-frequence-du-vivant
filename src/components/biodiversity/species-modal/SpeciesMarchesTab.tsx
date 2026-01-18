import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';

interface SpeciesMarchesTabProps {
  marches: SpeciesMarcheData[];
  isLoading?: boolean;
}

const SpeciesMarchesTab: React.FC<SpeciesMarchesTabProps> = ({ marches, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
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

  // Calculate total observations for summary
  const totalObservations = marches.reduce((sum, m) => sum + m.observationCount, 0);

  return (
    <div className="space-y-3">
      {/* Summary pill */}
      <div className="flex items-center justify-center gap-2 text-xs text-white/50">
        <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          {totalObservations} observation{totalObservations > 1 ? 's' : ''}
        </span>
        <span>sur</span>
        <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
          {marches.length} marche{marches.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid layout - responsive: 2 cols mobile, 3 cols larger */}
      <ScrollArea className="h-[200px] pr-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {marches.map((marche, index) => (
            <motion.div
              key={marche.marcheId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="relative p-3 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-emerald-500/30 hover:from-white/[0.12] transition-all duration-200 group cursor-pointer"
            >
              {/* Order number - top left corner */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-white">
                  {marche.order}
                </span>
              </div>

              {/* Marche name - truncate elegantly */}
              <p className="text-xs font-medium text-white/90 leading-tight line-clamp-2 mb-2 mt-1 group-hover:text-white transition-colors">
                {marche.marcheName}
              </p>

              {/* Observation count - bottom */}
              <div className="flex items-center gap-1 text-[10px] text-white/50">
                <MapPin className="w-3 h-3 text-emerald-400/60" />
                <span className="text-emerald-300/80 font-medium">
                  {marche.observationCount}
                </span>
                <span>obs.</span>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SpeciesMarchesTab;
