import React from 'react';
import CarnetVivant from '@/components/community/CarnetVivant';
import type { InvitedEventRow } from '@/hooks/useCommunityInvitedEvents';

interface CarnetTabProps {
  userId: string;
  participations: any[];
  silentInvitations?: InvitedEventRow[];
}

const CarnetTab: React.FC<CarnetTabProps> = ({ userId, participations, silentInvitations = [] }) => {
  return <CarnetVivant userId={userId} participations={participations} silentInvitations={silentInvitations} />;
};

export default CarnetTab;
