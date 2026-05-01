import React from 'react';
import { Ear } from 'lucide-react';
import SenseSoonPlaceholder from './SenseSoonPlaceholder';

interface Props { explorationId: string; isCurator: boolean }

const OreilleCuration: React.FC<Props> = ({ isCurator }) => (
  <SenseSoonPlaceholder
    icon={Ear}
    title="Paysage sonore"
    description="Bientôt : audios épinglés mis en avant, et l'ensemble des sons capturés par les marcheurs au cours de l'exploration."
    isCurator={isCurator}
  />
);

export default OreilleCuration;
