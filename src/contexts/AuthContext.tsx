import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAdminChecked: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const initialAuthState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  isAdminChecked: false,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const activeSessionKeyRef = useRef<string | null>(null);
  const processingSessionKeyRef = useRef<string | null>(null);
  const processedSessionKeyRef = useRef<string | null>(null);

  const setSignedOutState = useCallback(() => {
    activeSessionKeyRef.current = null;
    processingSessionKeyRef.current = null;
    processedSessionKeyRef.current = null;
    setAuthState({ user: null, session: null, isLoading: false, isAdmin: false, isAdminChecked: true });
  }, []);

  const checkAdminStatus = useCallback(async (sessionKey: string) => {
    try {
      const { data, error } = await supabase.rpc('is_admin_user');

      if (activeSessionKeyRef.current !== sessionKey) return;

      if (error) {
        console.error('Error checking admin status:', error);
        setAuthState((prev) => ({ ...prev, isAdmin: false, isAdminChecked: true }));
        return;
      }

      setAuthState((prev) => ({ ...prev, isAdmin: !!data, isAdminChecked: true }));
    } catch (error) {
      if (activeSessionKeyRef.current !== sessionKey) return;
      console.error('Error checking admin status:', error);
      setAuthState((prev) => ({ ...prev, isAdmin: false, isAdminChecked: true }));
    }
  }, []);

  const validateAndSetUser = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setSignedOutState();
      return;
    }

    const sessionKey = session.access_token;
    if (
      processingSessionKeyRef.current === sessionKey ||
      (processedSessionKeyRef.current === sessionKey && activeSessionKeyRef.current === sessionKey)
    ) {
      return;
    }

    activeSessionKeyRef.current = sessionKey;
    processingSessionKeyRef.current = sessionKey;

    setAuthState((prev) => ({
      ...prev,
      session,
      isLoading: true,
      isAdmin: false,
      isAdminChecked: false,
    }));

    const { data: { user: validatedUser }, error } = await supabase.auth.getUser();

    if (activeSessionKeyRef.current !== sessionKey) return;

    processingSessionKeyRef.current = null;

    if (error || !validatedUser) {
      console.warn('Session expired or invalid, signing out:', error?.message);
      setSignedOutState();
      await supabase.auth.signOut();
      return;
    }

    processedSessionKeyRef.current = sessionKey;
    setAuthState({
      user: validatedUser,
      session,
      isLoading: false,
      isAdmin: false,
      isAdminChecked: false,
    });

    void checkAdminStatus(sessionKey);
  }, [checkAdminStatus, setSignedOutState]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSignedOutState();
        return;
      }

      void validateAndSetUser(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void validateAndSetUser(session);
    });

    return () => subscription.unsubscribe();
  }, [setSignedOutState, validateAndSetUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

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
        emailRedirectTo: redirectUrl,
      },
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
    const baseUrl = window.location.hostname === 'localhost'
      ? 'https://gaspardboreal.com'
      : window.location.origin;
    const redirectUrl = `${baseUrl}/admin/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error(`Erreur: ${error.message}`);
    } else {
      toast.success('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.');
    }

    return { error };
  };

  const value = useMemo<AuthContextValue>(() => ({
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};