import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, Plus, Printer, Users } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MarcheEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'nouveau';

  const [form, setForm] = useState({
    title: '', description: '', date_marche: '', lieu: '',
    latitude: '', longitude: '', max_participants: '20', exploration_id: '',
  });

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  // Fetch event data (edit mode)
  const { data: event, isLoading } = useQuery({
    queryKey: ['marche-event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('*, explorations(name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        date_marche: event.date_marche?.slice(0, 16) || '',
        lieu: event.lieu || '',
        latitude: event.latitude?.toString() || '',
        longitude: event.longitude?.toString() || '',
        max_participants: event.max_participants?.toString() || '20',
        exploration_id: event.exploration_id || '',
      });
    }
  }, [event]);

  // Explorations list
  const { data: explorations } = useQuery({
    queryKey: ['explorations-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('explorations').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Participations
  const { data: participations } = useQuery({
    queryKey: ['marche-participations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_participations')
        .select('*, community_profiles:user_id(prenom, nom, role)')
        .eq('marche_event_id', id!);
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  // All profiles for retroactive add
  const { data: allProfiles } = useQuery({
    queryKey: ['community-profiles-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('community_profiles').select('user_id, prenom, nom').order('nom');
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const availableProfiles = useMemo(() => {
    if (!allProfiles) return [];
    const existingUserIds = new Set(participations?.map((p: any) => p.user_id) || []);
    let filtered = allProfiles.filter(p => !existingUserIds.has(p.user_id));
    if (participantSearch.trim()) {
      const term = participantSearch.toLowerCase();
      filtered = filtered.filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(term));
    }
    return filtered;
  }, [allProfiles, participations, participantSearch]);

  // Mutations
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
      toast.success('Événement créé avec succès');
      navigate('/admin/marche-events');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('marche_events').update({
        title: form.title,
        description: form.description || null,
        date_marche: form.date_marche,
        lieu: form.lieu || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        max_participants: parseInt(form.max_participants) || 20,
        exploration_id: form.exploration_id || null,
      }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-events'] });
      queryClient.invalidateQueries({ queryKey: ['marche-event', id] });
      toast.success('Événement mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('marche_events').delete().eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-events'] });
      toast.success('Événement supprimé');
      navigate('/admin/marche-events');
    },
  });

  const addParticipant = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('marche_participations').insert({
        user_id: userId,
        marche_event_id: id!,
        validated_at: new Date().toISOString(),
        validation_method: 'admin_retroactif',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-participations', id] });
      queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
      setShowAddParticipant(false);
      setParticipantSearch('');
      toast.success('Participant ajouté avec succès');
    },
    onError: () => toast.error("Erreur lors de l'ajout du participant"),
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

  if (!isNew && isLoading) {
    return <div className="min-h-screen bg-background p-4"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/marche-events">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? 'Nouvel événement' : event?.title || 'Événement'}
          </h1>
        </div>

        {/* Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Informations</h2>
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
              <Select value={form.exploration_id || 'none'} onValueChange={v => setForm(f => ({ ...f, exploration_id: v === 'none' ? '' : v }))}>
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

          <div className="flex gap-3 mt-6">
            {isNew ? (
              <Button onClick={() => createEvent.mutate()} disabled={!form.title || !form.date_marche || createEvent.isPending}>
                <Plus className="h-4 w-4 mr-2" />Créer l'événement
              </Button>
            ) : (
              <>
                <Button onClick={() => updateEvent.mutate()} disabled={!form.title || !form.date_marche || updateEvent.isPending}>
                  <Save className="h-4 w-4 mr-2" />Enregistrer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => { if (confirm('Supprimer cet événement ?')) deleteEvent.mutate(); }}
                  disabled={deleteEvent.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* QR Code — edit mode only */}
        {!isNew && event && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">QR Code</h2>
            <div className="flex items-center gap-6">
              <QRCodeSVG
                value={`${window.location.origin}/marches-du-vivant/valider-presence/${event.qr_code}`}
                size={120}
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground"
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">URL de validation :</p>
                <code className="text-xs text-muted-foreground break-all block">
                  {window.location.origin}/marches-du-vivant/valider-presence/{event.qr_code}
                </code>
                <Button variant="outline" size="sm" onClick={() => printQR(event.qr_code, event.title)}>
                  <Printer className="h-4 w-4 mr-2" />Imprimer le QR
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Participants — edit mode only */}
        {!isNew && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants ({participations?.length || 0})
              </h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddParticipant(!showAddParticipant)}>
                <Plus className="h-3.5 w-3.5 mr-1" />Ajouter un participant
              </Button>
            </div>

            {/* Add participant panel */}
            {showAddParticipant && (
              <Card className="p-4 mb-4 border-dashed border-primary/30 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-2">
                  Recherchez un profil communautaire pour l'associer rétroactivement à cet événement.
                </p>
                <Input
                  placeholder="Chercher par nom ou prénom..."
                  value={participantSearch}
                  onChange={e => setParticipantSearch(e.target.value)}
                  className="mb-2"
                />
                {availableProfiles.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {availableProfiles.map(profile => (
                      <button
                        key={profile.user_id}
                        onClick={() => addParticipant.mutate(profile.user_id)}
                        disabled={addParticipant.isPending}
                        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                      >
                        <span>{profile.prenom} {profile.nom}</span>
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {participantSearch ? 'Aucun profil trouvé.' : 'Tous les profils sont déjà inscrits.'}
                  </p>
                )}
              </Card>
            )}

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
                      <TableCell>
                        {p.validation_method === 'admin_retroactif' ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
                            rétroactif
                          </span>
                        ) : (
                          p.validation_method || '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun participant validé pour le moment.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarcheEventDetail;
