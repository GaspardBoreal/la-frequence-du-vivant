import React from 'react';
import { Button } from '@/components/ui/button';
import { closeTourRef } from './tourRefStore';
import type { TourRef } from './types';
import type { TourRefIndex } from './useTourRefIndex';
import { normRef } from './types';

/** Miniature SVG d'un polygone GeoJSON ([lng, lat]). */
const ShapeThumb: React.FC<{ geometry: any; color?: string | null }> = ({ geometry, color }) => {
  const ring: number[][] | null = React.useMemo(() => {
    const g = geometry?.type === 'Feature' ? geometry.geometry : geometry;
    if (g?.type === 'Polygon') return g.coordinates?.[0] ?? null;
    if (g?.type === 'LineString') return g.coordinates ?? null;
    return null;
  }, [geometry]);

  if (!ring || ring.length < 3) return null;
  const xs = ring.map((c) => c[0]);
  const ys = ring.map((c) => c[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX || 1e-6;
  const h = maxY - minY || 1e-6;
  const pts = ring
    .map((c) => `${(((c[0] - minX) / w) * 92 + 4).toFixed(2)},${((1 - (c[1] - minY) / h) * 60 + 4).toFixed(2)}`)
    .join(' ');

  return (
    <svg viewBox="0 0 100 68" className="h-24 w-full rounded-lg bg-muted/50" role="img" aria-label="Forme du secteur">
      <polygon points={pts} fill={color || 'currentColor'} fillOpacity={0.25} stroke={color || 'currentColor'} strokeWidth={1.2} className="text-primary" />
    </svg>
  );
};

const RefZonePanel: React.FC<{ refItem: TourRef; index: TourRefIndex }> = ({ refItem, index }) => {
  const zone =
    index.zones.find((z) => z.id === refItem.id) ||
    index.zones.find((z) => normRef(z.nom) === normRef(refItem.label));

  if (!zone) return <p className="text-sm text-muted-foreground">Secteur introuvable.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full border border-border"
          style={{ backgroundColor: zone.couleur || 'hsl(var(--primary))' }}
        />
        <span className="text-base font-semibold">{zone.nom}</span>
      </div>
      <ShapeThumb geometry={zone.geometry} color={zone.couleur} />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Surface</div>
          <div className="font-semibold">
            {zone.surface_m2 ? `${Math.round(zone.surface_m2).toLocaleString('fr-FR')} m²` : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Visible sur le plan</div>
          <div className="font-semibold">{zone.visible ? 'Oui' : 'Non'}</div>
        </div>
      </div>
      {zone.note && <p className="text-sm text-muted-foreground whitespace-pre-line">{zone.note}</p>}
      <Button
        variant="outline"
        className="min-h-[40px] w-full"
        onClick={() => {
          closeTourRef();
          window.dispatchEvent(new CustomEvent('propriete:goto-tab', { detail: 'identify' }));
        }}
      >
        Ouvrir la fiche complète
      </Button>
    </div>
  );
};

export default RefZonePanel;
