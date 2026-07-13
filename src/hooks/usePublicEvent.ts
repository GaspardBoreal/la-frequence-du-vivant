import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'mdv_public_session';

const getOrCreateSession = (): string => {
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return 'anonymous';
  }
};

const parseUtm = (search: string) => {
  const p = new URLSearchParams(search);
  return {
    utm_source: p.get('utm_source'),
    utm_medium: p.get('utm_medium'),
    utm_campaign: p.get('utm_campaign'),
    marcheur_slug: p.get('m'),
  };
};

const uaFamily = () => {
  const ua = navigator.userAgent;
  if (/WhatsApp/i.test(ua)) return 'whatsapp';
  if (/FBAN|FBAV/i.test(ua)) return 'facebook';
  if (/Twitter/i.test(ua)) return 'twitter';
  if (/LinkedIn/i.test(ua)) return 'linkedin';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/Mobile/i.test(ua)) return 'mobile-browser';
  return 'desktop-browser';
};

export interface PublicEventOrganisateur {
  id: string;
  nom: string;
  ville: string | null;
  pays: string | null;
  type_structure: string | null;
  description: string | null;
  logo_url: string | null;
  site_web: string | null;
}

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  lieu: string | null;
  latitude: number | null;
  longitude: number | null;
  event_type: string;
  category: string | null;
  cover_image_url: string | null;
  public_slug: string;
  published_at: string;
  exploration_id: string | null;
  organisateur: PublicEventOrganisateur | null;
}

export interface PublicEventCounters {
  views_total: number;
  unique_visitors: number;
  views_last_7d: number;
  marcheurs_count: number;
  species_count: number;
  observations_count: number;
}

export interface PublicSpecies {
  scientific_name: string;
  common_name: string | null;
  iconic_taxon: string | null;
  photo_url: string | null;
  observations_count: number;
  has_walker_observation: boolean;
  marche_ordre?: number | null;
}

export interface PublicObservationGeo {
  scientific_name: string;
  latitude: number;
  longitude: number;
  observation_date: string | null;
  marche_ordre?: number | null;
}

export interface PublicTrophicSummary {
  producteurs: number;
  consommateurs: number;
  decomposeurs: number;
  autres: number;
}

export interface PublicBiodiversity {
  species: PublicSpecies[];
  species_count: number;
  observations_geo: PublicObservationGeo[];
  trophic_summary: PublicTrophicSummary;
  biodiversity_index: number | null;
  snapshot_date: string | null;
}

export interface PublicPratiqueSample {
  id: string;
  titre: string | null;
  category: string | null;
  description: string | null;
  prenom: string | null;
  nom: string | null;
  avatar_url: string | null;
  photo_url: string | null;
}

export interface PublicPaysageSample {
  id: string;
  titre: string;
  description: string | null;
  url: string | null;
  duree_secondes: number | null;
  prenom: string | null;
  nom: string | null;
  avatar_url: string | null;
}

export interface PublicEventStats {
  marcheurs_count: number;
  species_count: number;
  observations_count: number;
  views_total: number;
  unique_visitors: number;
  pratiques_count: number;
  paysages_sonores_count: number;
  pratiques_sample: PublicPratiqueSample[];
  paysages_sample: PublicPaysageSample[];
  methodology: Record<string, string>;
}

export interface PublicMarcheur {
  slug: string | null;
  display_name: string;
  avatar_url: string | null;
  role: string | null;
  ville: string | null;
}

export interface PublicMarcheurs {
  total_count: number;
  public_count: number;
  public_marcheurs: PublicMarcheur[];
}

export interface PublicTestimony {
  id: string;
  quote: string;
  author_name: string;
  avatar_url: string | null;
  display_order: number;
}

export interface PublicMedia {
  id: string;
  type_media: string;
  url_fichier: string | null;
  external_url: string | null;
  titre: string | null;
  description: string | null;
  ordre: number | null;
  duree_secondes: number | null;
  author_name: string | null;
}

export const usePublicEvent = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event', slug],
    queryFn: async (): Promise<PublicEvent | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_event' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicEvent) ?? null;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

export const usePublicEventCounters = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event-counters', slug],
    queryFn: async (): Promise<PublicEventCounters | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_event_counters' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicEventCounters) ?? null;
    },
    enabled: !!slug,
    refetchInterval: 60_000,
  });

export const usePublicEventBiodiversity = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event-biodiversity', slug],
    queryFn: async (): Promise<PublicBiodiversity | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_event_biodiversity' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicBiodiversity) ?? null;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

export const usePublicEventStats = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event-stats', slug],
    queryFn: async (): Promise<PublicEventStats | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_event_stats' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicEventStats) ?? null;
    },
    enabled: !!slug,
    refetchInterval: 60_000,
  });

export const usePublicEventMarcheurs = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event-marcheurs', slug],
    queryFn: async (): Promise<PublicMarcheurs | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_event_marcheurs' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicMarcheurs) ?? null;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

export const usePublicEventTestimonies = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event-testimonies', slug],
    queryFn: async (): Promise<PublicTestimony[]> => {
      if (!slug) return [];
      const { data, error } = await supabase.rpc('get_public_event_testimonies' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicTestimony[]) ?? [];
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

export const usePublicEventMedias = (slug: string | undefined) =>
  useQuery({
    queryKey: ['public-event-medias', slug],
    queryFn: async (): Promise<PublicMedia[]> => {
      if (!slug) return [];
      const { data, error } = await supabase.rpc('get_public_event_medias' as any, { _slug: slug });
      if (error) throw error;
      return (data as PublicMedia[]) ?? [];
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

/** Logs a single view per session/page mount. */
export const useLogPublicEventView = (slug: string | undefined) => {
  const sent = useRef(false);
  useEffect(() => {
    if (!slug || sent.current) return;
    sent.current = true;
    const utm = parseUtm(window.location.search);
    const session = getOrCreateSession();
    const referrer = document.referrer || null;
    supabase
      .rpc('log_public_event_event' as any, {
        _slug: slug,
        _event_type: 'view',
        _session_id: session,
        _referrer: referrer,
        _utm_source: utm.utm_source,
        _utm_medium: utm.utm_medium,
        _utm_campaign: utm.utm_campaign,
        _marcheur_slug: utm.marcheur_slug,
        _user_agent_family: uaFamily(),
        _meta: null,
      })
      .then(() => {});
  }, [slug]);
};

export const logPublicEventShare = (slug: string, channel: string) => {
  const utm = parseUtm(window.location.search);
  supabase
    .rpc('log_public_event_event' as any, {
      _slug: slug,
      _event_type: 'share',
      _session_id: getOrCreateSession(),
      _referrer: document.referrer || null,
      _utm_source: utm.utm_source,
      _utm_medium: utm.utm_medium,
      _utm_campaign: utm.utm_campaign,
      _marcheur_slug: utm.marcheur_slug,
      _user_agent_family: uaFamily(),
      _meta: { channel },
    })
    .then(() => {});
};

export const logPublicEventCtaClick = (slug: string, cta: string) => {
  const utm = parseUtm(window.location.search);
  supabase
    .rpc('log_public_event_event' as any, {
      _slug: slug,
      _event_type: 'cta_click',
      _session_id: getOrCreateSession(),
      _referrer: document.referrer || null,
      _utm_source: utm.utm_source,
      _utm_medium: utm.utm_medium,
      _utm_campaign: utm.utm_campaign,
      _marcheur_slug: utm.marcheur_slug,
      _user_agent_family: uaFamily(),
      _meta: { cta },
    })
    .then(() => {});
};

/** Admin toggle */
export const useToggleEventPublic = (eventId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isPublic: boolean) => {
      if (!eventId) throw new Error('no event');
      const { data, error } = await supabase.rpc('toggle_event_public' as any, {
        _event_id: eventId,
        _is_public: isPublic,
      });
      if (error) throw error;
      return data as { is_public: boolean; public_slug: string | null };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marche-event', eventId] });
      qc.invalidateQueries({ queryKey: ['marche-events-paginated'] });
      qc.invalidateQueries({ queryKey: ['marche-events-public-visibility'] });
    },
  });
};

export const useEventsPublicVisibility = (eventIds: string[]) =>
  useQuery({
    queryKey: ['marche-events-public-visibility', [...eventIds].sort().join(',')],
    queryFn: async () => {
      if (eventIds.length === 0) return {} as Record<string, { is_public: boolean; public_slug: string | null }>;
      const { data, error } = await supabase
        .from('marche_events')
        .select('id,is_public,public_slug')
        .in('id', eventIds);
      if (error) throw error;
      const out: Record<string, { is_public: boolean; public_slug: string | null }> = {};
      (data ?? []).forEach((r: any) => {
        out[r.id] = { is_public: !!r.is_public, public_slug: r.public_slug };
      });
      return out;
    },
    enabled: eventIds.length > 0,
    staleTime: 30_000,
  });

export const useEventRayonnement = (eventId: string | undefined) =>
  useQuery({
    queryKey: ['event-rayonnement', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase.rpc('get_event_rayonnement' as any, { _event_id: eventId });
      if (error) throw error;
      return data as {
        views_total: number;
        unique_visitors: number;
        views_last_30d: number;
        shares_total: number;
        cta_clicks_total: number;
        shares_by_channel: { channel: string; count: number }[];
        top_referrers: { referrer: string; count: number }[];
        channels: { source: string; medium: string; count: number }[];
        daily_30d: { day: string; count: number }[];
      };
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });

export const buildPublicEventUrl = (slug: string, opts?: { utmSource?: string; utmMedium?: string; marcheurSlug?: string; utmCampaign?: string }) => {
  const base = `${window.location.origin}/m/${slug}`;
  const params = new URLSearchParams();
  if (opts?.utmSource) params.set('utm_source', opts.utmSource);
  if (opts?.utmMedium) params.set('utm_medium', opts.utmMedium);
  if (opts?.utmCampaign) params.set('utm_campaign', opts.utmCampaign);
  if (opts?.marcheurSlug) params.set('m', opts.marcheurSlug);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};
