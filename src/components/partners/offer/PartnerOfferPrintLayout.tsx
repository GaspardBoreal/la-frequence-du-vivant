import React from 'react';
import { createPortal } from 'react-dom';
import type { PartnerOffer } from '@/lib/partnerOffers';

const PORTAL_ID = 'partner-offer-print-portal';

/**
 * Portail d'impression A4 du dossier « catalogue Outils & Services ».
 * Visible uniquement via `body.partner-offer-print-mode` (cf. src/index.css).
 */
export const PartnerOfferPrintLayout: React.FC<{ offer: PartnerOffer }> = ({ offer }) => {
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
    <div className="po-print-doc">
      {/* Page de garde */}
      <section className="po-cover">
        <div className="po-cover-rule" />
        <p className="po-kicker">Dossier de partenariat — diffusion restreinte</p>
        <h1 className="po-cover-title">
          La Fréquence du Vivant <span className="po-x">×</span> {offer.partnerName}
        </h1>
        <p className="po-cover-sub">{offer.subtitle}</p>
        <div className="po-cover-meta">
          <div>
            <span className="po-label">Date</span>
            <span>{offer.dateLabel}</span>
          </div>
          {offer.partnerSite && (
            <div>
              <span className="po-label">Site partenaire</span>
              <span>{offer.partnerSite.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </div>
          )}
        </div>
        <p className="po-cover-intro">{offer.intro}</p>
        <p className="po-cover-sources">
          <span className="po-label">Sources</span>
          {offer.sources}
        </p>
        <div className="po-cover-foot">
          La Fréquence du Vivant — catalogue Outils &amp; Services
        </div>
      </section>

      {/* 1 — Marchés */}
      <section className="po-section">
        <h2 className="po-h2">1 · Lecture de vos marchés</h2>
        <table className="po-table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Période / Intitulé</th>
              <th style={{ width: '26%' }}>Cahier des charges</th>
              <th style={{ width: '17%' }}>Périmètre &amp; donneur d'ordre</th>
              <th style={{ width: '19%' }}>Livrables</th>
              <th style={{ width: '22%' }}>Nos blocs mobilisables</th>
            </tr>
          </thead>
          <tbody>
            {offer.markets.map((m) => (
              <tr key={m.title}>
                <td>
                  <strong>{m.title}</strong>
                  <br />
                  <span className="po-dim">{m.period}</span>
                </td>
                <td>{m.brief}</td>
                <td>
                  {m.scope}
                  <br />
                  <span className="po-dim">{m.client}</span>
                </td>
                <td>{m.deliverables}</td>
                <td>{m.blocks.join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 2 — Outils */}
      <section className="po-section">
        <h2 className="po-h2">2 · Ce que nous faisons régulièrement — Outils</h2>
        <p className="po-lead">
          Éléments en production aujourd'hui. Aucune projection dans cette section.
        </p>
        <div className="po-grid">
          {offer.tools.map((t) => (
            <div key={t.title} className="po-card">
              <h3 className="po-h3">{t.title}</h3>
              <p>{t.what}</p>
              <p className="po-meta">
                <span className="po-label-inline">Marchés</span> {t.useFor}
              </p>
              <p className="po-proof">{t.proof}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — Services */}
      <section className="po-section">
        <h2 className="po-h2">2 · Ce que nous faisons régulièrement — Services</h2>
        <div className="po-grid">
          {offer.services.map((s) => (
            <div key={s.title} className="po-card">
              <h3 className="po-h3">{s.title}</h3>
              <p>{s.detail}</p>
              <p className="po-meta">
                <span className="po-label-inline">Marchés</span> {s.useFor}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Développements */}
      <section className="po-section">
        <h2 className="po-h2">3 · Développements complémentaires (moins de 3 mois)</h2>
        <table className="po-table">
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Chantier</th>
              <th style={{ width: '28%' }}>Déclencheur</th>
              <th style={{ width: '14%' }}>Durée</th>
              <th style={{ width: '34%' }}>Livrable produit</th>
            </tr>
          </thead>
          <tbody>
            {offer.developments.map((d) => (
              <tr key={d.title}>
                <td>
                  <strong>{d.title}</strong>
                </td>
                <td>{d.trigger}</td>
                <td>{d.duration}</td>
                <td>{d.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 5 — Collaboration */}
      <section className="po-section">
        <h2 className="po-h2">4 · Modes de collaboration</h2>
        <div className="po-grid po-grid-2">
          {offer.collaboration.map((c) => (
            <div key={c.mode} className="po-card">
              <h3 className="po-h3">{c.mode}</h3>
              <p>{c.summary}</p>
              <p className="po-meta">
                <span className="po-label-inline">Rôles</span> {c.roles}
              </p>
              <p className="po-meta">
                <span className="po-label-inline">Données</span> {c.data}
              </p>
              <ul className="po-list">
                {c.commitments.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 6 — Questions */}
      <section className="po-section">
        <h2 className="po-h2">5 · Les questions que nous vous posons</h2>
        <table className="po-table">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>N°</th>
              <th style={{ width: '18%' }}>Thème</th>
              <th style={{ width: '40%' }}>Question</th>
              <th style={{ width: '36%' }}>Pourquoi elle compte</th>
            </tr>
          </thead>
          <tbody>
            {offer.questions.map((q, i) => (
              <tr key={q.question}>
                <td>{String(i + 1).padStart(2, '0')}</td>
                <td>{q.theme}</td>
                <td>
                  <strong>{q.question}</strong>
                </td>
                <td>{q.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="po-closing">{offer.closing}</p>
        <div className="po-end">
          La Fréquence du Vivant — dossier transmis à {offer.partnerName}. Diffusion restreinte.
        </div>
      </section>
    </div>,
    host,
  );
};

export default PartnerOfferPrintLayout;
