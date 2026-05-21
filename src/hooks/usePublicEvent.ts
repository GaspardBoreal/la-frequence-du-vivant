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

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date_marche: string;
  lieu: string | null;
  latitude: number | null;
  longitude: number | null;
  event_type: string;
  cover_image_url: string | null;
  public_slug: string;
  published_at: string;
  exploration_id: string | null;
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
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_event_counters' as any, { _slug: slug });
      if (error) throw error;
      return data as { views_total: number; unique_visitors: number; views_last_7d: number } | null;
    },
    enabled: !!slug,
    refetchInterval: 60_000,
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
      .rpc('log_public_event_view' as any, {
        _slug: slug,
        _session_id: session,
        _referrer: referrer,
        _utm_source: utm.utm_source,
        _utm_medium: utm.utm_medium,
        _utm_campaign: utm.utm_campaign,
        _marcheur_slug: utm.marcheur_slug,
        _user_agent_family: uaFamily(),
      })
      .then(() => {
        /* noop */
      });
  }, [slug]);
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

/** Visibility map for the admin list */
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

/** Admin Rayonnement stats */
export const useEventRayonnement = (eventId: string | undefined) =>
  useQuery({
    queryKey: ['event-rayonnement', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase.rpc('get_event_rayonnement' as any, { _event_id: eventId });
      if (error) throw error;
      return data as any;
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });

export const buildPublicEventUrl = (slug: string, opts?: { utmSource?: string; utmMedium?: string; marcheurSlug?: string }) => {
  const base = `${window.location.origin}/m/${slug}`;
  const params = new URLSearchParams();
  if (opts?.utmSource) params.set('utm_source', opts.utmSource);
  if (opts?.utmMedium) params.set('utm_medium', opts.utmMedium);
  if (opts?.marcheurSlug) params.set('m', opts.marcheurSlug);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};
