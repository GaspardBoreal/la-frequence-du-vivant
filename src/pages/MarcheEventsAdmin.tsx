import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Users, QrCode, Printer, CalendarDays, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MarcheEventsAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', date_marche: '', lieu: '',
    latitude: '', longitude: '', max_participants: '20',
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['marche-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_events')
        .select('*')
        .order('date_marche', { ascending: false });
      if (error) throw error;
      return data;
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marche-events'] });
      setShowForm(false);
      setForm({ title: '', description: '', date_marche: '', lieu: '', latitude: '', longitude: '', max_participants: '20' });
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
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Événements de Marche</h1>
          <Button onClick={() => setShowForm(!showForm)} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />{showForm ? 'Annuler' : 'Nouvel événement'}
          </Button>
        </div>

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
            </div>
            <Button onClick={() => createEvent.mutate()} disabled={!form.title || !form.date_marche} className="mt-4">
              Créer l'événement
            </Button>
          </Card>
        )}

        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          <div className="grid gap-4">
            {events?.map(event => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                        {event.qr_code?.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(new Date(event.date_marche), 'PPP à HH:mm', { locale: fr })}
                      </span>
                      {event.lieu && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />{event.lieu}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />Max: {event.max_participants || '∞'}
                      </span>
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground mt-2">{event.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}>
                      <Users className="h-4 w-4 mr-1" />Participants
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
            ))}
            {events?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucun événement de marche créé.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarcheEventsAdmin;
