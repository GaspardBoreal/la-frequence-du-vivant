import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, Printer, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PartnerOfferContent from '@/components/partners/offer/PartnerOfferContent';
import PartnerOfferPrintLayout from '@/components/partners/offer/PartnerOfferPrintLayout';
import { usePartnerOfferPrint } from '@/hooks/usePartnerOfferPrint';
import { getPartnerOfferBySlug, PARTNER_OFFER_PASSWORD } from '@/lib/partnerOffers';

const storageKey = (slug: string) => `partner-offer-unlocked:${slug}`;

const PartenaireOffre: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const offer = getPartnerOfferBySlug(slug);
  const print = usePartnerOfferPrint();

  const [unlocked, setUnlocked] = React.useState(() =>
    slug ? sessionStorage.getItem(storageKey(slug)) === '1' : false,
  );
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toUpperCase() === PARTNER_OFFER_PASSWORD) {
      if (slug) sessionStorage.setItem(storageKey(slug), '1');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!offer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Dossier partenaire introuvable</title>
        </Helmet>
        <h1 className="text-xl font-semibold text-foreground">Dossier introuvable</h1>
        <p className="text-sm text-muted-foreground">
          Aucun dossier partenaire ne correspond à cette adresse.
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
          <title>{`Espace partenaire — ${offer.partnerName}`}</title>
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
            <h1 className="text-xl font-semibold text-foreground">{offer.partnerName}</h1>
            <p className="text-sm text-muted-foreground">
              Ce dossier de partenariat est protégé. Saisissez le mot de passe transmis.
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
            Ouvrir le dossier
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:hidden">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{`Outils & Services — La Fréquence du Vivant × ${offer.partnerName}`}</title>
      </Helmet>

      <PartnerOfferPrintLayout offer={offer} />

      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <Button variant="outline" size="sm" className="ml-auto" onClick={print}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer / PDF
          </Button>
        </div>
      </div>

      <header className="border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">
            Dossier de partenariat — confidentiel
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            La Fréquence du Vivant <span className="text-primary">×</span> {offer.partnerName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{offer.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{offer.dateLabel}</span>
            {offer.partnerSite && (
              <a
                href={offer.partnerSite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {offer.partnerSite.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-foreground/90">{offer.intro}</p>
        <p className="mb-10 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
          {offer.sources}
        </p>
        <PartnerOfferContent offer={offer} />
        <footer className="mt-16 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          La Fréquence du Vivant — dossier de travail transmis à {offer.partnerName}. Diffusion
          restreinte.
        </footer>
      </main>
    </div>
  );
};

export default PartenaireOffre;
