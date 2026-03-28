import React from 'react';
import CarnetVivant from '@/components/community/CarnetVivant';

interface CarnetTabProps {
  userId: string;
  participations: any[];
}

const CarnetTab: React.FC<CarnetTabProps> = ({ userId, participations }) => {
  return <CarnetVivant userId={userId} participations={participations} />;
};

export default CarnetTab;
