import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, X, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  useEventCompanies,
  useUnlinkCompanyEvent,
  RELATION_TYPES,
} from '@/hooks/useCrmCompanyEvents';
import { CompanyLinkPicker } from './CompanyLinkPicker';

interface Props {
  eventId: string | null;
  onClose: () => void;
}

export const MarcheDetailDrawer: React.FC<Props> = ({ eventId, onClose }) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const { data: links = [], isLoading } = useEventCompanies(eventId);
  const unlink = useUnlinkCompanyEvent();

  const { data: event } = useQuery({
    queryKey: ['crm-marche-detail', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('marche_events')
        .select('id, title, description, date_marche, lieu, event_type')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  return (
    <>
      <Sheet open={!!eventId} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl bg-[hsl(var(--crm-surface))] border-l border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))] p-0"
        >
          <div data-crm-shell className="h-full flex flex-col">
            <SheetHeader className="p-6 border-b border-[hsl(var(--crm-border))]">
              <SheetTitle className="text-[hsl(var(--crm-text))] text-xl">
                {event?.title || 'Événement'}
              </SheetTitle>
              {event && (
                <div className="flex flex-wrap items-center gap-3 text-xs crm-muted mt-2">
                  {event.date_marche && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.date_marche), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  )}
                  {event.lieu && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {event.lieu}
                    </span>
                  )}
                  {event.event_type && (
                    <span className="px-2 py-0.5 rounded-full crm-surface-elevated">
                      {event.event_type}
                    </span>
                  )}
                </div>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider crm-muted">
                  Entreprises associées
                </h3>
                <Button
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  className="bg-[hsl(var(--crm-accent))] hover:bg-[hsl(var(--crm-accent))]/90 text-white h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Lier
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin crm-muted" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-12 crm-muted text-sm">
                  Aucune entreprise liée à cet événement.
                </div>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 p-3 rounded-lg crm-surface-elevated"
                    >
                      <div className="h-9 w-9 rounded-md bg-[hsl(var(--crm-accent-soft))] flex items-center justify-center shrink-0 text-xs font-semibold text-[hsl(var(--crm-accent))]">
                        {(link.company?.denomination || link.company?.nom_complet || '?')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[hsl(var(--crm-text))] truncate">
                          {link.company?.nom_complet || '—'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[hsl(var(--crm-surface))] crm-muted">
                            {RELATION_TYPES.find((r) => r.value === link.relation_type)?.label ||
                              link.relation_type}
                          </span>
                          {link.company?.lifecycle_stage && (
                            <span className="text-[10px] uppercase tracking-wider crm-muted">
                              {link.company.lifecycle_stage}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => unlink.mutate(link.id)}
                        className="h-7 w-7 crm-muted hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CompanyLinkPicker
        eventId={eventId}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeCompanyIds={links.map((l) => l.company_id)}
      />
    </>
  );
};
