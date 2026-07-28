import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Leaf, AlertTriangle } from 'lucide-react';
import {
  clearPendingOAuthRequest,
  loginPathForOAuthReturn,
  rememberPendingOAuthRequest,
} from '@/lib/oauthFlow';

/**
 * Écran de consentement OAuth 2.1 (Supabase = serveur d'autorisation).
 * Route : /.lovable/oauth/consent?authorization_id=...
 * Permet à un client externe (Claude, ChatGPT…) d'agir au nom de l'utilisateur
 * connecté, dans la limite stricte de ses droits RLS.
 */
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauthApi = (): OAuthApi | undefined =>
  (supabase.auth as unknown as { oauth?: OAuthApi }).oauth;

type SessionState = 'loading' | 'anonymous' | 'authenticated';

const OAuthConsent: React.FC = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const consentReturnPath = `${window.location.pathname}${window.location.search}`;
  const loginPath = loginPathForOAuthReturn(consentReturnPath);

  // 1) Mémorise immédiatement la demande complète (avec authorization_id).
  useEffect(() => {
    if (authorizationId) {
      rememberPendingOAuthRequest(consentReturnPath);
    }
  }, [authorizationId, consentReturnPath]);

  // 2) Résolution fiable de la session : on attend INITIAL_SESSION plutôt qu'un
  //    unique getSession() au premier rendu (source de fausses redirections).
  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserEmail(session?.user?.email ?? null);
      setSessionState(session ? 'authenticated' : 'anonymous');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.session?.user?.email ?? null);
      setSessionState(data.session ? 'authenticated' : 'anonymous');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 3) Lecture de la demande d'autorisation (session confirmée).
  useEffect(() => {
    if (sessionState !== 'authenticated') return;
    let active = true;
    (async () => {
      try {
        setError(null);
        setExpired(false);
        if (!authorizationId) {
          setError("Paramètre « authorization_id » manquant.");
          return;
        }
        const api = oauthApi();
        if (!api?.getAuthorizationDetails) {
          setError(
            "Le module OAuth du client Supabase est indisponible sur cette version de l'application. Rechargez la page ; si le problème persiste, l'application doit être republiée."
          );
          return;
        }
        const { data, error: err } = await api.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (err) {
          const msg = err.message ?? String(err);
          if (/not found|expired|invalid/i.test(msg)) setExpired(true);
          else setError(msg);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          clearPendingOAuthRequest();
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "Erreur inattendue lors de la lecture de la demande d'autorisation.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, attempt, sessionState]);

  const decide = useCallback(
    async (approve: boolean) => {
      setBusy(true);
      try {
        const api = oauthApi();
        if (!api) throw new Error('Module OAuth indisponible.');
        const { data, error: err } = approve
          ? await api.approveAuthorization(authorizationId)
          : await api.denyAuthorization(authorizationId);
        if (err) {
          setBusy(false);
          setError(err.message ?? String(err));
          return;
        }
        const target = data?.redirect_url ?? data?.redirect_to;
        if (!target) {
          setBusy(false);
          setError("Le serveur d'autorisation n'a renvoyé aucune redirection.");
          return;
        }
        clearPendingOAuthRequest();
        window.location.href = target;
      } catch (e: any) {
        setBusy(false);
        setError(e?.message ?? "Erreur inattendue pendant l'autorisation.");
      }
    },
    [authorizationId]
  );

  const retry = () => {
    setDetails(null);
    setError(null);
    setExpired(false);
    setAttempt((a) => a + 1);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-8 shadow-xl">
        <div className="flex items-center gap-2 text-primary mb-6">
          <Leaf className="h-5 w-5" />
          <span className="text-sm tracking-widest uppercase">La Fréquence du Vivant</span>
        </div>

        {sessionState === 'loading' && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification de votre session…</span>
          </div>
        )}

        {sessionState === 'anonymous' && (
          <>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <h1 className="text-xl font-semibold">Connexion requise</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Claude demande votre accord pour accéder à La Fréquence du Vivant.
              Connectez-vous d'abord : l'autorisation sera reprise automatiquement.
            </p>
            <Button className="w-full" onClick={() => { window.location.href = loginPath; }}>
              Se connecter puis autoriser Claude
            </Button>
          </>
        )}

        {sessionState === 'authenticated' && expired && (
          <>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <h1 className="text-xl font-semibold">Demande expirée</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Cette demande d'autorisation n'est plus valide. Retournez dans l'application
              cliente (Claude, ChatGPT…) et cliquez à nouveau sur <strong>Connecter</strong>.
            </p>
            <Button variant="outline" className="mt-5" onClick={retry}>
              Réessayer quand même
            </Button>
          </>
        )}

        {sessionState === 'authenticated' && !expired && error && (
          <>
            <h1 className="text-xl font-semibold mb-2">Demande d'autorisation illisible</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-5" onClick={retry}>
              Réessayer
            </Button>
          </>
        )}

        {sessionState === 'authenticated' && !expired && !error && !details && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification de la demande…</span>
          </div>
        )}

        {sessionState === 'authenticated' && !expired && !error && details && (
          <>
            <h1 className="text-2xl font-serif mb-3">
              Connecter {details.client?.name ?? 'une application'} à votre compte
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {details.client?.name ?? "L'application"} pourra lire les données auxquelles
              vous avez déjà accès (propriétés, biodiversité, diagnostics), en agissant
              en votre nom. Vos droits et vos politiques de sécurité restent inchangés.
            </p>
            {userEmail && (
              <p className="text-xs text-muted-foreground mb-6">
                Compte utilisé : <span className="text-foreground">{userEmail}</span>
              </p>
            )}
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 mb-6">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Lecture seule. Vous pouvez révoquer cet accès à tout moment depuis votre compte.
              </p>
            </div>
            <div className="flex gap-3">
              <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Autoriser
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => decide(false)}
                className="flex-1"
              >
                Refuser
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default OAuthConsent;
