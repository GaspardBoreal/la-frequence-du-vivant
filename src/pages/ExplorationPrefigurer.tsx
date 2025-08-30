import React from 'react';
import { useParams } from 'react-router-dom';
import { PrefigurerInterface } from '@/components/opus/PrefigurerInterface';
import { useExplorations } from '@/hooks/useExplorations';

const ExplorationPrefigurer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: explorations } = useExplorations();
  
  const exploration = explorations?.find(exp => exp.slug === slug);
  
  if (!exploration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Exploration non trouvée</p>
      </div>
    );
  }

  // Convertir l'exploration slug en opus slug pour PrefigurerInterface
  // Pour l'instant, on utilise directement le slug de l'exploration
  const opusSlug = slug || '';

  const handleClose = () => {
    window.history.back();
  };

  return (
    <PrefigurerInterface 
      opusSlug={opusSlug}
      onClose={handleClose}
    />
  );
};

export default ExplorationPrefigurer;