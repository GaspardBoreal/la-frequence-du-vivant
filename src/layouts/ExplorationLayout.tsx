import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import DordoniaFloatingButton from '@/components/DordoniaFloatingButton';
import { BiodiversityProvider } from '@/contexts/BiodiversityContext';

const DORDOGNE_SLUG = 'remontee-dordogne-atlas-eaux-vivantes-2025-2045';

const ExplorationLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const showDordonia = slug === DORDOGNE_SLUG;

  return (
    <BiodiversityProvider>
      <Outlet />
      {showDordonia && <DordoniaFloatingButton />}
    </BiodiversityProvider>
  );
};

export default ExplorationLayout;
