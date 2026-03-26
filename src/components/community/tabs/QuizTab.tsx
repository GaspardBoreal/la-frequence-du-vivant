import React from 'react';
import QuizInteractif from '../QuizInteractif';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import { toast } from 'sonner';

interface QuizTabProps {
  role: CommunityRoleKey;
  userId: string;
}

const QuizTab: React.FC<QuizTabProps> = ({ role, userId }) => {
  return (
    <QuizInteractif
      niveau={role === 'marcheur_en_devenir' ? 'marcheur' : role}
      userId={userId}
      onComplete={(score, total, frequences) => {
        if (frequences > 0) toast.success(`+${frequences} Fréquences gagnées ! 🌟`);
      }}
    />
  );
};

export default QuizTab;
