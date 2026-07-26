import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { RichMap } from '@/components/maps';
import { PLANT_INDICATORS } from '@/lib/plantIndicatorKb';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';

const norm = (s: string | null | undefined): string =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const KINGDOM_COLORS: Record<string, string> = {
  Plantae: '#2f5d3a',
  Animalia: '#c26a3a',
  Fungi: '#8a4b8f',
  Other: '#8a8a8a',
};

const kingdomFrom = (k?: string | null): string => {
  const s = (k || '').toLowerCase();
  if (s.includes('plant')) return 'Plantae';
  if (s.includes('fungi')) return 'Fungi';
  if (s.includes('animal') || s.includes('aves') || s.includes('insect') || s.includes('mamm')) return 'Animalia';
  return 'Other';
};

type KingdomFilter = 'all' | 'Plantae' | 'Animalia' | 'Fungi';

export const RevealMapBlock: React.FC<{ proprieteId?: string; index?: number }> = ({
  proprieteId,
  index = 0,
}) => {
  const { waypoints } = usePropertySpeciesPool(proprieteId);

  const { data: propriete } = useQuery({
    queryKey: ['propriete-coords', proprieteId],
    enabled: !!proprieteId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('proprietes')
        .select('latitude, longitude, nom')
        .eq('id', proprieteId!)
        .maybeSingle();
      return data;
    },
  });

  const [kingdom, setKingdom] = useState<KingdomFilter>('all');
  const [onlyKb, setOnlyKb] = useState(false);

  const kbKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of PLANT_INDICATORS) {
      if (p.latin) s.add(norm(p.latin));
      const g = norm(p.latin).split(/\s+/)[0];
      if (g) s.add(g);
    }
    return s;
  }, []);

  const filtered = useMemo(() => {
    return waypoints.filter((w) => {
      const k = kingdomFrom(w.kingdom);
      if (kingdom !== 'all' && k !== kingdom) return false;
      if (onlyKb) {
        const n = norm(w.scientificName);
        const g = n.split(/\s+/)[0];
        if (!kbKeys.has(n) && !kbKeys.has(g)) return false;
      }
      return true;
    });
  }, [waypoints, kingdom, onlyKb, kbKeys]);

  const bounds = useMemo<Array<[number, number]>>(() => {
    const b: Array<[number, number]> = filtered.map((w) => [w.lat, w.lng]);
    if (propriete?.latitude != null && propriete?.longitude != null) {
      b.push([propriete.latitude, propriete.longitude]);
    }
    return b;
  }, [filtered, propriete]);

  const center: [number, number] =
    propriete?.latitude != null && propriete?.longitude != null
      ? [propriete.latitude, propriete.longitude]
      : filtered[0]
      ? [filtered[0].lat, filtered[0].lng]
      : [45.0, 0.5];

  const iconFor = (color: string) =>
    L.divIcon({
      className: 'reveal-wp-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 0 2px #FAF8F3, 0 2px 6px rgba(0,0,0,.3);"></div>`,
    });

  const stats = useMemo(() => {
    const counts: Record<string, number> = { Plantae: 0, Animalia: 0, Fungi: 0, Other: 0 };
    for (const w of filtered) counts[kingdomFrom(w.kingdom)]++;
    return counts;
  }, [filtered]);

  const hasData = waypoints.length > 0;

  return (
    <AnalyzeCard
      number={2}
      category="Carte des révélations"
      title="Où les marcheurs ont-ils observé le vivant ?"
      subtitle="Chaque point est une observation géolocalisée par un marcheur sur votre propriété."
      index={index}
    >
      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] p-6 text-center text-sm italic text-[hsl(var(--ds-forest-deep))]/60">
          <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
          Aucune observation géolocalisée pour l'instant.
          <br />
          <span className="text-xs">Les prochains passages des marcheurs enrichiront cette carte.</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest-deep))]/70 mr-1">
              <Filter className="w-3 h-3" /> Filtre
            </div>
            {(['all', 'Plantae', 'Animalia', 'Fungi'] as KingdomFilter[]).map((k) => (
              <button
                key={k}
                onClick={() => setKingdom(k)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  kingdom === k
                    ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
                    : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
                }`}
              >
                {k === 'all' ? 'Tous' : KINGDOM_LABELS_FR_SHORT[normalizeKingdom(k)]}
                {k !== 'all' && (
                  <span className="ml-1 opacity-60">· {stats[k] ?? 0}</span>
                )}
              </button>
            ))}
            <button
              onClick={() => setOnlyKb((v) => !v)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                onlyKb
                  ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest-deep))]'
                  : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
            >
              🌿 Bio-indicatrices seulement
            </button>
            <span className="ml-auto text-[11px] font-semibold text-[hsl(var(--ds-forest))]">
              {filtered.length} obs.
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[hsl(var(--ds-line))]" style={{ height: 380 }}>
            <RichMap
              center={center}
              zoom={16}
              bounds={bounds.length > 1 ? bounds : undefined}
              controls={{ zoom: true, style: true, geolocate: false, cadastre: true }}
              maxZoom={22}
              height="100%"
            >
              {filtered.map((w) => {
                const color = KINGDOM_COLORS[kingdomFrom(w.kingdom)] || KINGDOM_COLORS.Other;
                return (
                  <Marker key={w.id} position={[w.lat, w.lng]} icon={iconFor(color)}>
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        {w.photoUrl && (
                          <img
                            src={w.photoUrl}
                            alt={w.scientificName}
                            style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 4 }}
                          />
                        )}
                        <div style={{ fontWeight: 600, fontSize: 12 }}>
                          {w.commonName || w.scientificName}
                        </div>
                        <div style={{ fontSize: 10, fontStyle: 'italic', color: '#666' }}>
                          {w.scientificName}
                        </div>
                        {w.observationDate && (
                          <div style={{ fontSize: 10, marginTop: 4, color: '#888' }}>
                            <Camera style={{ display: 'inline', width: 10, height: 10, marginRight: 2 }} />
                            {new Date(w.observationDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </RichMap>
          </div>

          <div className="mt-2 text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 text-center">
            Cliquez un point pour voir la photo et la date d'observation.
          </div>
        </>
      )}
    </AnalyzeCard>
  );
};
