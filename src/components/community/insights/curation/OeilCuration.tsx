import React from 'react';
import { Eye } from 'lucide-react';
import SenseSoonPlaceholder from './SenseSoonPlaceholder';

interface Props { explorationId: string; isCurator: boolean }

const OeilCuration: React.FC<Props> = ({ isCurator }) => (
  <SenseSoonPlaceholder
    icon={Eye}
    title="Espèces remarquables"
    description="Bientôt : retrouvez ici les espèces emblématiques, parapluies, exotiques envahissantes et auxiliaires sélectionnées par l'ambassadeur de la marche."
    isCurator={isCurator}
  />
);

export default OeilCuration;
