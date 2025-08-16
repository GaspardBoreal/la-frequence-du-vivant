import React, { useEffect } from 'react';
import { useMarketDataSync } from '@/hooks/useMarketDataSync';

interface MarcheFormWithSyncProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export const MarcheFormWithSync: React.FC<MarcheFormWithSyncProps> = ({ 
  children, 
  onSuccess 
}) => {
  const { invalidateMarketData } = useMarketDataSync();

  const handleFormSuccess = () => {
    // Invalider les caches après une modification réussie
    invalidateMarketData();
    
    // Appeler le callback original si fourni
    if (onSuccess) {
      onSuccess();
    }
  };

  // Cloner les enfants et leur passer la fonction handleFormSuccess
  return (
    <>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { 
              onSuccess: handleFormSuccess,
              ...child.props 
            })
          : child
      )}
    </>
  );
};