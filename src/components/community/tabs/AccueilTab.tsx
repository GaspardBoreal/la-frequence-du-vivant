import React from 'react';
import { motion } from 'framer-motion';
import FrequenceWave from '../FrequenceWave';
import CommunityFeedCarousel from '../feed/CommunityFeedCarousel';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { TabKey } from '../MonEspaceTabBar';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {user?.id && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <CommunityFeedCarousel userId={user.id} />
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <FrequenceWave totalFrequences={totalFrequences} role={role} />
      </motion.div>
    </div>
  );
};

export default AccueilTab;
