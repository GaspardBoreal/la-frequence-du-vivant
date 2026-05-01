import React from 'react';
import { Hand } from 'lucide-react';
import SenseSoonPlaceholder from './SenseSoonPlaceholder';

interface Props { explorationId: string; isCurator: boolean }

const MainCuration: React.FC<Props> = ({ isCurator }) => (
  <SenseSoonPlaceholder
    icon={Hand}
    title="Pratiques emblématiques"
    description="Bientôt : pratiques mises en avant par l'ambassadeur, illustrées par les médias des marcheurs (photos, vidéos, audios, textes)."
    isCurator={isCurator}
  />
);

export default MainCuration;
