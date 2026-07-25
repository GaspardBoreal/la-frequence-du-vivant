import React, { useMemo } from 'react';
import type { ProprieteParcelle } from '@/hooks/propriete/usePropertyParcelles';

interface StationInfo {
  code: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  source?: string;
  department?: string | null;
  region?: string | null;
  elevation?: number | null;
}

interface Props {
  nom: string;
  adresse?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  center?: [number, number] | null;
  parcelles: ProprieteParcelle[];
  station?: StationInfo | null;
  editionDate: Date;
  pageNumber: number;
  totalPages: number;
}

const fmtLong = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const toDMS = (v: number, dir: 'lat' | 'lng') => {
  const abs = Math.abs(v);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(1);
  const hemi = dir === 'lat' ? (v >= 0 ? 'N' : 'S') : v >= 0 ? 'E' : 'O';
  return `${d}° ${String(m).padStart(2, '0')}′ ${s}″ ${hemi}`;
};

const toDec = (v: number, dir: 'lat' | 'lng') => {
  const hemi = dir === 'lat' ? (v >= 0 ? 'N' : 'S') : v >= 0 ? 'E' : 'O';
  return `${Math.abs(v).toFixed(5)}° ${hemi}`;
};

/** Extrait un tableau de rings [ [lng,lat],... ] depuis une geometry GeoJSON tolérante. */
const extractRings = (geom: any): number[][][] => {
  if (!geom) return [];
  const t = geom.type;
  const c = geom.coordinates;
  if (!c) return [];
  if (t === 'Polygon') return c as number[][][];
  if (t === 'MultiPolygon') return (c as number[][][][]).flat();
  return [];
};

/** Mini-carte SVG des contours cadastraux, projection équirectangulaire locale. */
const CadastreMiniMap: React.FC<{
  parcelles: ProprieteParcelle[];
  center?: [number, number] | null;
  width?: number;
  height?: number;
}> = ({ parcelles, center, width = 320, height = 240 }) => {
  const rings = useMemo(
    () => parcelles.flatMap((p) => extractRings(p.geometry).map((r) => ({ ring: r, id: p.id }))),
    [parcelles],
  );

  const bbox = useMemo(() => {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    const push = (lng: number, lat: number) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    };
    for (const { ring } of rings) for (const [lng, lat] of ring) push(lng, lat);
    for (const p of parcelles) {
      if (p.centroid_lat != null && p.centroid_lng != null) push(p.centroid_lng, p.centroid_lat);
    }
    if (center) push(center[1], center[0]);
    if (!Number.isFinite(minLng)) return null;
    // Petite marge
    const dx = (maxLng - minLng) || 0.001;
    const dy = (maxLat - minLat) || 0.001;
    return {
      minLng: minLng - dx * 0.08,
      maxLng: maxLng + dx * 0.08,
      minLat: minLat - dy * 0.08,
      maxLat: maxLat + dy * 0.08,
    };
  }, [rings, parcelles, center]);

  if (!bbox) {
    return (
      <div
        className="property-print-map-empty"
        style={{ width, height }}
      >
        <span>Aucun contour disponible</span>
      </div>
    );
  }

  // Correction facteur cos(lat) pour éviter l'étirement horizontal
  const midLat = (bbox.minLat + bbox.maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const spanX = (bbox.maxLng - bbox.minLng) * kx;
  const spanY = bbox.maxLat - bbox.minLat;
  const scale = Math.min(width / spanX, height / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const project = (lng: number, lat: number): [number, number] => {
    const x = (lng - bbox.minLng) * kx * scale + offsetX;
    const y = height - ((lat - bbox.minLat) * scale + offsetY);
    return [x, y];
  };

  const centerPt = center ? project(center[1], center[0]) : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className="property-print-map-svg"
    >
      <defs>
        <pattern id="pp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e6dcc4" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="#faf3e0" />
      <rect width={width} height={height} fill="url(#pp-grid)" />
      {rings.map(({ ring }, i) => {
        const d = ring
          .map(([lng, lat], j) => {
            const [x, y] = project(lng, lat);
            return `${j === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ') + ' Z';
        return (
          <path
            key={i}
            d={d}
            fill="rgba(107,124,90,0.18)"
            stroke="#6b7c5a"
            strokeWidth="0.9"
          />
        );
      })}
      {parcelles.map((p) => {
        if (p.centroid_lat == null || p.centroid_lng == null) return null;
        const [x, y] = project(p.centroid_lng, p.centroid_lat);
        return (
          <circle key={p.id} cx={x} cy={y} r={1.6} fill="#4a5a3a" opacity="0.7" />
        );
      })}
      {centerPt && (
        <g>
          <circle cx={centerPt[0]} cy={centerPt[1]} r={5.5} fill="none" stroke="#b08d57" strokeWidth="1.4" />
          <circle cx={centerPt[0]} cy={centerPt[1]} r={2.2} fill="#b08d57" />
        </g>
      )}
      {/* cadre doré */}
      <rect x="0.6" y="0.6" width={width - 1.2} height={height - 1.2} fill="none" stroke="#b08d57" strokeWidth="1.2" />
    </svg>
  );
};

export const PropertyPrintPage: React.FC<Props> = ({
  nom,
  adresse,
  ville,
  codePostal,
  center,
  parcelles,
  station,
  editionDate,
  pageNumber,
  totalPages,
}) => {
  const communes = Array.from(
    new Set(
      parcelles
        .map((p) => (p.commune_nom ? `${p.commune_nom}${p.commune_code ? ` (${p.commune_code})` : ''}` : null))
        .filter(Boolean) as string[],
    ),
  );

  const totalM2 = parcelles.reduce((s, p) => s + (p.contenance_m2 ?? 0), 0);
  const totalHa = totalM2 / 10000;

  const cityLine = [codePostal, ville].filter(Boolean).join(' ');
  const addressLines = [adresse, cityLine].filter(Boolean) as string[];

  // Densité adaptative du tableau parcelles
  const cols = parcelles.length > 20 ? 3 : parcelles.length > 8 ? 2 : 1;

  return (
    <section className="portrait-print-page property-print-page">
      <div className="property-print-inner">
        {/* Filet doré latéral */}
        <div className="property-print-side-rule" />

        {/* En-tête */}
        <header className="property-print-header">
          <div>
            <div className="property-print-eyebrow">Fiche propriété · Cadastre</div>
            <h1 className="property-print-title">{nom}</h1>
            <div className="property-print-title-rule" />
            {addressLines.length > 0 && (
              <div className="property-print-subtitle">{addressLines.join(' · ')}</div>
            )}
          </div>
          <div className="property-print-edition">
            <span>Édité le</span>
            <strong>{fmtLong(editionDate)}</strong>
          </div>
        </header>

        {/* Bloc principal — 2 colonnes */}
        <div className="property-print-grid">
          {/* Colonne identité & cadastre */}
          <div className="property-print-col">
            <div className="property-print-block">
              <div className="property-print-block-title">Identité &amp; cadastre</div>
              {communes.length > 0 && (
                <div className="property-print-chips">
                  {communes.map((c) => (
                    <span key={c} className="property-print-chip">{c}</span>
                  ))}
                </div>
              )}

              <div className="property-print-kpis">
                <div className="property-print-kpi">
                  <div className="k-num">{parcelles.length}</div>
                  <div className="k-lbl">Parcelle{parcelles.length > 1 ? 's' : ''}</div>
                </div>
                <div className="property-print-kpi">
                  <div className="k-num">
                    {totalHa >= 1 ? totalHa.toFixed(2) : totalM2.toLocaleString('fr-FR')}
                  </div>
                  <div className="k-lbl">{totalHa >= 1 ? 'hectares' : 'm² cumulés'}</div>
                </div>
                <div className="property-print-kpi">
                  <div className="k-num">{communes.length}</div>
                  <div className="k-lbl">Commune{communes.length > 1 ? 's' : ''}</div>
                </div>
              </div>

              {parcelles.length > 0 ? (
                <div
                  className="property-print-parcelles"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
                >
                  {parcelles.map((p) => (
                    <div key={p.id} className="property-print-parcelle">
                      <div className="p-line">
                        <span className="p-sec">Sec. {p.section ?? '—'}</span>
                        <span className="p-num">N° {p.numero ?? '—'}</span>
                      </div>
                      <div className="p-meta">
                        {p.prefix && <span>Préf. {p.prefix}</span>}
                        {p.contenance_m2 != null && (
                          <span>{p.contenance_m2.toLocaleString('fr-FR')} m²</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="property-print-empty">Aucune parcelle renseignée</div>
              )}
            </div>
          </div>

          {/* Colonne repères géographiques + carte */}
          <div className="property-print-col">
            <div className="property-print-block">
              <div className="property-print-block-title">Repères géographiques</div>

              <CadastreMiniMap parcelles={parcelles} center={center} width={320} height={220} />
              <div className="property-print-map-legend">
                Contours cadastraux · centroïde de la propriété
              </div>

              {center && (
                <div className="property-print-gps">
                  <div className="gps-row">
                    <span className="gps-lbl">Latitude</span>
                    <span className="gps-dec">{toDec(center[0], 'lat')}</span>
                    <span className="gps-dms">{toDMS(center[0], 'lat')}</span>
                  </div>
                  <div className="gps-row">
                    <span className="gps-lbl">Longitude</span>
                    <span className="gps-dec">{toDec(center[1], 'lng')}</span>
                    <span className="gps-dms">{toDMS(center[1], 'lng')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Station météo */}
        {station && (
          <div className="property-print-station">
            <div className="property-print-station-badge">Station météo de référence</div>
            <div className="property-print-station-body">
              <div className="s-name">{station.name}</div>
              <div className="s-meta">
                {[station.department, station.region].filter(Boolean).join(' · ')}
              </div>
              <div className="s-tags">
                <span>#{station.code}</span>
                <span>{station.distanceKm < 10 ? station.distanceKm.toFixed(1) : Math.round(station.distanceKm)} km</span>
                {station.elevation != null && <span>{station.elevation} m alt.</span>}
                <span className="s-gps">
                  {toDec(station.lat, 'lat')} · {toDec(station.lng, 'lng')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="portrait-print-footer">
          <span>{nom}</span>
          <span className="center">— {String(pageNumber).padStart(2, '0')} / {String(totalPages).padStart(2, '0')} —</span>
          <span>Fiche propriété</span>
        </div>
      </div>
    </section>
  );
};

export default PropertyPrintPage;
