import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, Printer, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PartnerRoadmapContent from '@/components/partners/roadmap/PartnerRoadmapContent';
import RoadmapPrintLayout from '@/components/partners/roadmap/RoadmapPrintLayout';
import RoadmapTocNav from '@/components/partners/roadmap/RoadmapTocNav';

import { usePartnerRoadmapPrint } from '@/hooks/usePartnerRoadmapPrint';
import { getPartnerRoadmap } from '@/lib/partnerRoadmaps';
import { PARTNER_AUDIT_PASSWORD } from '@/lib/partnerAudits';

const storageKey = (slug: string, date: string) => `partner-roadmap-unlocked:${slug}:${date}`;

const PartenaireFeuilleDeRoute: React.FC = () => {
  const { slug, date } = useParams<{ slug: string; date: string }>();
  const roadmap = getPartnerRoadmap(slug, date);
  const print = usePartnerRoadmapPrint();

  const [unlocked, setUnlocked] = React.useState(() =>
    slug && date ? sessionStorage.getItem(storageKey(slug, date)) === '1' : false,
  );
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toUpperCase() === PARTNER_AUDIT_PASSWORD) {
      if (slug && date) sessionStorage.setItem(storageKey(slug, date), '1');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!roadmap) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Feuille de route introuvable</title>
        </Helmet>
        <h1 className="text-xl font-semibold text-foreground">Feuille de route introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Aucun document ne correspond à cette adresse.
        </p>
        <Button asChild variant="outline">
          <Link to="/marches-du-vivant">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Retour au site
          </Link>
        </Button>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>{`Espace partenaire — ${roadmap.partnerName}`}</title>
        </Helmet>
        <form
          onSubmit={submit}
          className="w-full max-w-sm space-y-5 rounded-2xl border border-border/70 bg-card/70 p-8 text-center shadow-xl backdrop-blur"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80">
              Espace partenaire
            </p>
            <h1 className="text-xl font-semibold text-foreground">{roadmap.partnerName}</h1>
            <p className="text-sm text-muted-foreground">
              Cette feuille de route est protégée. Saisissez le mot de passe transmis.
            </p>
          </div>
          <Input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="Mot de passe"
            className="text-center tracking-widest"
          />
          {error && <p className="text-xs text-destructive">Mot de passe incorrect.</p>}
          <Button type="submit" className="w-full">
            Ouvrir la feuille de route
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{`Feuille de route — ${roadmap.partnerName} × La Fréquence du Vivant`}</title>
      </Helmet>

      <RoadmapPrintLayout roadmap={roadmap} />

      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <span className="text-xs text-muted-foreground">{roadmap.interviewLabel}</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={print}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer / PDF
          </Button>
        </div>
      </div>

      <header className="border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent print:hidden">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">
            Feuille de route des travaux — confidentiel
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            La Fréquence du Vivant <span className="text-primary">×</span> {roadmap.partnerName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{roadmap.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{roadmap.partnerContact}</span>
            {roadmap.partnerSite && (
              <a
                href={roadmap.partnerSite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {roadmap.partnerSite.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </header>

      <RoadmapTocNav />


      <main className="mx-auto w-full max-w-5xl px-6 py-10 print:hidden">
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-foreground/90">{roadmap.intro}</p>
        <p className="mb-10 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-foreground/85">
          {roadmap.context}
        </p>
        <PartnerRoadmapContent roadmap={roadmap} />
        <footer className="mt-16 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          La Fréquence du Vivant — document de travail transmis à {roadmap.partnerName}. Diffusion
          restreinte.
        </footer>
      </main>
    </div>
  );
};

export default PartenaireFeuilleDeRoute;
