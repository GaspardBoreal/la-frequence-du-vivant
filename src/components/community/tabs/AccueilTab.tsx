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
    <div className="space-y-3">
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
        className="grid grid-cols-3 gap-2"
      >
        <button
          onClick={() => onNavigate('marches')}
          className="bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
            <Map className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="text-xs text-white/80 font-medium">Mes marches</span>
        </button>

        <button
          onClick={() => onNavigate('zones')}
          className="bg-amber-500/[0.08] hover:bg-amber-500/[0.15] border border-amber-400/20 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors">
            <Radar className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-xs text-white/80 font-medium">Zones ×4</span>
        </button>

        <button
          onClick={() => onNavigate('quiz')}
          className="bg-cyan-500/[0.08] hover:bg-cyan-500/[0.15] border border-cyan-400/20 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-500/25 transition-colors">
            <Brain className="w-4 h-4 text-cyan-300" />
          </div>
          <span className="text-xs text-white/80 font-medium">Quiz éveil</span>
        </button>
      </motion.div>
    </div>
  );
};

export default AccueilTab;
