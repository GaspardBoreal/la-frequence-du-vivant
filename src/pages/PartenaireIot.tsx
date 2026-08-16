import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIotFournisseurs } from '@/hooks/iot/useIot';
import { useCanOpenIotConsole } from '@/hooks/iot/useIotPartner';
import { useCommunityAuth } from '@/hooks/useCommunityAuth';
import AppSwitcher from '@/components/community/AppSwitcher';
import { IotConsoleProvider } from '@/components/iot/console/IotConsoleContext';
import { IotConsolePanel, IotConsoleAi } from '@/components/iot/console/IotConsole';
import IotPartnerHome from '@/components/iot/console/IotPartnerHome';

const TABS = [
  { key: 'accueil', label: 'Accueil' },
  { key: 'controle', label: 'Poste de contrôle' },
  { key: 'carte', label: 'Carte des sondes' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** Clés possibles du fabricant dans le journal des livraisons. */
const deliveryKeys = (nom: string, slug: string) =>
  Array.from(new Set([slug, nom.toLowerCase(), nom.toLowerCase().split(/\s+/)[0]].filter(Boolean)));

/**
 * Espace partenaire d'un fabricant de sondes : accueil générique, poste de
 * contrôle et carte, tous cadrés sur le périmètre du fabricant.
 */
const PartenaireIot: React.FC = () => {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: TabKey = tabParam === 'controle' || tabParam === 'carte' ? tabParam : 'accueil';

  const { data: fournisseurs = [], isLoading: loadingF } = useIotFournisseurs();
  const fournisseur = React.useMemo(
    () => (fournisseurs as any[]).find((f) => f.slug === slug) ?? null,
    [fournisseurs, slug],
  );
  const { allowed, isLoading } = useCanOpenIotConsole(fournisseur?.id ?? null);

  const loginHref = `/marches-du-vivant/connexion?next=${encodeURIComponent(`/partenaire-iot/${slug}?tab=${tab}`)}`;

  const setTab = (k: TabKey) => {
    const next = new URLSearchParams(params);
    next.set('tab', k);
    setParams(next, { replace: true });
  };

  if (loadingF || isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Ouverture de l’espace partenaire…</div>;
  }

  if (!fournisseur) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Fabricant introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cet espace partenaire n’existe pas ou a été renommé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{`${fournisseur.nom} — espace partenaire IoT`}</title>
      </Helmet>

      <header className="border-b border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/10">
            {fournisseur.logo_url ? (
              <img src={fournisseur.logo_url} alt={`Logo ${fournisseur.nom}`} className="h-full w-full object-cover" />
            ) : (
              <Radio className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Espace partenaire IoT</p>
            <h1 className="truncate text-xl font-semibold">{fournisseur.nom}</h1>
          </div>
          <div className="flex flex-wrap gap-1 rounded-full border border-border/60 bg-background p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-1.5 text-xs transition ${
                  tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {allowed ? (
          <IotConsoleProvider
            scope={{
              fournisseurIds: [fournisseur.id],
              fournisseurKeys: deliveryKeys(fournisseur.nom ?? '', slug),
            }}
            capabilities={{ testDelivery: false, rawPayload: false, catalogue: false, proprieteLinks: false }}
            chrome="partenaire"
            label={`Parc ${fournisseur.nom}`}
          >
            {tab === 'accueil' ? <IotPartnerHome /> : <IotConsolePanel view={tab === 'carte' ? 'carte' : 'controle'} />}
            <IotConsoleAi />
          </IotConsoleProvider>
        ) : (
          <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card/60 p-8 text-center">
            <Lock className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Accès réservé aux partenaires {fournisseur.nom}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connectez-vous avec votre compte habilité. Créer un compte ne suffit pas : il doit être rattaché à
              {` ${fournisseur.nom} `}par La Fréquence du Vivant.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="sm"><Link to={loginHref}>Se connecter</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to={`${loginHref}&tab=register`}>Créer un compte</Link></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartenaireIot;
