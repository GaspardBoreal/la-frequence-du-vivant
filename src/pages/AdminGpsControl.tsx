import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useExplorationGpsCandidates } from '@/hooks/gps/useExplorationGpsCandidates';
import GpsControlConsole, { type GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import { haversineM } from '@/utils/geoDistance';

/**
 * Contrôle GPS des observations — périmètre exploration / marche.
 *
 * Même surcouche éditoriale que la console propriété : les corrections sont
 * appliquées par la base (`get_exploration_species_pool`) et se propagent donc
 * à la propriété, aux marches, aux explorations, aux événements et aux exports.
 */
const AdminGpsControl: React.FC = () => {
  const [explorationId, setExplorationId] = useState<string>('');
  const [open, setOpen] = useState(false);

  const { data: explorations } = useQuery({
    queryKey: ['admin-gps-explorations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorations')
        .select('id, name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: marches } = useQuery({
    queryKey: ['admin-gps-marches', explorationId],
    enabled: !!explorationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exploration_marches')
        .select('marches!inner(id, latitude, longitude, radius_m)')
        .eq('exploration_id', explorationId);
      if (error) throw error;
      return (data || []).map((r: any) => r.marches).filter(Boolean);
    },
  });

  const { waypoints, isLoading } = useExplorationGpsCandidates(explorationId || undefined);

  /** Suspicion : distance au rayon de la marche la plus proche. */
  const candidates = useMemo<GpsCandidate[]>(() => {
    const refs = (marches || []).filter((m: any) => m?.latitude && m?.longitude);
    return waypoints.map((w) => {
      if (!refs.length) return { ...w, geofenceStatus: 'unknown' as const, geofenceDistanceM: null };
      let best = Infinity;
      for (const m of refs) {
        const d = haversineM(w.lat, w.lng, Number(m.latitude), Number(m.longitude));
        const over = d - Number(m.radius_m || 500);
        if (over < best) best = over;
      }
      return {
        ...w,
        geofenceStatus: best <= 0 ? ('inside' as const) : best <= 50 ? ('edge' as const) : ('outside' as const),
        geofenceDistanceM: best > 0 ? Math.round(best) : 0,
      };
    });
  }, [waypoints, marches]);

  const center = useMemo<[number, number]>(() => {
    if (!candidates.length) return [45.0, 0.5];
    const lat = candidates.reduce((s, c) => s + c.lat, 0) / candidates.length;
    const lng = candidates.reduce((s, c) => s + c.lng, 0) / candidates.length;
    return [lat, lng];
  }, [candidates]);

  const suspects = candidates.filter(
    (c) => c.geofenceStatus === 'outside' || c.obscured === true || !!c.overrideStatus,
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/admin/outils">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Outils
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Contrôle GPS des observations</h1>
        <p className="text-muted-foreground mb-6 text-sm max-w-2xl">
          Repérez les points mal placés d'une exploration, corrigez-les ou écartez-les. La
          correction est une surcouche éditoriale : la donnée iNaturalist d'origine est conservée,
          et le résultat s'applique partout (propriété, marches, explorations, événements, exports).
        </p>

        <Card className="p-6 space-y-4">
          <label className="block text-sm font-medium">Exploration</label>
          <select
            value={explorationId}
            onChange={(e) => setExplorationId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">— Choisir une exploration —</option>
            {(explorations || []).map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {explorationId && (
            <div className="text-sm text-muted-foreground">
              {isLoading
                ? 'Chargement des points…'
                : `${candidates.length} points géolocalisés · ${suspects.length} à examiner`}
            </div>
          )}

          <Button disabled={!explorationId || !candidates.length} onClick={() => setOpen(true)}>
            <Crosshair className="h-4 w-4 mr-2" />
            Ouvrir la console
          </Button>
        </Card>
      </div>

      <GpsControlConsole
        open={open}
        onClose={() => setOpen(false)}
        candidates={candidates}
        parcelRings={[]}
        center={center}
        displayNameFor={(w) => w.commonName || w.scientificName || 'Espèce'}
      />
    </div>
  );
};

export default AdminGpsControl;
