import React from 'react';
import { motion } from 'framer-motion';
import { Map, Brain, Radar } from 'lucide-react';
import FrequenceWave from '../FrequenceWave';
import ProgressionCard from '../ProgressionCard';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { TabKey } from '../MonEspaceTabBar';

interface AccueilTabProps {
  role: CommunityRoleKey;
  marchesCount: number;
  formationValidee: boolean;
  certificationValidee: boolean;
  pendingCount: number;
  totalFrequences: number;
  onNavigate: (tab: TabKey) => void;
}

const AccueilTab: React.FC<AccueilTabProps> = ({
  role, marchesCount, formationValidee, certificationValidee, pendingCount, totalFrequences, onNavigate,
}) => {
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <FrequenceWave totalFrequences={totalFrequences} role={role} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <ProgressionCard
          role={role}
          marchesCount={marchesCount}
          formationValidee={formationValidee}
          certificationValidee={certificationValidee}
          pendingCount={pendingCount}
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3"
      >
        <button
          onClick={() => onNavigate('marches')}
          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] dark:border-white/15 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/25 transition-colors">
            <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <span className="text-xs text-foreground font-medium">Mes marches</span>
        </button>

        <button
          onClick={() => onNavigate('outils')}
          className="bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.15] dark:border-amber-400/20 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-500/25 transition-colors">
            <Radar className="w-5 h-5 text-amber-600 dark:text-amber-300" />
          </div>
          <span className="text-xs text-foreground font-medium">Zones ×4</span>
        </button>

        <button
          onClick={() => onNavigate('outils')}
          className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 dark:bg-cyan-500/[0.08] dark:hover:bg-cyan-500/[0.15] dark:border-cyan-400/20 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-200 dark:group-hover:bg-cyan-500/25 transition-colors">
            <Brain className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
          </div>
          <span className="text-xs text-foreground font-medium">Quiz éveil</span>
        </button>
      </motion.div>
    </div>
  );
};

export default AccueilTab;
