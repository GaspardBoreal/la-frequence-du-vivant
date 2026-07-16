import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="space-y-4">
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

    </div>
  );
};

export default AccueilTab;
