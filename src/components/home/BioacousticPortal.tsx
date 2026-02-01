import React, { useState } from 'react';
import PortalCard from './PortalCard';
import SoundWaveVisualizer from './SoundWaveVisualizer';

export default function BioacousticPortal() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <PortalCard
        title="BIOACOUSTIQUE"
        description="Écouter les fréquences du monde vivant et explorer les paysages sonores cachés"
        href="/bioacoustique-poetique"
        accentColor="#22D3EE"
        glowColor="#10B981"
        delay={0}
      >
        <SoundWaveVisualizer isHovered={isHovered} />
      </PortalCard>
    </div>
  );
}
