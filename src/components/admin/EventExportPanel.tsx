import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Download, Calendar, MapPin, Users, Sprout, BookOpenText, Trees, Leaf, Bug, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMarcheEventTypeMeta, MARCHE_EVENT_TYPES } from '@/lib/marcheEventTypes';
import { exportEventsToWord, exportEventsToCSV, type EventExportData, type EventExportOptions } from '@/utils/eventExportUtils';

interface MarcheEvent {
  id: string;
  title: string;
  date_marche: string;
  lieu: string | null;
  event_type: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  exploration_id: string | null;
}

const EventExportPanel: React.FC = () => {
  const [events, setEvents] = useState<MarcheEvent[]>([]);
  const [participationCounts, setParticipationCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Selection state
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Content options
  const [includeEventInfo, setIncludeEventInfo] = useState(true);
  const [includeParticipants, setIncludeParticipants] = useState(true);
  const [includeMarches, setIncludeMarches] = useState(true);
  const [includeBiodiversity, setIncludeBiodiversity] = useState(true);
  const [includeRawBiodiversity, setIncludeRawBiodiversity] = useState(false);

  // Export format
  const [exportFormat, setExportFormat] = useState<'word' | 'csv'>('word');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data: eventsData, error } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, lieu, event_type, latitude, longitude, description, exploration_id')
        .order('date_marche', { ascending: false });

      if (error) throw error;

      setEvents(eventsData || []);
      setSelectedEvents(new Set((eventsData || []).map(e => e.id)));

      // Load participation counts
      const { data: partData } = await supabase
        .from('marche_participations')
        .select('marche_event_id');

      const counts = new Map<string, number>();
      (partData || []).forEach(p => {
        counts.set(p.marche_event_id, (counts.get(p.marche_event_id) || 0) + 1);
      });
      setParticipationCounts(counts);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events;
    return events.filter(e => e.event_type === typeFilter);
  }, [events, typeFilter]);

  const selectedCount = useMemo(() => {
    return filteredEvents.filter(e => selectedEvents.has(e.id)).length;
  }, [filteredEvents, selectedEvents]);

  const toggleEvent = (id: string) => {
    const newSet = new Set(selectedEvents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEvents(newSet);
  };

  const selectAll = () => setSelectedEvents(new Set(filteredEvents.map(e => e.id)));
  const clearAll = () => setSelectedEvents(new Set());

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), 'dd MMM yyyy', { locale: fr });
    } catch {
      return d;
    }
  };

  const handleExport = async () => {
    const selected = events.filter(e => selectedEvents.has(e.id));
    if (selected.length === 0) {
      toast.error('Sélectionnez au moins un événement');
      return;
    }

    setExporting(true);
    try {
      // Build full export data for each event
      const exportData: EventExportData[] = await Promise.all(
        selected.map(async (event) => {
          // Participants
          let participants: EventExportData['participants'] = [];
          if (includeParticipants) {
            const { data: partData } = await supabase
              .from('marche_participations')
              .select('user_id, validated_at, created_at')
              .eq('marche_event_id', event.id);

            if (partData && partData.length > 0) {
              const userIds = partData.map(p => p.user_id);
              const { data: profiles } = await supabase
                .from('community_profiles')
                .select('user_id, prenom, nom')
                .in('user_id', userIds);

              const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
              participants = partData.map(p => {
                const profile = profileMap.get(p.user_id);
                return {
                  prenom: profile?.prenom || '—',
                  nom: profile?.nom || '—',
                  validated_at: p.validated_at,
                  created_at: p.created_at,
                };
              });
            }
          }

          // Marches associées via exploration
          let marches: EventExportData['marches'] = [];
          if (includeMarches && event.exploration_id) {
            const { data: exploMarches } = await supabase
              .from('exploration_marches')
              .select('marche_id, marche:marches(id, nom_marche, ville, latitude, longitude)')
              .eq('exploration_id', event.exploration_id)
              .order('ordre', { ascending: true });

            marches = (exploMarches || []).map((em: any) => ({
              id: em.marche?.id || em.marche_id,
              nom_marche: em.marche?.nom_marche || null,
              ville: em.marche?.ville || '',
              latitude: em.marche?.latitude || null,
              longitude: em.marche?.longitude || null,
            }));
          }

          // Biodiversity via exploration → marches → snapshots
          let biodiversity: EventExportData['biodiversity'] = null;
          if ((includeBiodiversity || includeRawBiodiversity) && event.exploration_id) {
            const { data: exploMarches } = await supabase
              .from('exploration_marches')
              .select('marche_id')
              .eq('exploration_id', event.exploration_id);

            const marcheIds = (exploMarches || []).map(em => em.marche_id);
            if (marcheIds.length > 0) {
              const { data: snapshots } = await supabase
                .from('biodiversity_snapshots')
                .select('marche_id, species_data')
                .in('marche_id', marcheIds)
                .order('created_at', { ascending: false });

              // Deduplicate: latest snapshot per marche
              const latestByMarche = new Map<string, any>();
              (snapshots || []).forEach(s => {
                if (!latestByMarche.has(s.marche_id)) latestByMarche.set(s.marche_id, s);
              });

              // Build unique species map (same logic as useExplorationBiodiversitySummary)
              const uniqueSpecies = new Map<string, { name: string; scientificName: string; count: number; kingdom: string }>();
              for (const snapshot of latestByMarche.values()) {
                const speciesData = snapshot.species_data as any[];
                if (!Array.isArray(speciesData)) continue;

                const localCounts = new Map<string, { count: number; species: any }>();
                speciesData.forEach((sp: any) => {
                  const sciName = sp.scientificName?.toLowerCase();
                  if (!sciName) return;
                  const existing = localCounts.get(sciName);
                  if (existing) existing.count++;
                  else localCounts.set(sciName, { count: 1, species: sp });
                });

                localCounts.forEach(({ count, species }) => {
                  const name = species.commonName || species.scientificName;
                  if (!name) return;
                  const existing = uniqueSpecies.get(name);
                  if (existing) existing.count += count;
                  else uniqueSpecies.set(name, {
                    name,
                    scientificName: species.scientificName || name,
                    count,
                    kingdom: species.kingdom || 'Unknown',
                  });
                });
              }

              // Kingdom counts
              let birds = 0, plants = 0, fungi = 0, others = 0;
              for (const sp of uniqueSpecies.values()) {
                if (sp.kingdom === 'Animalia') birds++;
                else if (sp.kingdom === 'Plantae') plants++;
                else if (sp.kingdom === 'Fungi') fungi++;
                else others++;
              }

              const allSpeciesSorted = Array.from(uniqueSpecies.values())
                .sort((a, b) => b.count - a.count);

              const topSpecies = allSpeciesSorted.slice(0, 15);

              biodiversity = {
                totalSpecies: uniqueSpecies.size,
                speciesByKingdom: { birds, plants, fungi, others },
                topSpecies,
                allSpecies: allSpeciesSorted,
              };
            }
          }

          return {
            id: event.id,
            title: event.title,
            date_marche: event.date_marche,
            lieu: event.lieu,
            event_type: event.event_type,
            latitude: event.latitude,
            longitude: event.longitude,
            description: event.description,
            participants,
            marches,
            biodiversity,
          };
        }),
      );

      const exportOptions: EventExportOptions = {
        includeEventInfo,
        includeParticipants,
        includeMarches,
        includeBiodiversity,
        includeRawBiodiversity,
      };

      if (exportFormat === 'word') {
        await exportEventsToWord(exportData, exportOptions);
      } else {
        exportEventsToCSV(exportData, exportOptions);
      }

      toast.success(`${exportData.length} événement${exportData.length > 1 ? 's' : ''} exporté${exportData.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left: Event selection */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Sélection des événements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type filter */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setTypeFilter('all')}
              >
                Tous ({events.length})
              </Badge>
              {MARCHE_EVENT_TYPES.map(type => {
                const meta = getMarcheEventTypeMeta(type);
                if (!meta) return null;
                const count = events.filter(e => e.event_type === type).length;
                const Icon = meta.icon;
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`cursor-pointer text-xs ${typeFilter === type ? meta.badgeClassName : ''}`}
                    onClick={() => setTypeFilter(type === typeFilter ? 'all' : type)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {meta.shortLabel} ({count})
                  </Badge>
                );
              })}
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{selectedCount}/{filteredEvents.length} sélectionnés</span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-primary hover:underline">Tous</button>
                <button onClick={clearAll} className="text-muted-foreground hover:underline">Aucun</button>
              </div>
            </div>

            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-2">
                {filteredEvents.map(event => {
                  const meta = getMarcheEventTypeMeta(event.event_type);
                  const Icon = meta?.icon || Sprout;
                  const partCount = participationCounts.get(event.id) || 0;
                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
                        selectedEvents.has(event.id)
                          ? meta?.cardClassName || 'border-primary/30 bg-primary/5'
                          : 'border-transparent hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={`evt-${event.id}`}
                        checked={selectedEvents.has(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`evt-${event.id}`} className="flex-1 cursor-pointer space-y-0.5">
                        <div className="text-sm font-medium leading-tight">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon className="h-3 w-3 shrink-0" />
                          <span>{formatDate(event.date_marche)}</span>
                          {partCount > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {partCount}
                            </span>
                          )}
                        </div>
                        {event.lieu && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{event.lieu}</span>
                          </div>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right: Options + Export */}
      <div className="md:col-span-2 space-y-4">
        {/* Content options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contenu du rapport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { checked: includeEventInfo, setter: setIncludeEventInfo, label: 'Fiche événement', desc: 'Titre, date, lieu, type, coordonnées' },
              { checked: includeParticipants, setter: setIncludeParticipants, label: 'Liste des participants', desc: 'Nom, statut, date d\'inscription' },
              { checked: includeMarches, setter: setIncludeMarches, label: 'Marches associées', desc: 'Étapes, coordonnées, parcours' },
              { checked: includeBiodiversity, setter: setIncludeBiodiversity, label: 'Synthèse biodiversité', desc: 'Espèces par royaume, top espèces' },
              { checked: includeRawBiodiversity, setter: setIncludeRawBiodiversity, label: 'Données brutes biodiversité', desc: 'species_data JSON complet (CSV uniquement)' },
            ].map(opt => (
              <div key={opt.label} className="flex items-start gap-3">
                <Checkbox
                  checked={opt.checked}
                  onCheckedChange={(v) => opt.setter(!!v)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Export format */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Format d'export</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'word' | 'csv')}>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="word" id="fmt-word" />
                <Label htmlFor="fmt-word" className="cursor-pointer">
                  <span className="font-medium">Word (.docx)</span>
                  <span className="text-xs text-muted-foreground ml-2">Rapport structuré et mis en page</span>
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="csv" id="fmt-csv" />
                <Label htmlFor="fmt-csv" className="cursor-pointer">
                  <span className="font-medium">CSV</span>
                  <span className="text-xs text-muted-foreground ml-2">Données tabulaires (événements + participants + biodiversité)</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Summary + Export button */}
        <Card className={selectedCount > 0 ? 'border-accent/30 bg-accent/5' : 'border-amber-500/30 bg-amber-500/5'}>
          <CardContent className="pt-6">
            {selectedCount > 0 ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Prêt à exporter</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCount} événement{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
                  </div>
                </div>
                <Button onClick={handleExport} disabled={exporting} className="gap-2">
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Exporter en {exportFormat === 'word' ? '.docx' : '.csv'}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-amber-600 dark:text-amber-400 text-center">
                Sélectionnez au moins un événement pour exporter
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventExportPanel;
