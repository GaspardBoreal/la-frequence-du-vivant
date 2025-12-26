import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import MurmuriaFloatingButton from '@/components/MurmuriaFloatingButton';

const DORDOGNE_SLUG = 'remontee-dordogne-atlas-eaux-vivantes-2025-2045';

const ExplorationLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const showMurmuria = slug === DORDOGNE_SLUG;

  return (
    <>
      <Outlet />
      {showMurmuria && <MurmuriaFloatingButton />}
    </>
  );
};

export default ExplorationLayout;
