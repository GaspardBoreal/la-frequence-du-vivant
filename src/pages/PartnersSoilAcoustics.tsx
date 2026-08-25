/**
 * Page publique bilingue : partenariat en discussion entre
 * La Fréquence du Vivant et Soil Acoustics (UK).
 * EN par défaut, FR via ?lang=fr. Impression A4 paysage via le bouton PDF.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEOHead from '@/components/SEOHead';

import {
  soilAcousticsContent,
  CALENDLY_URL,
  SOIL_ACOUSTICS_URL,
  CONTACT_EMAIL,
  type SaLang,
} from '@/content/soilAcousticsPartnership';
import '@/styles/soil-acoustics.css';

const PAGE_URL = 'https://la-frequence-du-vivant.com/partners/soil-acoustics';

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

const ConstatIcons = [
  <svg key="a" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0v4a6 6 0 0 1-6 6" /><path d="M14 16a2 2 0 0 1-4 0v-3" /></svg>,
  <svg key="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
  <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
];

const AppIcons = [
  <svg key="a" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 16v-2a2 2 0 0 1 2-2h1" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="18" r="2" /><path d="M16 8v3a3 3 0 0 1-3 3H9" /></svg>,
  <svg key="b" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4-1-1-2-2-2-4" /><path d="M12 22V12" /><path d="M12 12a5 5 0 0 0-5-5 5 5 0 0 0 5 5Z" /><path d="M12 12a5 5 0 0 1 5-5 5 5 0 0 1-5 5Z" /></svg>,
  <svg key="c" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="2.4" /><circle cx="8" cy="13" r="2.4" /><circle cx="16" cy="13" r="2.4" /><circle cx="10" cy="18" r="2.4" /><circle cx="14" cy="18" r="2.4" /><path d="M12 5V3" /></svg>,
];

const ListenVisual = () => (
  <div className="sa-listen" aria-hidden="true">
    <svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="sa-clip"><rect x="0" y="0" width="520" height="400" rx="18" /></clipPath>
      </defs>
      <g clipPath="url(#sa-clip)">
        <rect width="520" height="400" fill="#16290A" />
        <rect y="0" width="520" height="176" fill="#1E3A0E" />
        <rect y="176" width="520" height="70" fill="#3B2A18" />
        <rect y="246" width="520" height="80" fill="#31210F" />
        <rect y="326" width="520" height="74" fill="#28190A" />
        <g fill="#9DB86D" opacity="0.18">
          <circle cx="120" cy="205" r="2.4" /><circle cx="330" cy="215" r="1.8" />
          <circle cx="205" cy="270" r="2.1" /><circle cx="400" cy="290" r="1.6" />
          <circle cx="90" cy="300" r="2" /><circle cx="290" cy="340" r="1.7" />
          <circle cx="440" cy="200" r="1.6" /><circle cx="160" cy="355" r="2.2" />
        </g>
        <g stroke="#9DB86D" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
          <path d="M150 176 q4 -18 -3 -30" />
          <path d="M168 176 q-3 -14 5 -24" />
          <path d="M370 176 q4 -20 -4 -32" />
        </g>
        <g fill="none" stroke="#D9952B" strokeWidth="2">
          <circle className="sa-ring sa-ring--1" cx="260" cy="176" r="34" />
          <circle className="sa-ring sa-ring--2" cx="260" cy="176" r="34" />
          <circle className="sa-ring sa-ring--3" cx="260" cy="176" r="34" />
          <circle className="sa-ring sa-ring--4" cx="260" cy="176" r="34" />
        </g>
        <circle cx="260" cy="176" r="5" fill="#F2C57C" />
        <rect x="256" y="150" width="8" height="30" rx="3" fill="#EDF2E4" />
        <circle cx="260" cy="148" r="7" fill="#EDF2E4" />
      </g>
    </svg>
  </div>
);

const PartnersSoilAcoustics: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const lang: SaLang = params.get('lang') === 'fr' ? 'fr' : 'en';
  const t = soilAcousticsContent[lang];
  const rootRef = useRef<HTMLDivElement>(null);

  // Révélation au scroll — même comportement que la maquette d'origine.
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.sa-reveal');
    if (!els?.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  const setLang = (next: SaLang) => {
    const p = new URLSearchParams(params);
    if (next === 'en') p.delete('lang');
    else p.set('lang', 'fr');
    setParams(p, { replace: true });
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: t.meta.title,
      description: t.meta.description,
      inLanguage: lang === 'fr' ? 'fr-FR' : 'en-GB',
      url: lang === 'fr' ? `${PAGE_URL}?lang=fr` : PAGE_URL,
      about: [
        { '@type': 'Organization', name: 'Soil Acoustics Ltd.', url: SOIL_ACOUSTICS_URL },
        { '@type': 'Organization', name: 'La Fréquence du Vivant', url: 'https://la-frequence-du-vivant.com' },
      ],
    }),
    [lang, t],
  );

  return (
    <>
      <SEOHead
        title={t.meta.title}
        description={t.meta.description}
        keywords="soil acoustics, soil biodiversity, bioacoustics, La Fréquence du Vivant, Fréquence Jardin, Fréquence Vignoble, partnership"
        canonicalUrl={PAGE_URL}
      />
      <Helmet>
        <html lang={lang} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=Poppins:wght@400;600&display=swap"
        />
        <link rel="alternate" hrefLang="en" href={PAGE_URL} />
        <link rel="alternate" hrefLang="fr" href={`${PAGE_URL}?lang=fr`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="lfdv-sa" ref={rootRef}>
        {/* ---------- Barre utilitaire ---------- */}
        <div className="sa-topbar">
          <div className="sa-topbar__inner">
            <div className="sa-topbar__brand">
              <span>La Fréquence du Vivant × Soil Acoustics</span>
            </div>


            <div className="sa-topbar__actions">
              <div className="sa-lang" role="group" aria-label="Language">
                <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
                <button type="button" aria-pressed={lang === 'fr'} onClick={() => setLang('fr')}>FR</button>
              </div>
              <button type="button" className="sa-topbar__pdf" onClick={() => window.print()}>
                {t.topbar.pdf}
              </button>
            </div>
          </div>
        </div>

        {/* ---------- 1. HERO ---------- */}
        <div className="sa-hero">
          <div className="sa-wrap sa-hero__grid">
            <div>
              <p className="sa-eyebrow">{t.hero.eyebrow}</p>
              <h1>{t.hero.title}</h1>
              <p className="sa-hero__lead">{t.hero.lead}</p>
              <span className="sa-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                {t.hero.badge}
              </span>
              <p className="sa-hero__sign">{t.hero.signature}</p>
              <div className="sa-hero__ctas">
                <a className="sa-btn sa-btn--primary" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  {t.hero.ctaPrimary}
                </a>
                <a className="sa-btn sa-btn--ghost" href={SOIL_ACOUSTICS_URL} target="_blank" rel="noopener noreferrer">
                  {t.hero.ctaGhost}
                </a>
              </div>
            </div>
            <ListenVisual />
          </div>
        </div>

        {/* ---------- 2. ENJEUX ET OPPORTUNITÉS ---------- */}
        <div className="sa-block sa-constat">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.stakes.eyebrow}</p>
              <h2 className="sa-section-title">{t.stakes.title}</h2>
              <p className="sa-section-sub">{t.stakes.subtitle}</p>
            </div>
            <div className="sa-cards">
              {t.stakes.cards.map((card, i) => (
                <div className="sa-card sa-reveal" key={card.title}>
                  <div className="sa-icon-circle">{ConstatIcons[i]}</div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
            <div className="sa-stats sa-reveal">
              {t.stakes.stats.map((s) => (
                <div className="sa-stat" key={s.label}>
                  <span className="sa-stat__value">{s.value}</span>
                  <span className="sa-stat__label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- 3. PLATEFORME ---------- */}
        <div className="sa-block sa-explore">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.platform.eyebrow}</p>
              <h2 className="sa-section-title">{t.platform.title}</h2>
            </div>
            <div className="sa-triple">
              {t.platform.columns.map((col) => (
                <div className="sa-tech-card sa-reveal" key={col.title}>
                  <h3>{col.title}</h3>
                  <ul>
                    {col.items.map((item) => (
                      <li key={item}>
                        <CheckIcon />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="sa-callout sa-reveal">
              <h3>{t.platform.missingTitle}</h3>
              <p>{t.platform.missingBody}</p>
            </div>
          </div>
        </div>

        {/* ---------- 4. QUATRE APPLICATIONS ---------- */}
        <div className="sa-block sa-apps">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.apps.eyebrow}</p>
              <h2 className="sa-section-title">{t.apps.title}</h2>
            </div>
            <div className="sa-apps__grid sa-apps__grid--4">
              {t.apps.cards.map((card, i) => (
                <div className="sa-app-card sa-reveal" key={card.title}>
                  <div className="sa-icon-circle">{AppIcons[i % AppIcons.length]}</div>
                  <span className="sa-pill">{card.audience}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- 5. LA PIÈCE MANQUANTE ---------- */}
        <div className="sa-block sa-piece">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.missingPiece.eyebrow}</p>
              <h2 className="sa-section-title">{t.missingPiece.title}</h2>
            </div>
            <div className="sa-facing">
              <div className="sa-facing__col sa-reveal">
                <h3>{t.missingPiece.left.title}</h3>
                <ul className="sa-facing__list">
                  {t.missingPiece.left.items.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sa-facing__col sa-facing__col--accent sa-reveal">
                <h3>{t.missingPiece.right.title}</h3>
                <ul className="sa-facing__list">
                  {t.missingPiece.right.items.map((item) => (
                    <li key={item.label}>
                      <CheckIcon />
                      <span>
                        <strong>{item.label}</strong> {item.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- 6. CE QUE NOUS RECHERCHONS ---------- */}
        <div className="sa-block sa-seeking">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.seeking.eyebrow}</p>
              <h2 className="sa-section-title">{t.seeking.title}</h2>
            </div>
            <div className="sa-seeking__grid">
              {t.seeking.items.map((item, i) => (
                <div className={`sa-seek-card sa-reveal${item.priority ? ' sa-seek-card--priority' : ''}`} key={item.title}>
                  <span className="sa-seek-card__num">{i + 1}</span>
                  <div>
                    <h3>
                      {item.title}
                      {item.priority && <span className="sa-tag">{t.seeking.priorityTag}</span>}
                    </h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- 7. CE QUE NOUS APPORTONS ---------- */}
        <div className="sa-block sa-giveback">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.giveBack.eyebrow}</p>
              <h2 className="sa-section-title">{t.giveBack.title}</h2>
            </div>
            <div className="sa-give__grid">
              {t.giveBack.stats.map((s) => (
                <div className="sa-give-card sa-reveal" key={s.label}>
                  <span className="sa-stat__value">{s.value}</span>
                  <span className="sa-stat__label">{s.label}</span>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
            <p className="sa-give__note sa-reveal">{t.giveBack.note}</p>
          </div>
        </div>

        {/* ---------- 8. CALENDRIER ---------- */}
        <div className="sa-block sa-status">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.timeline.eyebrow}</p>
              <h2 className="sa-section-title">{t.timeline.title}</h2>
            </div>
            <div className="sa-steps sa-steps--4">
              {t.timeline.steps.map((step, i) => (
                <div className={`sa-step sa-reveal${i === 0 ? ' sa-step--current' : ''}`} key={step.month}>
                  <span className="sa-step__dot">{i + 1}</span>
                  <span className="sa-step__tag">{step.month}</span>
                  <h3>{step.tag}</h3>
                  <ul className="sa-step__list">
                    {step.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="sa-status__note">{t.timeline.note}</p>
          </div>
        </div>

        {/* ---------- 9. PROPOSITION DE PILOTE ---------- */}
        <div className="sa-block sa-pilot">
          <div className="sa-wrap">
            <div className="sa-reveal">
              <p className="sa-eyebrow">{t.pilot.eyebrow}</p>
              <h2 className="sa-section-title">{t.pilot.title}</h2>
            </div>
            <div className="sa-facing">
              <div className="sa-facing__col sa-reveal">
                <h3>{t.pilot.left.title}</h3>
                <ul className="sa-facing__list">
                  {t.pilot.left.items.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sa-facing__col sa-facing__col--accent sa-reveal">
                <h3>{t.pilot.right.title}</h3>
                <ul className="sa-facing__list">
                  {t.pilot.right.items.map((item) => (
                    <li key={item}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="sa-callout sa-reveal">
              <p>{t.pilot.commitment}</p>
            </div>
          </div>
        </div>

        {/* ---------- 10. CLÔTURE ---------- */}
        <div className="sa-block sa-cta" id="talk">
          <div className="sa-wrap">
            <div className="sa-cta__box sa-reveal">
              <div>
                <h2>{t.cta.title}</h2>
                <p>{t.cta.body}</p>
              </div>
              <div className="sa-cta__actions">
                <a className="sa-btn sa-btn--forest" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                  {t.cta.primary}
                </a>
                <a className="sa-btn sa-btn--outline" href={`mailto:${CONTACT_EMAIL}`}>
                  {t.cta.secondary}
                </a>
                <p className="sa-cta__hint">{t.cta.hint}</p>
              </div>
            </div>

            <div className="sa-footer-note">
              <p className="sa-quote">
                {t.footer.quote}
                <br />
                {t.footer.author}
              </p>
              <div className="sa-signature">
                <strong>{t.footer.name}</strong>
                <span>{t.footer.role}</span>
                <a href={`tel:${t.footer.phone.replace(/\s/g, '')}`}>{t.footer.phone}</a>
                <span className="sa-signature__links">
                  {SOIL_ACOUSTICS_FOOTER_LINKS.map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  ))}
                </span>
              </div>
            </div>
            <p className="sa-credit">{t.footer.credit}</p>
          </div>
        </div>

      </div>
    </>
  );
};

export default PartnersSoilAcoustics;
