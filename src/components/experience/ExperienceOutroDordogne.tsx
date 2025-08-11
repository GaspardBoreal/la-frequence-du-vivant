import React from 'react';
import ExperienceOutro from '@/components/experience/ExperienceOutro';

interface Props { explorationId: string; sessionId: string; }

// Dedicated outro styling for the Dordogne exploration only
const ExperienceOutroDordogne: React.FC<Props> = ({ explorationId, sessionId }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/15 via-primary/5 to-primary/15 p-6">
      <ExperienceOutro explorationId={explorationId} sessionId={sessionId} />
    </div>
  );
};

export default ExperienceOutroDordogne;
