import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CarteMdVEvent } from '@/hooks/useCarteMdV';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  events: CarteMdVEvent[];
}

interface Photo {
  id: string;
  url_fichier: string | null;
  external_url: string | null;
  marche_id: string | null;
  marche_event_id: string | null;
  description: string | null;
}

const MurDuVivantView: React.FC<Props> = ({ events }) => {
  const explorationIds = useMemo(
    () => [...new Set(events.map((e) => e.exploration_id).filter(Boolean))] as string[],
    [events]
  );

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['carte-mdv-wall', explorationIds.sort().join(',')],
    enabled: explorationIds.length > 0,
    queryFn: async (): Promise<Photo[]> => {
      const { data: emRows } = await supabase
        .from('exploration_marches')
        .select('marche_id, exploration_id')
        .in('exploration_id', explorationIds);
      const marcheIds = (emRows ?? []).map((r: any) => r.marche_id).filter(Boolean);
      if (marcheIds.length === 0) return [];

      const { data, error } = await supabase
        .from('marcheur_medias')
        .select('id, url_fichier, external_url, marche_id, marche_event_id, description, type_media, is_public')
        .in('marche_id', marcheIds)
        .eq('type_media', 'photo')
        .eq('is_public', true)
        .limit(60)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).filter((p) => p.url_fichier || p.external_url) as Photo[];
    },
    staleTime: 5 * 60_000,
  });

  const marcheToEvent = useMemo(() => {
    const map = new Map<string, CarteMdVEvent>();
    // Not directly available: we'll link back by exploration_id via events
    return map;
  }, [events]);

  const findEventForPhoto = (p: Photo): CarteMdVEvent | undefined => {
    if (p.marche_event_id) return events.find((e) => e.id === p.marche_event_id);
    return events[0];
  };

  if (isLoading) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-muted animate-pulse break-inside-avoid" style={{ height: 100 + (i % 4) * 40 }} />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="mt-3 text-muted-foreground">Aucune photo marcheur disponible pour ces filtres.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {photos.length} instants du vivant capturés par les marcheurs.
      </p>
      <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
        {photos.map((p) => {
          const ev = findEventForPhoto(p);
          const to = ev
            ? (ev.category === 'jardin' && ev.is_public && ev.public_slug
                ? `/jardin/${ev.public_slug}`
                : ev.is_public && ev.public_slug ? `/m/${ev.public_slug}` : `/admin/marche-events/${ev.id}`)
            : '#';
          const src = p.url_fichier || p.external_url || '';
          return (
            <Link key={p.id} to={to}
              className="group relative block break-inside-avoid overflow-hidden rounded-lg border border-border">
              <img src={src} alt={p.description ?? ''} loading="lazy"
                className="w-full object-cover transition-transform group-hover:scale-105" />
              {ev && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white line-clamp-1">{ev.title}</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MurDuVivantView;
