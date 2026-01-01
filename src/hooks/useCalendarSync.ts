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

interface SyncResult {
  success: boolean;
  events?: CalendarEvent[];
  error?: string;
  syncedAt?: string;
}

export function useCalendarSync() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const syncCalendar = useCallback(async (startDate?: string, endDate?: string) => {
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
          error: error.message || 'Erreur de connexion',
          syncedAt: new Date().toISOString(),
        };
        setLastSync(result);
        return result;
      }

      // Parse events from n8n response
      const events: CalendarEvent[] = Array.isArray(data?.events) 
        ? data.events.map((event: any) => ({
            id: event.id || event.iCalUID || crypto.randomUUID(),
            title: event.summary || event.title || 'Sans titre',
            start: event.start?.dateTime || event.start?.date || event.start || '',
            end: event.end?.dateTime || event.end?.date || event.end || '',
            location: event.location || '',
            description: event.description || '',
          }))
        : [];

      const result: SyncResult = {
        success: true,
        events,
        syncedAt: new Date().toISOString(),
      };
      
      setLastSync(result);
      return result;
    } catch (err) {
      const result: SyncResult = {
        success: false,
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
