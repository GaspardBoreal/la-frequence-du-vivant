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
  types_marches_interets?: string[];
  autre_type_marche?: string;
  recherche_prioritaire?: string;
  consentement_analyse?: boolean;
  affiliateToken?: string;
}

export function useCommunityAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('community_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('[useCommunityAuth] fetchProfile error:', error);
    }
    setProfile((data as CommunityProfile | null) ?? null);
    return data as CommunityProfile | null;
  }, []);

  useEffect(() => {
    let initialResolved = false;

    const applySession = (s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Fire-and-forget — never block auth state on profile fetch.
        setTimeout(() => {
          fetchProfile(s.user.id).then((p) => {
            // Filet de sécurité : race auth.uid lors d'un INITIAL_SESSION précoce.
            if (!p) {
              setTimeout(() => fetchProfile(s.user.id), 1000);
            }
          });
        }, 0);
      } else {
        setProfile(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        console.log('[useCommunityAuth] event=', event, 'userId=', s?.user?.id ?? null);
        applySession(s);
        // Only flip loading once the initial getSession has resolved.
        if (initialResolved) {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      initialResolved = true;
      applySession(s);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (data: SignUpData) => {
    const baseUrl = window.location.hostname === 'localhost'
      ? window.location.origin
      : 'https://la-frequence-du-vivant.com';

    // Helper: attempt signup call
    const attemptSignUp = async () => {
      return supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: baseUrl + '/marches-du-vivant/connexion',
        }
      });
    };

    let result = await attemptSignUp();

    // If timeout (504), check if user was actually created, then retry once
    if (result.error && (
      result.error.message?.includes('timed out') ||
      result.error.message?.includes('504') ||
      result.error.status === 504
    )) {
      // Wait 2s then check if user exists
      await new Promise(r => setTimeout(r, 2000));
      const alreadyExists = await checkEmailExists(data.email);

      if (!alreadyExists) {
        // User not created, retry once
        result = await attemptSignUp();
      } else {
        // User was created despite timeout — skip auth error, create profile via RPC
        // We can't get the user id here, so just inform success
        return { user: null, session: null } as any;
      }
    }

    if (result.error) throw result.error;
    const authData = result.data;

    if (authData.user) {
      const { error: profileError } = await supabase.rpc('create_community_profile', {
        _user_id: authData.user.id,
        _prenom: data.prenom,
        _nom: data.nom,
        _ville: data.ville || null,
        _telephone: data.telephone || null,
        _date_naissance: data.date_naissance || null,
        _motivation: data.motivation || null,
        _kigo_accueil: data.kigo_accueil || null,
        _superpouvoir_sensoriel: data.superpouvoir_sensoriel || null,
        _niveau_intimite_vivant: data.niveau_intimite_vivant || null,
        _types_marches_interets: data.types_marches_interets ?? null,
        _autre_type_marche: data.autre_type_marche || null,
        _recherche_prioritaire: data.recherche_prioritaire || null,
        _consentement_analyse: !!data.consentement_analyse,
      } as any);

      if (profileError) throw profileError;

      // Email de bienvenue (SMTP) — non bloquant
      try {
        await supabase.functions.invoke('send-smtp-email', {
          body: {
            to: data.email,
            subject: 'Bienvenue dans La Fréquence du Vivant 🌿',
            html: `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a2f28;">
                <h1 style="color:#0D6B58;font-size:22px;margin:0 0 16px;">Bienvenue ${data.prenom} 🌿</h1>
                <p style="font-size:15px;line-height:1.6;">Votre compte sur <strong>La Fréquence du Vivant</strong> a bien été créé.</p>
                <p style="font-size:15px;line-height:1.6;">Si une vérification d'email vous est demandée, pensez à consulter votre boîte de réception (et les spams).</p>
                <p style="font-size:15px;line-height:1.6;margin-top:24px;">
                  <a href="https://la-frequence-du-vivant.com/marches-du-vivant/connexion" style="background:#0D6B58;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Accéder à mon espace</a>
                </p>
                <p style="font-size:13px;color:#6b7c75;margin-top:32px;">À très bientôt sur les chemins,<br/>L'équipe de La Fréquence du Vivant</p>
              </div>
            `,
            text: `Bienvenue ${data.prenom} ! Votre compte sur La Fréquence du Vivant a bien été créé. Connexion : https://la-frequence-du-vivant.com/marches-du-vivant/connexion`,
          },
        });
      } catch (mailErr) {
        console.warn('[useCommunityAuth] welcome email failed (non-blocking):', mailErr);
      }

      if (data.affiliateToken) {
        await supabase.rpc('record_community_affiliate_event', {
          _share_token: data.affiliateToken,
          _event_type: 'account_created',
          _metadata: { source: 'useCommunityAuth.signUp' },
          _referred_user_id: authData.user.id,
        });
      }
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
