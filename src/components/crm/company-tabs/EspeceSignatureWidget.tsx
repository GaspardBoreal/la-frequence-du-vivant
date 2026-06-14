import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Leaf, Loader2, MapPin } from 'lucide-react';
import { SpeciesName } from '@/components/species/SpeciesName';

interface SignatureSpecies {
  scientific_name: string;
  common_name_fr: string | null;
  iconic_taxon: string | null;
  kingdom: string | null;
  observation_count: number;
  last_observation_date: string | null;
  last_photo_url: string | null;
  last_marche_id: string | null;
  last_marche_title: string | null;
  last_marche_slug: string | null;
  distance_km: number | null;
  patrimoine_score: number;
}

function formatDateFr(d?: string | null) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return d;
  }
}

export const EspeceSignatureWidget: React.FC<{
  companyId: string;
  companyName: string;
  hasGps: boolean;
}> = ({ companyId, companyName, hasGps }) => {
  const [radius, setRadius] = React.useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['signature-species', companyId, radius],
    enabled: hasGps,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_signature_species_for_company', {
        p_company_id: companyId,
        p_radius_km: radius,
        p_limit: 12,
      });
      if (error) throw error;
      return (data ?? []) as SignatureSpecies[];
    },
  });

  const hero = data?.[0];

  if (!hasGps) {
    return (
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Espèce signature</h3>
        </div>
        <p className="text-sm text-muted-foreground italic">
          Géolocaliser l'entreprise pour activer le storytelling « Espèce signature ».
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Espèce signature</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Espèces patrimoniales observées autour du siège de <strong>{companyName}</strong> lors des marches.
      </p>

      <div className="flex items-center gap-3 py-1">
        <span className="text-xs text-muted-foreground shrink-0">Rayon : <strong>{radius} km</strong></span>
        <Slider
          min={5}
          max={50}
          step={5}
          value={[radius]}
          onValueChange={(v) => setRadius(v[0])}
          className="flex-1"
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Recherche des espèces…
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Aucune observation enregistrée dans un rayon de {radius} km.
        </p>
      )}

      {hero && (
        <Card className="p-3 bg-gradient-to-br from-primary/5 to-primary/0 border-primary/20">
          <div className="flex gap-3">
            {hero.last_photo_url && (
              <img
                src={hero.last_photo_url}
                alt={hero.scientific_name}
                className="w-20 h-20 rounded-md object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-primary font-semibold">
                Espèce signature
              </div>
              <div className="font-semibold text-base">
                <SpeciesName scientificName={hero.scientific_name} commonName={hero.common_name_fr} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Observée le {formatDateFr(hero.last_observation_date)}
                {hero.last_marche_title && ` lors de « ${hero.last_marche_title} »`}
                {hero.distance_km != null && ` à ${hero.distance_km} km du siège.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {data && data.length > 1 && (
        <>
          <div className="text-xs text-muted-foreground">
            <strong>{data.length}</strong> espèces patrimoniales recensées dans un rayon de {radius} km :
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {data.slice(1).map((s) => (
              <div key={s.scientific_name} className="space-y-1">
                {s.last_photo_url ? (
                  <img
                    src={s.last_photo_url}
                    alt={s.scientific_name}
                    title={`${s.common_name_fr ?? s.scientific_name} — ${s.distance_km} km`}
                    className="w-full aspect-square rounded object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square rounded bg-muted flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="text-[10px] truncate text-center">
                  {s.common_name_fr ?? s.scientific_name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hero && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="text-[10px]">
            <MapPin className="h-3 w-3 mr-1" /> Rayon {radius} km
          </Badge>
          {data && (
            <Badge variant="outline" className="text-[10px]">
              {data.length} espèces patrimoniales
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
};
