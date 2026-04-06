import React, { useState, useMemo, useEffect } from 'react';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, Save, Trash2, Plus, Printer, Users, MapPin, Tag, TreePine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MARCHE_EVENT_TYPES, getMarcheEventTypeMeta, type MarcheEventType } from '@/lib/marcheEventTypes';
import EventBiodiversityTab from '@/components/community/EventBiodiversityTab';

const MarcheEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'nouveau';

  const [form, setForm] = useState({
    title: '', description: '', date_marche: '', lieu: '',
    latitude: '', longitude: '', max_participants: '20', exploration_id: '', event_type: 'agroecologique' as MarcheEventType,
  });

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [deletingParticipation, setDeletingParticipation] = useState<{id: string, name: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        event_type: (event.event_type as MarcheEventType) || 'agroecologique',
      });
    }
  }, [event]);

  const selectedTypeMeta = getMarcheEventTypeMeta(form.event_type);

  // Explorations list
  const { data: explorations } = useQuery({
    queryKey: ['explorations-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('explorations').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Marches of selected exploration
  const { data: explorationMarches } = useQuery({
    queryKey: ['exploration-marches-preview', form.exploration_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exploration_marches')
        .select('ordre, publication_status, marche_id, partie_id, marches(nom_marche, ville, departement, theme_principal), exploration_parties(titre)')
        .eq('exploration_id', form.exploration_id)
        .order('ordre');
      if (error) throw error;
      return data;
    },
    enabled: !!form.exploration_id,
  });

  // Participations (raw)
  const { data: participations } = useQuery({
    queryKey: ['marche-participations', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_participations')
        .select('*')
        .eq('marche_event_id', id!);
      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  // Participant profiles (separate query)
  const participantUserIds = useMemo(() => participations?.map(p => p.user_id) ?? [], [participations]);
  const { data: participantProfiles } = useQuery({
    queryKey: ['participant-profiles', participantUserIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('user_id, prenom, nom, role')
        .in('user_id', participantUserIds);
      if (error) throw error;
      return data;
    },
    enabled: participantUserIds.length > 0,
  });

  const getParticipantProfile = (userId: string) =>
    participantProfiles?.find(p => p.user_id === userId);

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
        event_type: form.event_type,
      });
      if (error) throw error;
    },
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
        event_type: form.event_type,
      }).eq('id', id!);
      if (error) throw error;
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('marche_events').delete().eq('id', id!);
      if (error) throw error;
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
  });

  const handleDeleteParticipant = async () => {
    if (!deletingParticipation) return;
    setDeleteLoading(true);
    try {
      const { error, count } = await supabase
        .from('marche_participations')
        .delete({ count: 'exact' })
        .eq('id', deletingParticipation.id);
      if (error) throw error;
      if (count === 0) throw new Error('Suppression refusée — vérifiez vos droits admin');
      queryClient.invalidateQueries({ queryKey: ['marche-participations', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
      toast.success('Participant retiré');
      setDeletingParticipation(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

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

        {!isNew ? (
          <Tabs defaultValue="informations" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="empreinte" className="flex items-center gap-1.5">
                <TreePine className="h-3.5 w-3.5" />
                Empreinte Vivante
              </TabsTrigger>
            </TabsList>
            <TabsContent value="informations" className="space-y-6 mt-4">

        {/* Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Informations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Titre *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Date *</Label><Input type="datetime-local" value={form.date_marche} onChange={e => setForm(f => ({ ...f, date_marche: e.target.value }))} /></div>
            <div className="md:col-span-2">
              <Label>Type de marche *</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {MARCHE_EVENT_TYPES.map((type) => {
                  const meta = getMarcheEventTypeMeta(type)!;
                  const Icon = meta.icon;
                  const isSelected = form.event_type === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, event_type: type }))}
                      className={cn(
                        'group rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
                        isSelected
                          ? cn(meta.cardClassName, 'ring-2 ring-primary/20 shadow-sm')
                          : 'border-border bg-card hover:border-primary/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', meta.iconWrapClassName)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{meta.shortLabel}</p>
                          {isSelected && <Badge variant="outline" className={cn('rounded-full text-[10px]', meta.badgeClassName)}>Sélectionné</Badge>}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedTypeMeta && (
                <div className={cn('mt-3 flex items-start gap-3 rounded-2xl border p-4', selectedTypeMeta.cardClassName)}>
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', selectedTypeMeta.iconWrapClassName)}>
                    <selectedTypeMeta.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{selectedTypeMeta.label}</p>
                      <Badge variant="outline" className={cn('rounded-full text-[10px]', selectedTypeMeta.badgeClassName)}>Protocole actif</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedTypeMeta.description}</p>
                  </div>
                </div>
              )}
            </div>
            <div><Label>Lieu</Label><Input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} /></div>
            <div><Label>Max participants</Label><Input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))} /></div>
            <div><Label>Latitude</Label><Input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></div>
            <div><Label>Longitude</Label><Input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <RichTextEditor
                value={form.description}
                onChange={val => setForm(f => ({ ...f, description: val }))}
                placeholder="Décrivez l'événement..."
                className="mt-1"
              />
            </div>
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

            {/* Marches de l'exploration */}
            {form.exploration_id && explorationMarches && explorationMarches.length > 0 && (
              <div className="md:col-span-2 mt-2">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Marches de cette exploration ({explorationMarches.length})
                  </p>
                  <div className="space-y-2">
                    {explorationMarches.map((em: any, idx: number) => {
                      const marche = em.marches;
                      const partie = em.exploration_parties;
                      const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
                        published_public: { label: 'Publiée', variant: 'default' },
                        published_readers: { label: 'Lecteurs', variant: 'secondary' },
                        draft: { label: 'Brouillon', variant: 'outline' },
                      };
                      const status = statusMap[em.publication_status] || { label: em.publication_status, variant: 'outline' as const };

                      return (
                        <div key={idx} className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {em.ordre ?? idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {marche?.nom_marche || marche?.ville || 'Marche sans nom'}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {marche?.ville && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {marche.ville}{marche.departement ? ` · ${marche.departement}` : ''}
                                </span>
                              )}
                              {marche?.theme_principal && (
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {marche.theme_principal}
                                </span>
                              )}
                            </div>
                            {partie?.titre && (
                              <p className="text-[10px] text-muted-foreground mt-1 italic">
                                Partie : {partie.titre}
                              </p>
                            )}
                          </div>
                          <Badge variant={status.variant} className="text-[10px] flex-shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            {isNew ? (
              <Button onClick={() => createEvent.mutate(undefined, {
                onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marche-events'] }); toast.success('Événement créé avec succès'); navigate('/admin/marche-events'); },
                onError: () => toast.error('Erreur lors de la création'),
              })} disabled={!form.title || !form.date_marche || createEvent.isPending}>
                <Plus className="h-4 w-4 mr-2" />Créer l'événement
              </Button>
            ) : (
              <>
                <Button onClick={() => updateEvent.mutate(undefined, {
                  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marche-events'] }); queryClient.invalidateQueries({ queryKey: ['marche-event', id] }); toast.success('Événement mis à jour'); },
                  onError: () => toast.error('Erreur lors de la mise à jour'),
                })} disabled={!form.title || !form.date_marche || updateEvent.isPending}>
                  <Save className="h-4 w-4 mr-2" />Enregistrer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => { if (confirm('Supprimer cet événement ?')) deleteEvent.mutate(undefined, {
                    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marche-events'] }); toast.success('Événement supprimé'); navigate('/admin/marche-events'); },
                  }); }}
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
                        onClick={() => addParticipant.mutate(profile.user_id, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ['marche-participations', id] });
                            queryClient.invalidateQueries({ queryKey: ['participant-profiles'] });
                            queryClient.invalidateQueries({ queryKey: ['marche-participation-counts'] });
                            setShowAddParticipant(false);
                            setParticipantSearch('');
                            toast.success('Participant ajouté avec succès');
                          },
                          onError: (error: any) => {
                            if (error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
                              toast.error('Ce participant est déjà inscrit à cet événement');
                            } else {
                              toast.error("Erreur lors de l'ajout du participant");
                            }
                          },
                        })}
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
                     <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participations.map((p: any) => {
                    const profile = getParticipantProfile(p.user_id);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{profile?.prenom} {profile?.nom}</TableCell>
                        <TableCell className="capitalize">{profile?.role?.replace(/_/g, ' ') || '—'}</TableCell>
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
                         <TableCell>
                           <button
                             onClick={() => setDeletingParticipation({ id: p.id, name: `${profile?.prenom || ''} ${profile?.nom || ''}`.trim() || 'ce participant' })}
                             className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
                         </TableCell>
                       </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun participant validé pour le moment.</p>
            )}
          </Card>
        )}

            </TabsContent>
            <TabsContent value="empreinte" className="mt-4">
              <EventBiodiversityTab
                explorationId={event?.exploration_id || undefined}
                marcheEventId={id || undefined}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {/* Form for new event - rendered without tabs */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Informations</h2>
              <p className="text-sm text-muted-foreground">Créez d'abord l'événement pour accéder à toutes les fonctionnalités.</p>
            </Card>
          </>
        )}

        <ConfirmDeleteDialog
          open={!!deletingParticipation}
          onOpenChange={(open) => { if (!open) setDeletingParticipation(null); }}
          title="Retirer ce participant"
          description={`Voulez-vous vraiment retirer ${deletingParticipation?.name || ''} de cet événement ?`}
          onConfirm={handleDeleteParticipant}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default MarcheEventDetail;
