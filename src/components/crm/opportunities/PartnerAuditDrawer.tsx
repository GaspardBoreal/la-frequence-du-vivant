import React from 'react';
import { createPortal } from 'react-dom';
import { Copy, ExternalLink, Link2, Printer, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PartnerAuditContent } from '@/components/partners/PartnerAuditContent';
import { PartnerAuditPrintLayout } from '@/components/partners/PartnerAuditPrintLayout';
import PartnerAuditViewSwitcher, { type PartnerAuditView } from '@/components/partners/PartnerAuditViewSwitcher';
import PartnerAuditSynthesis from '@/components/partners/synthese/PartnerAuditSynthesis';
import { usePartnerAuditPrint } from '@/hooks/usePartnerAuditPrint';
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
 * Rendu via un portail sur <body> pour échapper au contexte d'empilement
 * de la modale « Modifier l'opportunité ».
 */
export const PartnerAuditDrawer: React.FC<PartnerAuditDrawerProps> = ({
  open,
  onClose,
  audit,
  fallbackName,
}) => {
  const print = usePartnerAuditPrint();
  const hasSynthesis = Boolean(audit?.synthesis);
  const [view, setView] = React.useState<PartnerAuditView>('synthese');
  const effectiveView: PartnerAuditView = hasSynthesis ? view : 'detail';


  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const webUrl = audit ? `${window.location.origin}/partenaires/${audit.slug}` : null;

  const node = (
    <div
      className="fixed inset-0 z-[4000] flex flex-col bg-background print:hidden"
      style={{ pointerEvents: 'auto' }}
      onWheelCapture={(e) => e.stopPropagation()}
      onTouchMoveCapture={(e) => e.stopPropagation()}
    >

      {/* En-tête */}
      <header className="shrink-0 border-b border-border/60 bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-4">
          <div className="flex items-start gap-3">
            <p className="mt-0.5 flex-1 text-[11px] uppercase tracking-[0.2em] text-primary/80">
              Jalon 2 · Audit partenariat
            </p>
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
                <Button variant="outline" size="sm" onClick={print}>
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
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
              {audit
                ? `La Fréquence du Vivant × ${audit.partnerName}`
                : fallbackName || 'Audit partenariat'}
            </h2>
            {audit && (
              <p className="mt-1 text-sm text-muted-foreground">
                {audit.subtitle} · {audit.dateLabel}
              </p>
            )}
          </div>

          {hasSynthesis && (
            <PartnerAuditViewSwitcher value={effectiveView} onChange={setView} />
          )}
        </div>
      </header>

      {/* Corps */}
      <div className="flex-1 overflow-y-auto">
        {audit ? (
          effectiveView === 'synthese' && audit.synthesis ? (
            <PartnerAuditSynthesis audit={audit} />
          ) : (
          <div className="mx-auto w-full max-w-3xl px-6 py-8">
            <div className="mb-8 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
              <p>{audit.sources}</p>
              {webUrl && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-mono text-foreground/80">{webUrl}</span>
                  <span>— mot de passe</span>
                  <span className="rounded bg-background px-1.5 py-0.5 font-mono font-semibold text-foreground">
                    {PARTNER_AUDIT_PASSWORD}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${webUrl} — mot de passe ${PARTNER_AUDIT_PASSWORD}`,
                      );
                      toast.success('Lien et mot de passe copiés');
                    }}
                  >
                    <Link2 className="mr-1.5 h-3.5 w-3.5" /> Copier le lien
                  </Button>
                </div>
              )}
            </div>
            <PartnerAuditContent content={audit.content} />
            <div className="h-16" />
          </div>
          )
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

  return (
    <>
      {createPortal(node, document.body)}
      {audit && <PartnerAuditPrintLayout audit={audit} />}
    </>
  );
};

export default PartnerAuditDrawer;
