import React from 'react';
import { motion } from 'framer-motion';
import { Map, Brain, Sparkles } from 'lucide-react';
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
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => onNavigate('marches')}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
            <Map className="w-5 h-5 text-emerald-300" />
          </div>
          <span className="text-xs text-emerald-200/70 font-medium">Mes marches</span>
        </button>

        <button
          onClick={() => onNavigate('quiz')}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-500/25 transition-colors">
            <Brain className="w-5 h-5 text-cyan-300" />
          </div>
          <span className="text-xs text-emerald-200/70 font-medium">Quiz éveil</span>
        </button>
      </motion.div>
    </div>
  );
};

export default AccueilTab;
