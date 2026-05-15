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
  // Track which user.id we have already validated and admin-checked.
  const validatedUserIdRef = useRef<string | null>(null);
  const processingTokenRef = useRef<string | null>(null);
  const initialResolvedRef = useRef<boolean>(false);

  const setSignedOutState = useCallback(() => {
    validatedUserIdRef.current = null;
    processingTokenRef.current = null;
    initialResolvedRef.current = true;
    setAuthState({ user: null, session: null, isLoading: false, isAdmin: false, isAdminChecked: true });
  }, []);

  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('is_admin_user');

      // Bail if the validated user has changed since.
      if (validatedUserIdRef.current !== userId) return;

      if (error) {
        console.error('Error checking admin status:', error);
        setAuthState((prev) => ({ ...prev, isAdmin: false, isAdminChecked: true }));
        initialResolvedRef.current = true;
        return;
      }

      setAuthState((prev) => ({ ...prev, isAdmin: !!data, isAdminChecked: true }));
      initialResolvedRef.current = true;
    } catch (error) {
      if (validatedUserIdRef.current !== userId) return;
      console.error('Error checking admin status:', error);
      setAuthState((prev) => ({ ...prev, isAdmin: false, isAdminChecked: true }));
      initialResolvedRef.current = true;
    }
  }, []);

  const handleSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setSignedOutState();
      return;
    }

    const sessionToken = session.access_token;
    const sessionUserId = session.user.id;

    // Same user as before → just update the session reference, no flicker.
    if (validatedUserIdRef.current === sessionUserId) {
      setAuthState((prev) => ({ ...prev, session, user: session.user }));
      return;
    }

    // Avoid concurrent validations on the same token.
    if (processingTokenRef.current === sessionToken) return;
    processingTokenRef.current = sessionToken;

    // First-ever resolution → show loading. Otherwise keep current UI stable.
    if (!initialResolvedRef.current) {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
    }

    const { data: { user: validatedUser }, error } = await supabase.auth.getUser();

    processingTokenRef.current = null;

    if (error || !validatedUser) {
      console.warn('Session expired or invalid, signing out:', error?.message);
      setSignedOutState();
      await supabase.auth.signOut();
      return;
    }

    validatedUserIdRef.current = validatedUser.id;

    setAuthState({
      user: validatedUser,
      session,
      isLoading: false,
      isAdmin: false,
      isAdminChecked: false,
    });

    void checkAdminStatus(validatedUser.id);
  }, [checkAdminStatus, setSignedOutState]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSignedOutState();
        return;
      }
      void handleSession(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSignedOutState, handleSession]);

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
