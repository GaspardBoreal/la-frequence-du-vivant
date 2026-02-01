import React, { useState } from 'react';
import PortalCard from './PortalCard';
import ConstellationNetwork from './ConstellationNetwork';

export default function TerritoryPortal() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <PortalCard
        title="TERRITOIRES"
        description="Marcher les cartes sensibles et cartographier les chemins du vivant"
        href="/explorations-sensibles"
        accentColor="#FBBF24"
        glowColor="#F59E0B"
        delay={0.15}
      >
        <ConstellationNetwork isHovered={isHovered} />
      </PortalCard>
    </div>
  );
}
