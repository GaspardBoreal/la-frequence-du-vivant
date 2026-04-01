import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, CalendarDays, MapPin, Compass, Users, Search, ArrowUpDown } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MARCHE_EVENT_TYPES, getMarcheEventTypeMeta, type MarcheEventType } from '@/lib/marcheEventTypes';

const MarcheEventsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedType, setSelectedType] = useState<'all' | 'none' | MarcheEventType>('all');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const typeCounts = useMemo(() => {
    const counts: Record<'all' | 'none' | MarcheEventType, number> = {
      all: events?.length ?? 0,
      none: 0,
      agroecologique: 0,
      eco_poetique: 0,
      eco_tourisme: 0,
    };

    events?.forEach((event) => {
      if (event.event_type && event.event_type in counts) {
        counts[event.event_type as MarcheEventType] += 1;
      } else {
        counts.none += 1;
      }
    });

    return counts;
  }, [events]);

  const { data: events, isLoading } = useQuery({
    queryKey: ['marche-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('*, explorations(name)')
        .order('date_marche', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: participationCounts } = useQuery({
    queryKey: ['marche-participation-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_participations')
        .select('marche_event_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(p => {
        counts[p.marche_event_id] = (counts[p.marche_event_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(e => {
        const exploName = (e as any).explorations?.name || '';
        const typeMeta = getMarcheEventTypeMeta(e.event_type);
        return (
          e.title?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.lieu?.toLowerCase().includes(term) ||
          e.qr_code?.toLowerCase().includes(term) ||
          exploName.toLowerCase().includes(term) ||
          typeMeta?.label.toLowerCase().includes(term)
        );
      });
    }

    if (selectedType === 'none') {
      filtered = filtered.filter(e => !e.event_type);
    } else if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.event_type === selectedType);
    }

    return [...filtered].sort((a, b) => {
      const da = new Date(a.date_marche).getTime();
      const db = new Date(b.date_marche).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
  }, [events, debouncedSearch, sortOrder, selectedType]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Événements de Marche</h1>
          <Button onClick={() => navigate('/admin/marche-events/nouveau')} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />Nouvel événement
          </Button>
        </div>

        {/* Search & Sort Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, lieu, exploration, description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
              <Select value={selectedType} onValueChange={(v: 'all' | 'none' | MarcheEventType) => setSelectedType(v)}>
                <SelectTrigger className="w-full sm:min-w-[220px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types ({typeCounts.all})</SelectItem>
                  <SelectItem value="none">Aucun ({typeCounts.none})</SelectItem>
                  {MARCHE_EVENT_TYPES.map((type) => {
                    const meta = getMarcheEventTypeMeta(type)!;
                    return <SelectItem key={type} value={type}>{meta.label} ({typeCounts[type]})</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={sortOrder} onValueChange={(v: 'desc' | 'asc') => setSortOrder(v)}>
                  <SelectTrigger className="w-full sm:min-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Date décroissante</SelectItem>
                    <SelectItem value="asc">Date croissante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {events && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredAndSortedEvents.length} événement(s) sur {events.length}
            </p>
          )}
        </Card>

        {/* Events List */}
        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedEvents.map(event => {
              const past = isPast(new Date(event.date_marche));
              const count = participationCounts?.[event.id] || 0;
              const typeMeta = getMarcheEventTypeMeta(event.event_type);

              return (
                <Card
                  key={event.id}
                  className={`p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${past ? 'opacity-75' : ''}`}
                  onClick={() => navigate(`/admin/marche-events/${event.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status + Date */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          past
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {past ? 'Passée' : 'À venir'}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(event.date_marche), 'PPP à HH:mm', { locale: fr })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-foreground mb-1">{event.title}</h3>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {typeMeta && (
                          <Badge variant="outline" className={cn('gap-1 rounded-full px-2 py-0.5 text-xs', typeMeta.badgeClassName)}>
                            <typeMeta.icon className="h-3 w-3" />
                            {typeMeta.shortLabel}
                          </Badge>
                        )}
                        {event.lieu && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            <MapPin className="h-3 w-3" />{event.lieu}
                          </span>
                        )}
                        {(event as any).explorations?.name && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <Compass className="h-3 w-3" />{(event as any).explorations.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                          <Users className="h-3 w-3" />{count}/{event.max_participants || '∞'}
                        </span>
                      </div>

                      {event.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredAndSortedEvents.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {debouncedSearch ? 'Aucun événement ne correspond à votre recherche.' : 'Aucun événement de marche créé.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarcheEventsAdmin;
