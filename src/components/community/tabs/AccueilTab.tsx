import React from 'react';
import { motion } from 'framer-motion';
import FrequenceWave from '../FrequenceWave';
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

const AccueilTab: React.FC<AccueilTabProps> = ({ role, totalFrequences }) => {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <FrequenceWave totalFrequences={totalFrequences} role={role} />
      </motion.div>
    </div>
  );
};

export default AccueilTab;
