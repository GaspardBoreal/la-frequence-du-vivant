import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Users, Printer, CalendarDays, MapPin, Compass, Search, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { format, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';

const MarcheEventsAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [form, setForm] = useState({
    title: '', description: '', date_marche: '', lieu: '',
    latitude: '', longitude: '', max_participants: '20', exploration_id: '',
  });

  const { data: explorations } = useQuery({
    queryKey: ['explorations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explorations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

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

  const { data: participations } = useQuery({
    queryKey: ['marche-participations', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from('marche_participations')
        .select('*, community_profiles:user_id(prenom, nom, role)')
        .eq('marche_event_id', selectedEventId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId,
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['community-profiles-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom')
        .order('nom');
      if (error) throw error;
      return data;
    },
  });

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  const availableProfiles = useMemo(() => {
    if (!allProfiles) return [];
    const existingUserIds = new Set(participations?.map((p: any) => p.user_id) || []);
    let filtered = allProfiles.filter(p => !existingUserIds.has(p.user_id));
    if (participantSearch.trim()) {
      const term = participantSearch.toLowerCase();
      filtered = filtered.filter(p =>
        `${p.prenom} ${p.nom}`.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [allProfiles, participations, participantSearch]);

  const addParticipant = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('marche_participations').insert({
        user_id: userId,
        marche_event_id: selectedEventId!,
        validated_at: new Date().toISOString(),
        validation_method: 'admin_retroactif',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-participations', selectedEventId] });
      queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
      setShowAddParticipant(false);
      setParticipantSearch('');
      toast.success('Participant ajouté avec succès');
    },
    onError: () => toast.error("Erreur lors de l'ajout du participant"),
  });

  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];
    let filtered = events;

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(e => {
        const exploName = (e as any).explorations?.name || '';
        return (
          e.title?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.lieu?.toLowerCase().includes(term) ||
          e.qr_code?.toLowerCase().includes(term) ||
          exploName.toLowerCase().includes(term)
        );
      });
    }

    return [...filtered].sort((a, b) => {
      const da = new Date(a.date_marche).getTime();
      const db = new Date(b.date_marche).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
  }, [events, debouncedSearch, sortOrder]);

  const createEvent = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('marche_events').insert({
        title: form.title,
        description: form.description || null,
        date_marche: form.date_marche,
        lieu: form.lieu || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        max_participants: parseInt(form.max_participants) || 20,
        created_by: user?.id || null,
        exploration_id: form.exploration_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-events'] });
      queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
      setShowForm(false);
      setForm({ title: '', description: '', date_marche: '', lieu: '', latitude: '', longitude: '', max_participants: '20', exploration_id: '' });
      toast.success('Événement créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marche_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-events'] });
      queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
      toast.success('Événement supprimé');
    },
  });

  const printQR = (qrCode: string, title: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const baseUrl = window.location.origin;
    win.document.write(`
      <html><head><title>QR - ${title}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}</style>
      </head><body>
      <h2>${title}</h2>
      <div id="qr"></div>
      <p style="margin-top:16px;font-size:12px;color:#666;">${baseUrl}/marches-du-vivant/valider-presence/${qrCode}</p>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${baseUrl}/marches-du-vivant/valider-presence/${qrCode}', {width:300}, function(err,canvas){
          document.getElementById('qr').appendChild(canvas);
          setTimeout(function(){window.print();},500);
        });
      <\/script>
      </body></html>
    `);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Événements de Marche</h1>
          <Button onClick={() => setShowForm(!showForm)} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />{showForm ? 'Annuler' : 'Nouvel événement'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6 mb-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Date *</Label><Input type="datetime-local" value={form.date_marche} onChange={e => setForm(f => ({ ...f, date_marche: e.target.value }))} /></div>
              <div><Label>Lieu</Label><Input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} /></div>
              <div><Label>Max participants</Label><Input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))} /></div>
              <div><Label>Latitude</Label><Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></div>
              <div><Label>Longitude</Label><Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div>
                <Label>Exploration associée</Label>
                <Select value={form.exploration_id} onValueChange={v => setForm(f => ({ ...f, exploration_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Aucune exploration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {explorations?.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => createEvent.mutate()} disabled={!form.title || !form.date_marche} className="mt-4">
              Créer l'événement
            </Button>
          </Card>
        )}

        {/* Search & Sort Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, lieu, exploration, description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={sortOrder} onValueChange={(v: 'desc' | 'asc') => setSortOrder(v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Date décroissante</SelectItem>
                  <SelectItem value="asc">Date croissante</SelectItem>
                </SelectContent>
              </Select>
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

              return (
                <Card key={event.id} className={`p-4 ${past ? 'opacity-75' : ''}`}>
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                          {event.qr_code?.slice(0, 8)}…
                        </span>
                      </div>

                      {event.description && <p className="text-sm text-muted-foreground mt-2">{event.description}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}>
                        <Users className="h-4 w-4 mr-1" />Détails
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => printQR(event.qr_code, event.title)}>
                        <Printer className="h-4 w-4 mr-1" />QR
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteEvent.mutate(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* QR Preview */}
                  <div className="mt-3 flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <QRCodeSVG
                      value={`${window.location.origin}/marches-du-vivant/valider-presence/${event.qr_code}`}
                      size={80}
                      bgColor="transparent"
                      fgColor="currentColor"
                      className="text-foreground"
                    />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">URL de validation :</p>
                      <code className="text-[10px]">{window.location.origin}/marches-du-vivant/valider-presence/{event.qr_code}</code>
                    </div>
                  </div>

                  {/* Participants */}
                  {selectedEventId === event.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      <h4 className="text-sm font-medium mb-2">Participants validés</h4>
                      {participations && participations.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nom</TableHead>
                              <TableHead>Rôle</TableHead>
                              <TableHead>Validé le</TableHead>
                              <TableHead>Méthode</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {participations.map((p: any) => (
                              <TableRow key={p.id}>
                                <TableCell>{p.community_profiles?.prenom} {p.community_profiles?.nom}</TableCell>
                                <TableCell className="capitalize">{p.community_profiles?.role?.replace(/_/g, ' ')}</TableCell>
                                <TableCell>{p.validated_at ? format(new Date(p.validated_at), 'Pp', { locale: fr }) : '—'}</TableCell>
                                <TableCell>{p.validation_method || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucun participant validé pour le moment.</p>
                      )}
                    </div>
                  )}
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
