import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminInitialization = () => {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_system_initialized');
      
      if (error) {
        console.error('Error checking initialization status:', error);
        setIsInitialized(true); // Fail safe - assume initialized
      } else {
        setIsInitialized(data);
      }
    } catch (error) {
      console.error('Error checking initialization status:', error);
      setIsInitialized(true); // Fail safe - assume initialized
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitialized,
    isLoading,
    refetch: checkInitializationStatus
  };
};