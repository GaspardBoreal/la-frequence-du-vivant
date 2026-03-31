import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false
  });

  useEffect(() => {
    // Validate session server-side to avoid stale/ghost sessions
    const validateAndSetUser = async (session: Session | null) => {
      if (!session?.user) {
        setAuthState({ user: null, session: null, isLoading: false, isAdmin: false });
        return;
      }

      // Verify the token is still valid on the server
      const { data: { user: validatedUser }, error } = await supabase.auth.getUser();
      
      if (error || !validatedUser) {
        console.warn('Session expired or invalid, signing out:', error?.message);
        setAuthState({ user: null, session: null, isLoading: false, isAdmin: false });
        // Clean up stale local storage
        await supabase.auth.signOut();
        return;
      }

      setAuthState(prev => ({
        ...prev,
        session,
        user: validatedUser,
        isLoading: false
      }));

      // Check admin status with validated user
      checkAdminStatus(validatedUser.id);
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setAuthState({ user: null, session: null, isLoading: false, isAdmin: false });
          return;
        }
        // Fire and forget to avoid blocking the callback
        setTimeout(() => validateAndSetUser(session), 0);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      validateAndSetUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('is_admin_user');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setAuthState(prev => ({ ...prev, isAdmin: false }));
        return;
      }

      setAuthState(prev => ({ ...prev, isAdmin: !!data }));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAuthState(prev => ({ ...prev, isAdmin: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      toast.error(`Erreur de connexion: ${error.message}`);
    } else {
      toast.success('Connexion réussie');
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      toast.error(`Erreur d'inscription: ${error.message}`);
    } else {
      toast.success('Inscription réussie');
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(`Erreur de déconnexion: ${error.message}`);
    } else {
      toast.success('Déconnexion réussie');
    }
    
    return { error };
  };

  const resetPassword = async (email: string) => {
    // Utiliser l'URL de production pour éviter la redirection vers localhost
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'https://gaspardboreal.com'
      : window.location.origin;
    const redirectUrl = `${baseUrl}/admin/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      toast.error(`Erreur: ${error.message}`);
    } else {
      toast.success('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
    }
    
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword
  };
};