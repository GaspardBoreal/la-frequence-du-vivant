import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  proprieteNom: string;
  proprieteVille?: string | null;
  publicUrl?: string;
  /** 'atelier' = couverture crème signée (défaut). 'hero-photo' = première photo pleine page + titre en surimpression. */
  coverVariant?: 'atelier' | 'hero-photo';
  /** Contenu inséré juste avant la page Colophon (ex : synthèse J'observe dans le cahier combiné). */
  insertBeforeColophon?: React.ReactNode;
  /** Nombre de pages physiques insérées par insertBeforeColophon, pour paginer citation + colophon. */
  insertedPageCount?: number;
  /** Contenu inséré juste après le Sommaire visuel (ex : fiche Propriété). Fonction pour recevoir la pagination. */
  insertAfterToc?: (pageNumber: number, totalPages: number) => React.ReactNode;
  /** Nombre de pages physiques insérées par insertAfterToc. */
  insertedAfterTocPageCount?: number;
}


const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const fmtLong = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

/** Cachet circulaire daté (SVG concentrique — style tampon d'atelier) */
const Seal: React.FC<{ dateLabel: string; photoCount: number; contribCount: number }> = ({
  dateLabel, photoCount, contribCount,
}) => {
  const id = 'seal-arc';
  const top = `PORTRAIT DU SITE · ${dateLabel}`;
  const bot = `${photoCount} PHOTOGRAPHIES · ${contribCount} CONTRIBUTEUR${contribCount > 1 ? 'S' : ''}`;
  return (
    <svg className="portrait-print-seal" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id={`${id}-top`} d="M 30,100 A 70,70 0 0 1 170,100" fill="none" />
        <path id={`${id}-bot`} d="M 30,100 A 70,70 0 0 0 170,100" fill="none" />
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#b08d57" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="#b08d57" strokeWidth="0.4" />
      <circle cx="100" cy="100" r="30" fill="none" stroke="#b08d57" strokeWidth="0.6" />
      <text fill="#8a6d3b" fontFamily="Helvetica, Arial, sans-serif" fontSize="9" letterSpacing="2">
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">{top}</textPath>
      </text>
      <text fill="#8a6d3b" fontFamily="Helvetica, Arial, sans-serif" fontSize="8" letterSpacing="2">
        <textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">{bot}</textPath>
      </text>
      <text x="100" y="96" textAnchor="middle" fill="#2a2419"
            fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="18">
        Marches
      </text>
      <text x="100" y="112" textAnchor="middle" fill="#2a2419"
            fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="14">
        du Vivant
      </text>
    </svg>
  );
};

const QUOTES = [
  "« Regarder un lieu, c'est déjà en prendre soin. »",
  "« Le paysage n'est pas un décor, il est un partenaire. »",
  "« Chaque photographie est une écoute. »",
];

export const PortraitPrintLayout: React.FC<Props> = ({
  photos, proprieteNom, proprieteVille, publicUrl,
  coverVariant = 'atelier', insertBeforeColophon, insertedPageCount = 0,
  insertAfterToc, insertedAfterTocPageCount = 0,
}) => {

  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = publicUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    if (!url) return;
    QRCode.toDataURL(url, { margin: 0, width: 256, color: { dark: '#2a2419', light: '#fbf7ee' } })
      .then(setQr).catch(() => setQr(null));
  }, [publicUrl]);

  if (photos.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Sélectionnez des photos pour composer le cahier imprimable.
      </div>
    );
  }

  const authors = Array.from(new Set(photos.map((p) => p.author_name).filter(Boolean))) as string[];
  const dates = photos.map((p) => p.photo_date).filter(Boolean) as string[];
  const dateSpan = (() => {
    if (dates.length === 0) return null;
    const ts = dates.map((d) => new Date(d).getTime()).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    if (ts.length === 0) return null;
    return { from: new Date(ts[0]), to: new Date(ts[ts.length - 1]) };
  })();
  const today = new Date();
  const editionLabel = fmtLong(today).toUpperCase();

  // Rythme éditorial : alterne pleine page ↔ planche double, insère une respiration toutes ~6 pages
  type Page = { kind: 'full'; photo: GalleryPhoto; index: number }
             | { kind: 'double'; main: GalleryPhoto; sides: GalleryPhoto[]; startIndex: number }
             | { kind: 'breath'; quote: string };
  const pages: Page[] = [];
  const platePhotos = coverVariant === 'hero-photo' ? photos.slice(1) : photos;
  const indexOffset = coverVariant === 'hero-photo' ? 1 : 0;
  let i = 0;
  let pageSinceBreath = 0;
  let quoteIdx = 0;
  while (i < platePhotos.length) {
    // Alterne
    const useDouble = pages.filter((p) => p.kind !== 'breath').length % 2 === 1 && platePhotos.length - i >= 2;
    if (useDouble) {
      const main = platePhotos[i];
      const sides = platePhotos.slice(i + 1, i + 4);
      pages.push({ kind: 'double', main, sides, startIndex: i + indexOffset });
      i += 1 + sides.length;
    } else {
      pages.push({ kind: 'full', photo: platePhotos[i], index: i + indexOffset });
      i += 1;
    }
    pageSinceBreath++;
    if (pageSinceBreath >= 5 && i < platePhotos.length) {
      pages.push({ kind: 'breath', quote: QUOTES[quoteIdx % QUOTES.length] });
      quoteIdx++;
      pageSinceBreath = 0;
    }
  }


  // Retire une éventuelle respiration finale de la boucle (on force notre propre citation avant colophon)
  while (pages.length > 0 && pages[pages.length - 1].kind === 'breath') pages.pop();

  const totalPages = 2 /* cover + toc */ + insertedAfterTocPageCount + pages.length + insertedPageCount + 1 /* final breath */ + 1 /* colophon */;

  const footer = (pageNum: number) => (
    <div className="portrait-print-footer">
      <span>{proprieteNom}</span>
      <span className="center">— {String(pageNum).padStart(2, '0')} / {String(totalPages).padStart(2, '0')} —</span>
      <span>Portrait du site</span>
    </div>
  );

  let pageCursor = 3 + insertedAfterTocPageCount; // cover=1, toc=2, +inserted pages, then photo pages

  return (
    <div className="portrait-print-root">
      {/* ===== Couverture ===== */}
      {coverVariant === 'hero-photo' && photos[0] ? (
        <section className="portrait-print-page portrait-print-full portrait-print-hero-cover">
          <div className="portrait-print-hero">
            <img src={photos[0].url} alt="" crossOrigin="anonymous" />
          </div>
          <div className="portrait-print-hero-overlay">
            <div className="portrait-print-eyebrow" style={{ color: '#fbf7ee' }}>Portrait du site</div>
            <h1 className="portrait-print-title" style={{ color: '#fbf7ee' }}>{proprieteNom}</h1>
            <div className="portrait-print-title-rule" />
            {proprieteVille && <div className="portrait-print-place" style={{ color: '#fbf7ee' }}>{proprieteVille}</div>}
          </div>
          <div className="portrait-print-hero-editfoot">
            Édité le {fmtLong(today)}
          </div>
        </section>
      ) : (
        <section className="portrait-print-cover">
          <div className="portrait-print-eyebrow">Portrait du site</div>
          <div>
            <h1 className="portrait-print-title">{proprieteNom}</h1>
            <div className="portrait-print-title-rule" />
            {proprieteVille && <div className="portrait-print-place">{proprieteVille}</div>}
          </div>
          <div className="portrait-print-cover-foot">
            <div className="portrait-print-cover-quote">
              « Un carnet d'atelier composé à partir des photographies rassemblées par les marcheurs et le propriétaire du lieu — première trace d'un dialogue en cours avec le vivant. »
            </div>
            <Seal
              dateLabel={editionLabel}
              photoCount={photos.length}
              contribCount={authors.length}
            />
          </div>
        </section>
      )}


      {/* ===== Sommaire visuel ===== */}
      <section className="portrait-print-page portrait-print-toc">
        <h2>Sommaire visuel</h2>
        <div className="portrait-print-toc-sub">
          {photos.length} planches · {authors.length} contributeur{authors.length > 1 ? 's' : ''}
        </div>
        <div className="portrait-print-toc-grid">
          {photos.map((p, idx) => (
            <div key={p.id} className="portrait-print-toc-tile">
              <img src={p.url} alt="" crossOrigin="anonymous" />
              <div className="portrait-print-toc-num">{String(idx + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>
        {footer(2)}
      </section>

      {/* ===== Insert après le sommaire visuel (ex : fiche Propriété) ===== */}
      {insertAfterToc && insertAfterToc(3, totalPages)}


      {/* ===== Pages photo ===== */}
      {pages.map((pg, k) => {
        const pageNum = pageCursor++;
        if (pg.kind === 'breath') {
          return (
            <section key={`b-${k}`} className="portrait-print-page portrait-print-breath">
              <p>{pg.quote}</p>
              {footer(pageNum)}
            </section>
          );
        }
        if (pg.kind === 'full') {
          const p = pg.photo;
          return (
            <section key={p.id} className="portrait-print-page portrait-print-full">
              <div className="portrait-print-hero">
                <img src={p.url} alt="" crossOrigin="anonymous" />
              </div>
              <div className="portrait-print-cartouche">
                <div className="num-huge">{String(pg.index + 1).padStart(2, '0')}</div>
                <div className="who">
                  <strong>{p.author_name ?? 'Anonyme'}</strong>
                  {p.caption ? <> — <em>{p.caption}</em></> : null}
                </div>
                <div className="when">{fmtDate(p.photo_date) || '—'}</div>
              </div>
              {footer(pageNum)}
            </section>
          );
        }
        // double
        return (
          <section key={`d-${pg.startIndex}`} className="portrait-print-page portrait-print-double">
            <div className="col-main">
              <figure>
                <img src={pg.main.url} alt="" crossOrigin="anonymous" />
                <figcaption>
                  <span className="num">{String(pg.startIndex + 1).padStart(2, '0')}</span>
                  {pg.main.author_name ?? 'Anonyme'}
                  {pg.main.photo_date && ` · ${fmtDate(pg.main.photo_date)}`}
                </figcaption>
              </figure>
            </div>
            <div className="col-side">
              {pg.sides.map((s, j) => (
                <figure key={s.id}>
                  <img src={s.url} alt="" crossOrigin="anonymous" />
                  <figcaption>
                    <span className="num">{String(pg.startIndex + 2 + j).padStart(2, '0')}</span>
                    {s.author_name ?? 'Anonyme'}
                    {s.photo_date && ` · ${fmtDate(s.photo_date)}`}
                  </figcaption>
                </figure>
              ))}
            </div>
            {footer(pageNum)}
          </section>
        );
      })}

      {insertBeforeColophon}

      {/* ===== Respiration finale — citation ===== */}
      <section className="portrait-print-page portrait-print-breath portrait-print-breath-final">
        <p>{QUOTES[0]}</p>
        {footer(totalPages - 1)}
      </section>

      {/* ===== Colophon ===== */}
      <section className="portrait-print-page portrait-print-colophon">
        <h2>Colophon</h2>
        <div className="portrait-print-colophon-sub">Crédits · période · signature</div>
        <div className="portrait-print-colophon-body">
          <div>
            <div className="portrait-print-colophon-meta">
              <strong>Contributeurs</strong>
            </div>
            {authors.length > 0 ? (
              <ul>
                {authors.map((a) => <li key={a}>{a}</li>)}
              </ul>
            ) : (
              <p className="portrait-print-colophon-meta">
                Photographies collectives issues des Marches du Vivant.
              </p>
            )}
          </div>
          <div className="portrait-print-colophon-meta">
            <div><strong>Édité le</strong> {fmtLong(today)}</div>
            {dateSpan && (
              <div>
                <strong>Période couverte</strong>{' '}
                {fmtLong(dateSpan.from)}
                {dateSpan.from.getTime() !== dateSpan.to.getTime() && <> — {fmtLong(dateSpan.to)}</>}
              </div>
            )}
            <div><strong>Photographies</strong> {photos.length}</div>
            {qr && (
              <div className="portrait-print-colophon-qr" style={{ marginTop: '10mm' }}>
                <img src={qr} alt="QR" />
                <span>Portrait en ligne</span>
              </div>
            )}
          </div>
        </div>
        <div className="portrait-print-colophon-mark">
          <div className="portrait-print-signature">
            <span>Marches du Vivant</span>
            <span><span className="dot" /></span>
            <span>La Fréquence du Vivant</span>
          </div>
        </div>
        {footer(totalPages)}
      </section>
    </div>
  );
};
