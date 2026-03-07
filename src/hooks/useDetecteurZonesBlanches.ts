import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress } from '@/utils/geocoding';
import { toast } from 'sonner';

const SESSION_KEY = 'zones-blanches-searches';
const MAX_SEARCHES = 10;

export interface SpeciesSample {
  scientificName: string;
  commonName?: string;
  date?: string;
}

export type ZoneResolution = 'radar' | 'loupe' | 'microscope';

export interface ZoneResult {
  lat: number;
  lng: number;
  distance_km: number;
  observations: number;
  is_blank: boolean;
  label: string;
  resolution: ZoneResolution;
  scan_radius_km: number;
  sample_species?: SpeciesSample[];
}

export interface DetectionResult {
  center: { lat: number; lng: number };
  zones: ZoneResult[];
  blank_count: number;
  total_scanned: number;
  phases_completed: number;
}

function getSearchCount(): number {
  return parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
}

function incrementSearchCount(): number {
  const count = getSearchCount() + 1;
  sessionStorage.setItem(SESSION_KEY, String(count));
  return count;
}

export const useDetecteurZonesBlanches = () => {
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanPhase, setScanPhase] = useState<string | null>(null);
  const [remainingSearches, setRemainingSearches] = useState(MAX_SEARCHES - getSearchCount());

  const doSearch = useCallback(async (latitude: number, longitude: number) => {
    if (getSearchCount() >= MAX_SEARCHES) {
      toast.error('Vous avez utilisé vos recherches pour cette session.');
      return;
    }

    setIsLoading(true);
    setResults(null);
    setScanPhase('Phase 1/3 — Radar (2km)…');

    try {
      // Simulate phase updates via timing (edge function runs all phases server-side)
      const phaseTimer1 = setTimeout(() => setScanPhase('Phase 2/3 — Loupe (500m)…'), 4000);
      const phaseTimer2 = setTimeout(() => setScanPhase('Phase 3/3 — Microscope (200m)…'), 9000);

      const { data, error } = await supabase.functions.invoke('detect-zones-blanches', {
        body: { latitude, longitude },
      });

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);

      if (error) throw new Error(error.message);

      setResults(data as DetectionResult);
      const remaining = MAX_SEARCHES - incrementSearchCount();
      setRemainingSearches(remaining);
    } catch (err: any) {
      console.error('Erreur détection zones blanches:', err);
      toast.error('Erreur lors de la détection. Réessayez.');
    } finally {
      setIsLoading(false);
      setScanPhase(null);
    }
  }, []);

  const searchByGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas disponible sur votre appareil.');
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          doSearch(pos.coords.latitude, pos.coords.longitude).then(resolve);
        },
        (err) => {
          console.error('Erreur GPS:', err);
          toast.error('Impossible d\'obtenir votre position. Vérifiez les permissions.');
          resolve();
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }, [doSearch]);

  const searchByAddress = useCallback(async (address: string) => {
    if (!address.trim()) {
      toast.error('Veuillez saisir une adresse.');
      return;
    }

    try {
      const result = await geocodeAddress(address);
      await doSearch(result.coordinates[0], result.coordinates[1]);
    } catch {
      toast.error('Adresse introuvable. Essayez avec une ville française.');
    }
  }, [doSearch]);

  return {
    results,
    isLoading,
    scanPhase,
    remainingSearches,
    searchByGPS,
    searchByAddress,
  };
};
