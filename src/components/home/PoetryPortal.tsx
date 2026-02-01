import React, { useState } from 'react';
import PortalCard from './PortalCard';
import FloatingHaiku from './FloatingHaiku';

export default function PoetryPortal() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <PortalCard
        title="POÉSIE"
        description="Fragments du vivant, vers éphémères à l'intersection de l'art et de la science"
        href="/dordonia"
        accentColor="#E879F9"
        glowColor="#F9A8D4"
        delay={0.3}
      >
        <FloatingHaiku isHovered={isHovered} />
      </PortalCard>
    </div>
  );
}
