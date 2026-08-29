import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sprout, AlertTriangle } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type ClaimResult = {
  id?: string;
  slug?: string;
  created?: boolean;
  empty?: boolean;
  reason?: string;
};

/**
 * Atterrissage du lien de confirmation Fréquence Jardin.
 *
 * Le compte vient d'être confirmé : on attend que la session soit établie
 * (le SDK consomme le hash `#access_token=...`), on matérialise le jardin à
 * partir des métadonnées du compte, puis on ouvre sa fiche.
 */
export default function JardinBienvenue() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const claim = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      const { data, error: rpcError } = await supabase.rpc('onboard_claim_from_metadata');
      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const result = (data ?? {}) as ClaimResult;
      if (result.slug) {
        navigate(`/propriete/${result.slug}`, { replace: true });
        return;
      }

      // Aucune donnée d'accueil exploitable : on bascule sur le parcours manuel.
      navigate('/jardin/demarrer', { replace: true });
    };

    const waitForSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        void claim();
        return () => {};
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) void claim();
      });

      // Filet : si aucune session n'arrive, on renvoie vers la connexion.
      const timer = window.setTimeout(() => {
        if (!hasRun.current && !cancelled) {
          setError("La session n'a pas pu être établie. Le lien a peut-être expiré.");
        }
      }, 8000);

      return () => {
        sub.subscription.unsubscribe();
        window.clearTimeout(timer);
      };
    };

    let cleanup: (() => void) | undefined;
    void waitForSession().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white px-6">
      <Helmet>
        <title>Votre jardin s'ouvre — Fréquence Jardin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-md text-center space-y-6">
        {error ? (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Nous n'avons pas pu ouvrir votre jardin</h1>
              <p className="text-sm text-emerald-100/80">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/jardin/demarrer')} className="bg-emerald-500 hover:bg-emerald-400">
                Créer mon jardin
              </Button>
              <Button
                variant="outline"
                className="border-white/20 bg-transparent hover:bg-white/10"
                onClick={() => navigate('/marches-du-vivant/connexion')}
              >
                Me connecter
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Sprout className="w-7 h-7 text-emerald-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Nous préparons votre jardin…</h1>
              <p className="text-sm text-emerald-100/80">
                Vos réponses rejoignent le portrait de votre jardin. Encore un instant.
              </p>
            </div>
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-emerald-300" />
          </>
        )}
      </div>
    </div>
  );
}
