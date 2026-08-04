import React from 'react';
import { Copy, ExternalLink, Printer, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PartnerAuditContent } from '@/components/partners/PartnerAuditContent';
import { PARTNER_AUDIT_PASSWORD, type PartnerAudit } from '@/lib/partnerAudits';

interface PartnerAuditDrawerProps {
  open: boolean;
  onClose: () => void;
  audit: PartnerAudit | null;
  /** Nom affiché quand aucun audit n'existe encore */
  fallbackName?: string | null;
}

/**
 * Panneau plein écran affichant l'audit partenariat rattaché à l'opportunité.
 * En l'absence d'audit (v1), affiche « Intégration de l'IA en cours ».
 */
export const PartnerAuditDrawer: React.FC<PartnerAuditDrawerProps> = ({
  open,
  onClose,
  audit,
  fallbackName,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const webUrl = audit ? `${window.location.origin}/partenaires/${audit.slug}` : null;

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col bg-background/98 backdrop-blur-sm">
      {/* En-tête */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80">
            Jalon 2 · Audit partenariat
          </p>
          <h2 className="truncate text-lg font-semibold text-foreground">
            {audit ? `La Fréquence du Vivant × ${audit.partnerName}` : (fallbackName || 'Audit partenariat')}
          </h2>
          {audit && (
            <p className="text-xs text-muted-foreground">
              {audit.subtitle} · {audit.dateLabel}
            </p>
          )}
        </div>

        {audit && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(audit.content);
                toast.success('Audit copié en Markdown');
              }}
            >
              <Copy className="mr-1.5 h-4 w-4" /> Copier
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(`/partenaires/${audit.slug}`, '_blank', 'noopener')}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" /> Voir la version web
            </Button>
          </div>
        )}

        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
          <X className="h-5 w-5" />
        </Button>
      </header>

      {/* Corps */}
      <div className="flex-1 overflow-y-auto">
        {audit ? (
          <div className="mx-auto w-full max-w-3xl px-5 py-8">
            <div className="mb-6 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
              <p>{audit.sources}</p>
              {webUrl && (
                <p className="mt-2">
                  Page web partenaire : <span className="font-mono text-foreground/80">{webUrl}</span>{' '}
                  — mot de passe{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {PARTNER_AUDIT_PASSWORD}
                  </span>
                </p>
              )}
            </div>
            <PartnerAuditContent content={audit.content} />
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Intégration de l'IA en cours</h3>
            <p className="text-sm text-muted-foreground">
              La génération automatique de l'audit partenariat
              {fallbackName ? ` pour « ${fallbackName} »` : ''} arrive dans la prochaine version.
              Les audits déjà rédigés restent consultables depuis leur opportunité.
            </p>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerAuditDrawer;
