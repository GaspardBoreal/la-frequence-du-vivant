import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

export interface SyncResult {
  success: boolean;
  events: CalendarEvent[];
  error?: string;
  warning?: string;
  syncedAt: string;
  meta?: {
    upstreamStatus?: number;
    upstreamContentType?: string;
  };
}

export function useCalendarSync() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const syncCalendar = useCallback(async (startDate?: string, endDate?: string): Promise<SyncResult> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('gaspard-calendar-sync', {
        body: {
          start_date: startDate || new Date().toISOString(),
          end_date: endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      if (error) {
        const result: SyncResult = {
          success: false,
          events: [],
          error: error.message || 'Erreur de connexion',
          syncedAt: new Date().toISOString(),
        };
        setLastSync(result);
        return result;
      }

      // Handle error returned in response body
      if (data?.error) {
        const result: SyncResult = {
          success: false,
          events: [],
          error: data.error,
          warning: data.rawSnippet ? `Extrait: ${data.rawSnippet.slice(0, 200)}...` : undefined,
          syncedAt: new Date().toISOString(),
          meta: data.meta,
        };
        setLastSync(result);
        return result;
      }

      // Parse events with robust fallbacks
      const rawEvents = data?.events || [];
      const events: CalendarEvent[] = rawEvents.map((event: Record<string, unknown>, index: number) => ({
        id: String(event.id || event.eventId || `event-${index}`),
        title: String(event.summary || event.title || event.subject || 'Sans titre'),
        start: String((event.start as Record<string, unknown>)?.dateTime || (event.start as Record<string, unknown>)?.date || event.startTime || event.start || ''),
        end: String((event.end as Record<string, unknown>)?.dateTime || (event.end as Record<string, unknown>)?.date || event.endTime || event.end || ''),
        location: event.location ? String(event.location) : undefined,
        description: event.description ? String(event.description) : undefined,
      }));

      const result: SyncResult = {
        success: true,
        events,
        warning: data?.warning,
        syncedAt: new Date().toISOString(),
        meta: data?.meta,
      };
      
      setLastSync(result);
      return result;
    } catch (err) {
      const result: SyncResult = {
        success: false,
        events: [],
        error: err instanceof Error ? err.message : 'Erreur inconnue',
        syncedAt: new Date().toISOString(),
      };
      setLastSync(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    syncCalendar,
    loading,
    lastSync,
  };
}
