import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ExplorationWaypoint {
  id: string;
  marche_event_id: string;
  after_marche_id: string;
  ordre: number;
  latitude: number;
  longitude: number;
  label: string | null;
  include_in_biodiversity: boolean;
  biodiversity_synced_at: string | null;
  cadastre_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaypointBioSnapshot {
  id: string;
  waypoint_id: string;
  species_count: number;
  observations_count: number;
  species: any[];
  collected_at: string;
}

export const useExplorationWaypoints = (eventId?: string) => {
  return useQuery({
    queryKey: ['exploration-waypoints', eventId],
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ExplorationWaypoint[]> => {
      const { data, error } = await supabase
        .from('exploration_waypoints')
        .select('*')
        .eq('marche_event_id', eventId!)
        .order('after_marche_id')
        .order('ordre');
      if (error) throw error;
      return (data || []) as ExplorationWaypoint[];
    },
  });
};

export const useCreateWaypoint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      marche_event_id: string;
      after_marche_id: string;
      latitude: number;
      longitude: number;
      ordre: number;
      label?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Shift existing waypoints in the same main segment that sit at or after
      // the new ordre — otherwise insertion at an occupied slot creates an
      // ordre-tie and the new point renders in the wrong position.
      const { data: existing, error: existingErr } = await supabase
        .from('exploration_waypoints')
        .select('id, ordre')
        .eq('marche_event_id', input.marche_event_id)
        .eq('after_marche_id', input.after_marche_id)
        .gte('ordre', input.ordre)
        .order('ordre', { ascending: false });
      if (existingErr) throw existingErr;
      for (const w of existing || []) {
        const { error: upErr } = await supabase
          .from('exploration_waypoints')
          .update({ ordre: w.ordre + 1 })
          .eq('id', w.id);
        if (upErr) throw upErr;
      }

      const { data, error } = await supabase
        .from('exploration_waypoints')
        .insert({ ...input, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-waypoints', vars.marche_event_id] });
      toast({ title: 'Point intermédiaire ajouté' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export const useUpdateWaypoint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId, ...patch }: Partial<ExplorationWaypoint> & { id: string; eventId: string }) => {
      const { error } = await supabase.from('exploration_waypoints').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-waypoints', vars.eventId] });
    },
  });
};

export const useDeleteWaypoint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('exploration_waypoints').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['exploration-waypoints', vars.eventId] });
      toast({ title: 'Point intermédiaire supprimé' });
    },
  });
};

export const useWaypointBioSnapshots = (waypointId?: string) => {
  return useQuery({
    queryKey: ['waypoint-bio', waypointId],
    enabled: !!waypointId,
    queryFn: async (): Promise<WaypointBioSnapshot | null> => {
      const { data, error } = await supabase
        .from('waypoint_biodiversity_snapshots')
        .select('*')
        .eq('waypoint_id', waypointId!)
        .order('collected_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as WaypointBioSnapshot | null;
    },
  });
};

export const useCollectWaypointBio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (waypointId: string) => {
      const { data, error } = await supabase.functions.invoke('collect-waypoint-biodiversity', {
        body: { waypointId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, waypointId) => {
      qc.invalidateQueries({ queryKey: ['waypoint-bio', waypointId] });
      toast({
        title: 'Biodiversité collectée',
        description: `${data?.speciesCount ?? 0} espèces autour du point.`,
      });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur de collecte', description: e.message, variant: 'destructive' }),
  });
};

// Haversine
export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

/**
 * Build the route positions array passing through all waypoints in order, plus per-segment km totals.
 * geoMarches: sorted main steps with lat/lng.
 * waypoints: grouped by after_marche_id, sorted by ordre.
 */
export const buildRouteWithWaypoints = (
  geoMarches: { id: string; latitude: number; longitude: number }[],
  waypoints: ExplorationWaypoint[],
  isLoop = false,
) => {
  const byAfter = new Map<string, ExplorationWaypoint[]>();
  waypoints.forEach((w) => {
    const arr = byAfter.get(w.after_marche_id) || [];
    arr.push(w);
    byAfter.set(w.after_marche_id, arr);
  });
  byAfter.forEach((arr) => arr.sort((a, b) => a.ordre - b.ordre));

  const positions: [number, number][] = [];
  let estimatedKm = 0;
  let crowKm = 0;

  geoMarches.forEach((m, i) => {
    positions.push([m.latitude, m.longitude]);
    if (i > 0) {
      const prev = geoMarches[i - 1];
      crowKm += haversineKm(prev.latitude, prev.longitude, m.latitude, m.longitude);
    }
    if (i < geoMarches.length - 1) {
      const wps = byAfter.get(m.id) || [];
      let prevPt: { latitude: number; longitude: number } = m;
      wps.forEach((w) => {
        positions.push([w.latitude, w.longitude]);
        estimatedKm += haversineKm(prevPt.latitude, prevPt.longitude, w.latitude, w.longitude);
        prevPt = w;
      });
      const next = geoMarches[i + 1];
      estimatedKm += haversineKm(prevPt.latitude, prevPt.longitude, next.latitude, next.longitude);
    }
  });

  // Closing segment: last step → first step (with its waypoints)
  if (isLoop && geoMarches.length >= 2) {
    const last = geoMarches[geoMarches.length - 1];
    const first = geoMarches[0];
    const wps = byAfter.get(last.id) || [];
    let prevPt: { latitude: number; longitude: number } = last;
    wps.forEach((w) => {
      positions.push([w.latitude, w.longitude]);
      estimatedKm += haversineKm(prevPt.latitude, prevPt.longitude, w.latitude, w.longitude);
      prevPt = w;
    });
    positions.push([first.latitude, first.longitude]);
    estimatedKm += haversineKm(prevPt.latitude, prevPt.longitude, first.latitude, first.longitude);
    crowKm += haversineKm(last.latitude, last.longitude, first.latitude, first.longitude);
  }

  return { positions, estimatedKm, crowKm };
};
