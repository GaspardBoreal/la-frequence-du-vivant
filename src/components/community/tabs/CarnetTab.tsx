import React from 'react';
import CarnetVivant from '@/components/community/CarnetVivant';

interface CarnetTabProps {
  userId: string;
  participations: Array<{
    id: string;
    marche_event_id: string;
    validated_at: string | null;
    created_at: string;
    marche_events?: {
      id: string;
      title: string;
      date_marche: string;
      lieu: string | null;
      description: string | null;
      exploration_id: string | null;
    };
  }>;
}

const CarnetTab: React.FC<CarnetTabProps> = ({ userId, participations }) => {
  return <CarnetVivant userId={userId} participations={participations} />;
};

export default CarnetTab;
