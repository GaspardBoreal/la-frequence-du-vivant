import React from 'react';
import { Utensils } from 'lucide-react';
import SenseSoonPlaceholder from './SenseSoonPlaceholder';

interface Props { explorationId: string; isCurator: boolean }

const PalaisCuration: React.FC<Props> = ({ isCurator }) => (
  <SenseSoonPlaceholder
    icon={Utensils}
    title="Goûts & dégustations"
    description="Bientôt : moments de dégustation et découvertes alimentaires saisis lors des marches, enrichis manuellement par l'ambassadeur."
    isCurator={isCurator}
  />
);

export default PalaisCuration;
