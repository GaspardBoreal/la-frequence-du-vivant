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
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isLoading: false
        }));

        // Check admin status if user is authenticated
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, isAdmin: false }));
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false
      }));

      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .single();

      setAuthState(prev => ({ ...prev, isAdmin: !!data }));
    } catch (error) {
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

  return {
    ...authState,
    signIn,
    signUp,
    signOut
  };
};