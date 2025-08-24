// Revolutionary Reading Experience - Complete Integration
// Replaces the old ExperienceLecture with the new 3-level architecture

import React from 'react';
import { useParams } from 'react-router-dom';
import { useExploration } from '@/hooks/useExplorations';
import LectureImmersive from './LectureImmersive';

const ExperienceLectureRevolutionnaire: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  return <LectureImmersive />;
};

export default ExperienceLectureRevolutionnaire;