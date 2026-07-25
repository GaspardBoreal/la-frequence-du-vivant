import React from 'react';
import type { GalleryPhoto } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  photos: GalleryPhoto[];
  proprieteNom: string;
  proprieteVille?: string | null;
}

/**
 * Cahier photo A4 imprimable. Isolation via classe `portrait-printing` sur body
 * — voir `src/index.css`. Écran : donne une prévisualisation compacte.
 */
export const PortraitPrintLayout: React.FC<Props> = ({ photos, proprieteNom, proprieteVille }) => {
  if (photos.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Sélectionnez des photos pour composer le cahier imprimable.
      </div>
    );
  }

  const authors = Array.from(new Set(photos.map((p) => p.author_name).filter(Boolean))) as string[];
  const eventCount = 0; // future: dériver depuis metadata
  const heroDensity = photos.length <= 6;

  return (
    <div className="portrait-print-root">
      {/* Couverture */}
      <section className="portrait-print-cover">
        <div className="portrait-print-cover-inner">
          <div className="portrait-print-eyebrow">Portrait du site</div>
          <h1 className="portrait-print-title">{proprieteNom}</h1>
          {proprieteVille && <div className="portrait-print-place">{proprieteVille}</div>}
          <div className="portrait-print-meta">
            {photos.length} photographies
            {authors.length > 0 && ` · ${authors.length} contributeur${authors.length > 1 ? 's' : ''}`}
            {eventCount > 0 && ` · ${eventCount} marche${eventCount > 1 ? 's' : ''}`}
          </div>
          <div className="portrait-print-date">
            Édité le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </section>

      {/* Pages photo */}
      {heroDensity
        ? photos.map((p, i) => (
            <section key={p.id} className="portrait-print-page portrait-print-full">
              <figure>
                <img src={p.url} alt="" />
                <figcaption>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    {p.author_name ?? 'Anonyme'}
                    {p.photo_date && ` · ${new Date(p.photo_date).toLocaleDateString('fr-FR')}`}
                  </span>
                </figcaption>
              </figure>
            </section>
          ))
        : (() => {
            // Hero large sur les 2 premières puis planches 4-up
            const hero = photos.slice(0, 2);
            const rest = photos.slice(2);
            const pages: React.ReactNode[] = hero.map((p, i) => (
              <section key={p.id} className="portrait-print-page portrait-print-full">
                <figure>
                  <img src={p.url} alt="" />
                  <figcaption>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      {p.author_name ?? 'Anonyme'}
                      {p.photo_date && ` · ${new Date(p.photo_date).toLocaleDateString('fr-FR')}`}
                    </span>
                  </figcaption>
                </figure>
              </section>
            ));
            for (let i = 0; i < rest.length; i += 4) {
              const chunk = rest.slice(i, i + 4);
              pages.push(
                <section key={`sheet-${i}`} className="portrait-print-page portrait-print-sheet">
                  <div className="portrait-print-4up">
                    {chunk.map((p, j) => (
                      <figure key={p.id}>
                        <img src={p.url} alt="" />
                        <figcaption>
                          <span className="num">{String(hero.length + i + j + 1).padStart(2, '0')}</span>
                          <span>
                            {p.author_name ?? 'Anonyme'}
                            {p.photo_date && ` · ${new Date(p.photo_date).toLocaleDateString('fr-FR')}`}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              );
            }
            return pages;
          })()}

      {/* Colophon */}
      <section className="portrait-print-page portrait-print-colophon">
        <h2>Crédits</h2>
        {authors.length > 0 ? (
          <ul>
            {authors.map((a) => <li key={a}>{a}</li>)}
          </ul>
        ) : (
          <p>Photographies collectives issues des Marches du Vivant.</p>
        )}
        <p className="portrait-print-signature">Marches du Vivant · La Fréquence du Vivant</p>
      </section>
    </div>
  );
};
