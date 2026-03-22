import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface CommunityProfile {
  id: string;
  user_id: string;
  prenom: string;
  nom: string;
  ville: string | null;
  telephone: string | null;
  date_naissance: string | null;
  motivation: string | null;
  avatar_url: string | null;
  role: string;
  marches_count: number;
  formation_validee: boolean;
  certification_validee: boolean;
  kigo_accueil: string | null;
  superpouvoir_sensoriel: string | null;
  niveau_intimite_vivant: string | null;
  created_at: string;
  updated_at: string;
}

interface SignUpData {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  ville?: string;
  telephone?: string;
  date_naissance?: string;
  motivation?: string;
  kigo_accueil?: string;
  superpouvoir_sensoriel?: string;
  niveau_intimite_vivant?: string;
}

export function useCommunityAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('community_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data as CommunityProfile | null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (data: SignUpData) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin + '/marches-du-vivant/mon-espace',
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('community_profiles')
        .insert({
          user_id: authData.user.id,
          prenom: data.prenom,
          nom: data.nom,
          ville: data.ville || null,
          telephone: data.telephone || null,
          date_naissance: data.date_naissance || null,
          motivation: data.motivation || null,
          kigo_accueil: data.kigo_accueil || null,
          superpouvoir_sensoriel: data.superpouvoir_sensoriel || null,
          niveau_intimite_vivant: data.niveau_intimite_vivant || null,
        });

      if (profileError) throw profileError;
    }

    return authData;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/marches-du-vivant/reset-password`,
    });
    if (error) throw error;
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_email_exists', { _email: email });
    if (error) {
      console.error('Error checking email:', error);
      return false;
    }
    return !!data;
  };

  const createProfile = async (userId: string, prenom: string, nom: string) => {
    const { error } = await supabase
      .from('community_profiles')
      .upsert({
        user_id: userId,
        prenom,
        nom,
      }, { onConflict: 'user_id' });
    if (error) throw error;
    await fetchProfile(userId);
  };

  return {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    checkEmailExists,
    createProfile,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}
