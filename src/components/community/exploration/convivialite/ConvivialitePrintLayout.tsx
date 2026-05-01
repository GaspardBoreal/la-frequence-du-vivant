import React from 'react';
import type { ConvivialitePhoto } from '@/hooks/useConvivialitePhotos';

interface Props {
  photos: ConvivialitePhoto[];
  explorationName?: string;
}

/**
 * Layout A4 portrait, 6 photos par page (grille 2x3).
 * Affichage écran identique à l'impression pour prévisualisation.
 */
const ConvivialitePrintLayout: React.FC<Props> = ({ photos, explorationName }) => {
  const PER_PAGE = 6;
  const pages: ConvivialitePhoto[][] = [];
  for (let i = 0; i < photos.length; i += PER_PAGE) {
    pages.push(photos.slice(i, i + PER_PAGE));
  }

  return (
    <div className="convivialite-print-root bg-white text-neutral-900 mx-auto">
      <style>{`
        .convivialite-print-root { font-family: Georgia, serif; }
        .conviv-page {
          width: 210mm;
          min-height: 297mm;
          padding: 14mm;
          margin: 0 auto 16px;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        .conviv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-auto-rows: 1fr;
          gap: 6mm;
          flex: 1;
        }
        .conviv-cell {
          display: flex;
          flex-direction: column;
          gap: 2mm;
          overflow: hidden;
        }
        .conviv-cell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 2mm;
          flex: 1;
          min-height: 0;
        }
        .conviv-caption {
          font-size: 9pt;
          color: #555;
          text-align: center;
        }
        @media print {
          body * { visibility: hidden; }
          .convivialite-print-root, .convivialite-print-root * { visibility: visible; }
          .convivialite-print-root { position: absolute; left: 0; top: 0; }
          .conviv-page { box-shadow: none; margin: 0; }
        }
      `}</style>

      {pages.map((pagePhotos, pIdx) => (
        <div key={pIdx} className="conviv-page">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-base font-semibold">{explorationName || 'Exploration'} — Convivialité</h2>
            <span className="text-xs text-neutral-500">Page {pIdx + 1} / {pages.length}</span>
          </div>
          <div className="conviv-grid">
            {pagePhotos.map((p) => (
              <div key={p.id} className="conviv-cell">
                <img src={p.url} alt="" />
                <div className="conviv-caption">
                  {p.author_prenom} {p.author_nom} · {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConvivialitePrintLayout;
