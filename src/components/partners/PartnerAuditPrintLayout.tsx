import React from 'react';
import { createPortal } from 'react-dom';
import { PartnerAuditContent } from './PartnerAuditContent';
import type { PartnerAudit } from '@/lib/partnerAudits';

const PORTAL_ID = 'partner-audit-print-portal';

/**
 * Portail d'impression A4 dédié à un audit partenaire.
 * Monté hors flux, il n'est visible qu'en impression via
 * `body.partner-audit-print-mode` (cf. src/index.css).
 */
export const PartnerAuditPrintLayout: React.FC<{ audit: PartnerAudit }> = ({ audit }) => {
  const [host, setHost] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let el = document.getElementById(PORTAL_ID);
    let created = false;
    if (!el) {
      el = document.createElement('div');
      el.id = PORTAL_ID;
      document.body.appendChild(el);
      created = true;
    }
    setHost(el);
    return () => {
      if (created && el?.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  if (!host) return null;

  return createPortal(
    <div className="pa-print-doc">
      {/* Page de garde */}
      <section className="pa-print-cover">
        <div className="pa-cover-rule" />
        <p className="pa-cover-kicker">Document de négociation — diffusion restreinte</p>
        <h1 className="pa-cover-title">
          La Fréquence du Vivant <span className="pa-cover-x">×</span> {audit.partnerName}
        </h1>
        <p className="pa-cover-sub">{audit.subtitle}</p>
        <div className="pa-cover-meta">
          <div>
            <span className="pa-cover-label">Date</span>
            <span>{audit.dateLabel}</span>
          </div>
          {audit.partnerSite && (
            <div>
              <span className="pa-cover-label">Site partenaire</span>
              <span>{audit.partnerSite.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </div>
          )}
        </div>
        <p className="pa-cover-sources">
          <span className="pa-cover-label">Sources</span>
          {audit.sources}
        </p>
        <div className="pa-cover-foot">La Fréquence du Vivant — audit de visibilité SEO &amp; GEO</div>
      </section>

      {/* Corps de l'audit */}
      <section className="pa-print-body">
        <PartnerAuditContent content={audit.content} variant="print" />
        <p className="pa-print-end">
          La Fréquence du Vivant — document de travail transmis à {audit.partnerName}. Diffusion restreinte.
        </p>
      </section>
    </div>,
    host,
  );
};

export default PartnerAuditPrintLayout;
