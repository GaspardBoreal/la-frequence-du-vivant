import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Leaf } from 'lucide-react';

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

const OAuthConsent: React.FC = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setError(null);
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
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          const next = window.location.pathname + window.location.search;
          window.location.href = `/marches-du-vivant/connexion?next=${encodeURIComponent(next)}`;
          return;
        }
        const { data, error: err } = await api.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (err) {
          setError(err.message ?? String(err));
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
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
  }, [authorizationId, attempt]);


  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      const api = oauthApi();
      if (!api) throw new Error("Module OAuth indisponible.");
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
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? "Erreur inattendue pendant l'autorisation.");
    }
  };


  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-8 shadow-xl">
        <div className="flex items-center gap-2 text-primary mb-6">
          <Leaf className="h-5 w-5" />
          <span className="text-sm tracking-widest uppercase">La Fréquence du Vivant</span>
        </div>

        {error && (
          <>
            <h1 className="text-xl font-semibold mb-2">Demande d'autorisation illisible</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        )}

        {!error && !details && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification de la demande…</span>
          </div>
        )}

        {!error && details && (
          <>
            <h1 className="text-2xl font-serif mb-3">
              Connecter {details.client?.name ?? 'une application'} à votre compte
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {details.client?.name ?? "L'application"} pourra lire les données auxquelles
              vous avez déjà accès (propriétés, biodiversité, diagnostics), en agissant
              en votre nom. Vos droits et vos politiques de sécurité restent inchangés.
            </p>
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
