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

  const initializeFirstAdmin = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.rpc('initialize_first_admin', {
        new_user_id: userId,
        new_email: email
      });

      if (error) {
        throw error;
      }

      if (data) {
        setIsInitialized(true);
        return { success: true };
      } else {
        return { success: false, error: 'L\'initialisation a échoué - le système est peut-être déjà initialisé' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const initializeFirstAdminDirect = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('initialize_first_admin_direct', {
        new_email: email,
        new_password: password
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      if (result?.success) {
        setIsInitialized(true);
        return { success: true, userId: result.user_id };
      } else {
        return { success: false, error: result?.error || 'L\'initialisation a échoué' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    isInitialized,
    isLoading,
    initializeFirstAdmin,
    initializeFirstAdminDirect,
    refetch: checkInitializationStatus
  };
};