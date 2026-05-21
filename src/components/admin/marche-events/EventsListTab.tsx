import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarDays, MapPin, Compass, Users, MoreVertical, Eye, Pencil, Copy, Globe2, ExternalLink } from 'lucide-react';
import DuplicateEventDialog from './DuplicateEventDialog';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import PaginationControls from './PaginationControls';
import {
  useMarcheEventsPaginated,
  useParticipationCountsForEvents,
  type EventsFilters,
} from '@/hooks/useMarcheEventsQuery';
import { useEventsPublicVisibility, buildPublicEventUrl } from '@/hooks/usePublicEvent';

type PublicFilter = 'all' | 'public' | 'private';

interface Props {
  filters: EventsFilters;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

const EventsListTab: React.FC<Props> = ({ filters, page, pageSize, onPageChange, onPageSizeChange }) => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useMarcheEventsPaginated({ ...filters, page, pageSize });
  const allRows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const { data: counts } = useParticipationCountsForEvents(allRows.map((r) => r.id));
  const { data: visibility } = useEventsPublicVisibility(allRows.map((r) => r.id));
  const [publicFilter, setPublicFilter] = useState<PublicFilter>('all');
  const rows = useMemo(() => {
    if (publicFilter === 'all') return allRows;
    return allRows.filter((r) => {
      const isPub = !!visibility?.[r.id]?.is_public;
      return publicFilter === 'public' ? isPub : !isPub;
    });
  }, [allRows, publicFilter, visibility]);
  const [duplicateSource, setDuplicateSource] = useState<
    { id: string; title: string; date_marche: string } | null
  >(null);


  return (
    <div>
      {/* Filtre visibilité publique */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Globe2 className="h-3.5 w-3.5" /> Visibilité publique :
        </span>
        {(['all', 'public', 'private'] as PublicFilter[]).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={publicFilter === v ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs rounded-full"
            onClick={() => setPublicFilter(v)}
          >
            {v === 'all' ? 'Tous' : v === 'public' ? 'Publics' : 'Privés'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-3 transition-opacity', isFetching && 'opacity-60')}>
          {rows.map((event) => {
            const past = isPast(new Date(event.date_marche));
            const count = counts?.[event.id] || 0;
            const typeMeta = getMarcheEventTypeMeta(event.event_type);
            return (
              <Card
                key={event.id}
                className={cn(
                  'p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all',
                  past && 'opacity-75'
                )}
                onClick={() => navigate(`/admin/marche-events/${event.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                        past ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/15 text-emerald-400'
                      )}
                    >
                      {past ? 'Passée' : 'À venir'}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(event.date_marche), 'PPP à HH:mm', { locale: fr })}
                    </span>
                    {visibility?.[event.id]?.is_public && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        <Globe2 className="h-3 w-3" /> Public
                      </span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 -mt-1 -mr-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/admin/marche-events/${event.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/marche-events/${event.id}`)}>
                        <Pencil className="h-4 w-4 mr-2" />Éditer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setDuplicateSource({
                            id: event.id,
                            title: event.title,
                            date_marche: event.date_marche,
                          })
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />Dupliquer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">{event.title}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {typeMeta && (
                    <Badge variant="outline" className={cn('gap-1 rounded-full px-2 py-0.5', typeMeta.badgeClassName)}>
                      <typeMeta.icon className="h-3 w-3" />
                      {typeMeta.shortLabel}
                    </Badge>
                  )}
                  {event.lieu && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      <MapPin className="h-3 w-3" />{event.lieu}
                    </span>
                  )}
                  {event.exploration_name && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Compass className="h-3 w-3" />{event.exploration_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    <Users className="h-3 w-3" />{count}/{event.max_participants || '∞'}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                )}
              </Card>
            );
          })}
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Aucun événement ne correspond à ces filtres.</p>
          )}
        </div>
      )}

      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <DuplicateEventDialog
        open={!!duplicateSource}
        onOpenChange={(o) => !o && setDuplicateSource(null)}
        source={duplicateSource}
      />
    </div>
  );
};

export default EventsListTab;
