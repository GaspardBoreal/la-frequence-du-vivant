import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, Printer, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PartnerAuditContent } from '@/components/partners/PartnerAuditContent';
import { PartnerAuditPrintLayout } from '@/components/partners/PartnerAuditPrintLayout';
import { usePartnerAuditPrint } from '@/hooks/usePartnerAuditPrint';
import { getPartnerAuditBySlug, PARTNER_AUDIT_PASSWORD } from '@/lib/partnerAudits';

const storageKey = (slug: string) => `partner-audit-unlocked:${slug}`;

const PartenaireAudit: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const audit = getPartnerAuditBySlug(slug);
  const print = usePartnerAuditPrint();

  const [unlocked, setUnlocked] = React.useState(() =>
    slug ? sessionStorage.getItem(storageKey(slug)) === '1' : false,
  );
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().toUpperCase() === PARTNER_AUDIT_PASSWORD) {
      if (slug) sessionStorage.setItem(storageKey(slug), '1');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!audit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Audit partenaire introuvable</title>
        </Helmet>
        <h1 className="text-xl font-semibold text-foreground">Audit introuvable</h1>
        <p className="text-sm text-muted-foreground">Aucun audit partenaire ne correspond à cette adresse.</p>
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
          <title>{`Espace partenaire — ${audit.partnerName}`}</title>
        </Helmet>
        <form
          onSubmit={submit}
          className="w-full max-w-sm space-y-5 rounded-2xl border border-border/70 bg-card/70 p-8 text-center shadow-xl backdrop-blur"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80">Espace partenaire</p>
            <h1 className="text-xl font-semibold text-foreground">{audit.partnerName}</h1>
            <p className="text-sm text-muted-foreground">
              Ce document de négociation est protégé. Saisissez le mot de passe transmis.
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
            Ouvrir l'audit
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:hidden">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{`Audit de visibilité — La Fréquence du Vivant × ${audit.partnerName}`}</title>
      </Helmet>

      <PartnerAuditPrintLayout audit={audit} />



      <header className="border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto w-full max-w-3xl px-6 py-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">
            Document de partenariat — confidentiel
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            La Fréquence du Vivant <span className="text-primary">×</span> {audit.partnerName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{audit.subtitle}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{audit.dateLabel}</span>
            {audit.partnerSite && (
              <a
                href={audit.partnerSite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {audit.partnerSite.replace(/^https?:\/\//, '')}
              </a>
            )}
            <Button variant="outline" size="sm" className="ml-auto print:hidden" onClick={print}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer / PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="mb-8 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
          {audit.sources}
        </p>
        <PartnerAuditContent content={audit.content} />
        <footer className="mt-16 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          La Fréquence du Vivant — document de travail transmis à {audit.partnerName}. Diffusion restreinte.
        </footer>
      </main>
    </div>
  );
};

export default PartenaireAudit;
