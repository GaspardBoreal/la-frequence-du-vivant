import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Leaf, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  clearPendingOAuthRequest,
  loginPathForOAuthReturn,
  rememberPendingOAuthRequest,
} from '@/lib/oauthFlow';

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

type SessionState = 'loading' | 'anonymous' | 'authenticated';
type ConsentState = 'loading' | 'ready' | 'expired' | 'redirecting' | 'error';

type Diagnostic = {
  etape: string;
  message: string;
  authorization_id: string;
  client?: string;
  domaine_redirection?: string;
};

const oauthApi = (): OAuthApi | undefined =>
  (supabase.auth as unknown as { oauth?: OAuthApi }).oauth;

const maskAuthorizationId = (id: string) => {
  if (!id) return 'absent';
  return id.length <= 10 ? `${id.slice(0, 3)}…` : `${id.slice(0, 6)}…${id.slice(-4)}`;
};

const redirectHost = (target: string | null | undefined) => {
  if (!target) return undefined;
  try {
    return new URL(target).host;
  } catch {
    return target.startsWith('/') ? window.location.host : 'illisible';
  }
};

const OAuthConsent: React.FC = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const consentReturnPath = `${window.location.pathname}${window.location.search}`;
  const loginPath = loginPathForOAuthReturn(consentReturnPath);

  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [consentState, setConsentState] = useState<ConsentState>('loading');
  const [details, setDetails] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);

  useEffect(() => {
    if (authorizationId) rememberPendingOAuthRequest(consentReturnPath);
  }, [authorizationId, consentReturnPath]);

  useEffect(() => {
    let active = true;

    const applySession = (session: any) => {
      if (!active) return;
      setUserEmail(session?.user?.email ?? null);
      setSessionState(session ? 'authenticated' : 'anonymous');
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionState !== 'authenticated') return;
    let active = true;

    (async () => {
      setConsentState('loading');
      setDiagnostic(null);
      setDetails(null);

      if (!authorizationId) {
        setConsentState('error');
        setDiagnostic({
          etape: 'lecture_demande',
          message: 'Paramètre authorization_id manquant dans l’URL de consentement.',
          authorization_id: 'absent',
        });
        return;
      }

      const api = oauthApi();
      if (!api?.getAuthorizationDetails) {
        setConsentState('error');
        setDiagnostic({
          etape: 'client_oauth_indisponible',
          message: "Le client Supabase publié ne contient pas le module OAuth requis. Republiez l'application après correction des dépendances.",
          authorization_id: maskAuthorizationId(authorizationId),
        });
        return;
      }

      const { data, error } = await api.getAuthorizationDetails(authorizationId);
      if (!active) return;

      if (error) {
        const message = error.message ?? String(error);
        setConsentState(/not found|expired|invalid/i.test(message) ? 'expired' : 'error');
        setDiagnostic({
          etape: 'lecture_demande_refusee',
          message,
          authorization_id: maskAuthorizationId(authorizationId),
        });
        return;
      }

      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        clearPendingOAuthRequest();
        setConsentState('redirecting');
        window.location.assign(immediate);
        return;
      }

      setDetails(data);
      setConsentState('ready');
    })();

    return () => {
      active = false;
    };
  }, [authorizationId, sessionState]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    setDiagnostic(null);

    try {
      if (!authorizationId) throw new Error('Demande OAuth incomplète : authorization_id manquant.');
      const api = oauthApi();
      if (!api?.approveAuthorization || !api?.denyAuthorization) {
        throw new Error('Module OAuth indisponible dans le client Supabase publié.');
      }

      const { data, error } = approve
        ? await api.approveAuthorization(authorizationId)
        : await api.denyAuthorization(authorizationId);

      if (error) throw new Error(error.message ?? String(error));

      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setConsentState('error');
        setDiagnostic({
          etape: approve ? 'autorisation_sans_redirection' : 'refus_sans_redirection',
          message: "Le serveur d'autorisation n'a renvoyé aucune URL de retour vers Claude.",
          authorization_id: maskAuthorizationId(authorizationId),
          client: details?.client?.name ?? undefined,
        });
        setBusy(false);
        return;
      }

      clearPendingOAuthRequest();
      setConsentState('redirecting');
      setDiagnostic({
        etape: approve ? 'autorisation_validee' : 'autorisation_refusee',
        message: approve ? 'Autorisation validée. Retour vers Claude.' : 'Autorisation refusée. Retour vers Claude.',
        authorization_id: maskAuthorizationId(authorizationId),
        client: details?.client?.name ?? undefined,
        domaine_redirection: redirectHost(target),
      });

      window.setTimeout(() => window.location.assign(target), 250);
    } catch (error: any) {
      setBusy(false);
      setConsentState('error');
      setDiagnostic({
        etape: approve ? 'autorisation_exception' : 'refus_exception',
        message: error?.message ?? 'Erreur inattendue pendant la décision OAuth.',
        authorization_id: maskAuthorizationId(authorizationId),
        client: details?.client?.name ?? undefined,
      });
    }
  };

  const diagnosticText = useMemo(
    () => (diagnostic ? JSON.stringify(diagnostic, null, 2) : null),
    [diagnostic],
  );

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
              Claude demande votre accord pour accéder à La Fréquence du Vivant. Connectez-vous : l’autorisation reprendra automatiquement.
            </p>
            <Button className="w-full" onClick={() => window.location.assign(loginPath)}>
              Se connecter puis autoriser Claude
            </Button>
          </>
        )}

        {sessionState === 'authenticated' && consentState === 'loading' && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Lecture de la demande Claude…</span>
          </div>
        )}

        {sessionState === 'authenticated' && consentState === 'redirecting' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <h1 className="text-xl font-semibold">Retour vers Claude…</h1>
            </div>
            <p className="text-sm text-muted-foreground">L’autorisation est validée. Claude finalise maintenant la connexion.</p>
            {diagnosticText && (
              <pre className="max-h-44 overflow-auto rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground whitespace-pre-wrap">
                {diagnosticText}
              </pre>
            )}
          </div>
        )}

        {sessionState === 'authenticated' && consentState === 'expired' && (
          <>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <h1 className="text-xl font-semibold">Demande expirée</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Cette demande n’est plus valide. Retournez dans Claude et relancez une nouvelle connexion.
            </p>
            {diagnosticText && (
              <pre className="mt-4 max-h-44 overflow-auto rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground whitespace-pre-wrap">
                {diagnosticText}
              </pre>
            )}
          </>
        )}

        {sessionState === 'authenticated' && consentState === 'error' && (
          <>
            <h1 className="text-xl font-semibold mb-2">Autorisation impossible</h1>
            <p className="text-sm text-muted-foreground">
              La demande Claude n’a pas pu être finalisée. Copiez le diagnostic ci-dessous si l’erreur persiste.
            </p>
            {diagnosticText && (
              <pre className="mt-4 max-h-44 overflow-auto rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground whitespace-pre-wrap">
                {diagnosticText}
              </pre>
            )}
          </>
        )}

        {sessionState === 'authenticated' && consentState === 'ready' && details && (
          <>
            <h1 className="text-2xl font-serif mb-3">
              Connecter {details.client?.name ?? 'une application'} à votre compte
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {details.client?.name ?? "L'application"} pourra lire les propriétés, observations, espèces et diagnostics auxquels votre compte a déjà accès.
            </p>
            {userEmail && (
              <p className="text-xs text-muted-foreground mb-6">
                Compte utilisé : <span className="text-foreground">{userEmail}</span>
              </p>
            )}
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 mb-6">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Accès en lecture seule. Les règles de sécurité et les droits de votre compte restent appliqués.
              </p>
            </div>
            <div className="flex gap-3">
              <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Autoriser
              </Button>
              <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
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
