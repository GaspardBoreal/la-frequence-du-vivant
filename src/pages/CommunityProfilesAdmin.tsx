import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, GraduationCap, Award, Footprints, Eye, Heart, Shield, Link2, MousePointerClick, UserPlus2, Users, Calendar, MapPin, CheckCircle2, ClipboardList, Pencil, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ActivityDashboard from '@/components/admin/ActivityDashboard';
import { getMarcheEventTypeMeta } from '@/lib/marcheEventTypes';
import MarcheurEditSheet, { type EditableProfile } from '@/components/admin/community/MarcheurEditSheet';
import ProfilsImpactDashboard from '@/components/admin/community/ProfilsImpactDashboard';
import ProfilsMosaique from '@/components/admin/community/ProfilsMosaique';

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  marcheur_en_devenir: { label: 'En devenir', icon: Footprints, color: 'text-muted-foreground' },
  marcheur: { label: 'Marcheur', icon: Footprints, color: 'text-emerald-500' },
  eclaireur: { label: 'Éclaireur', icon: Eye, color: 'text-teal-500' },
  ambassadeur: { label: 'Ambassadeur', icon: Heart, color: 'text-sky-500' },
  sentinelle: { label: 'Sentinelle', icon: Shield, color: 'text-amber-500' },
};

const CommunityProfilesAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [marcheursSearch, setMarcheursSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [editing, setEditing] = useState<EditableProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEditor = (p: EditableProfile) => { setEditing(p); setEditOpen(true); };

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['community-profiles-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: affiliateStats } = useQuery({
    queryKey: ['community-affiliate-admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_community_affiliate_admin_stats');
      if (error) throw error;
      return (data || []) as Array<{
        link_id: string;
        marcheur_prenom: string | null;
        marcheur_nom: string | null;
        exploration_name: string | null;
        marche_event_title: string | null;
        channel: string;
        button_click_count: number;
        generated_count: number;
        landing_view_count: number;
        account_created_count: number;
        conversion_rate: number;
      }>;
    },
  });

  // Fetch participations with event + profile data for Marcheurs tab
  const { data: participations, isLoading: isLoadingParticipations } = useQuery({
    queryKey: ['admin-marche-participations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_participations')
        .select('id, user_id, validated_at, validation_method, created_at, marche_event_id, marche_events(id, title, date_marche, event_type, lieu)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        user_id: string;
        validated_at: string | null;
        validation_method: string | null;
        created_at: string;
        marche_event_id: string;
        marche_events: {
          id: string;
          title: string;
          date_marche: string;
          event_type: string;
          lieu: string | null;
        } | null;
      }>;
    },
  });

  // Build a map of user_id → profile for display
  const profileMap = useMemo(() => {
    const map: Record<string, { prenom: string; nom: string }> = {};
    profiles?.forEach(p => { map[p.user_id] = { prenom: p.prenom, nom: p.nom }; });
    return map;
  }, [profiles]);

  // Unique events for dropdown filter
  const uniqueEvents = useMemo(() => {
    if (!participations) return [];
    const seen = new Map<string, string>();
    participations.forEach(p => {
      if (p.marche_events && !seen.has(p.marche_events.id)) {
        seen.set(p.marche_events.id, p.marche_events.title);
      }
    });
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [participations]);

  // Filtered participations
  const filteredParticipations = useMemo(() => {
    if (!participations) return [];
    return participations.filter(p => {
      const profile = profileMap[p.user_id];
      const fullName = profile ? `${profile.prenom} ${profile.nom}`.toLowerCase() : '';
      const q = marcheursSearch.toLowerCase();
      const matchSearch = !q || fullName.includes(q);
      const matchEvent = eventFilter === 'all' || p.marche_events?.id === eventFilter;
      return matchSearch && matchEvent;
    });
  }, [participations, profileMap, marcheursSearch, eventFilter]);

  // KPIs
  const kpis = useMemo(() => {
    if (!participations) return { total: 0, uniqueWalkers: 0, uniqueEvents: 0 };
    const walkers = new Set(participations.map(p => p.user_id));
    const events = new Set(participations.map(p => p.marche_event_id));
    return { total: participations.length, uniqueWalkers: walkers.size, uniqueEvents: events.size };
  }, [participations]);

  const toggleFormation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase
        .from('community_profiles')
        .update({ formation_validee: !current })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-profiles-admin'] });
      toast.success('Formation mise à jour');
    },
  });

  const toggleCertification = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase
        .from('community_profiles')
        .update({ certification_validee: !current })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-profiles-admin'] });
      toast.success('Certification mise à jour');
    },
  });

  const filtered = profiles?.filter(p => {
    const q = search.toLowerCase();
    return !q || `${p.prenom} ${p.nom} ${p.ville || ''}`.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Communauté des Marcheurs</h1>
        </div>

        <Tabs defaultValue="communaute" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto mb-6">
            <TabsTrigger value="communaute">Communauté</TabsTrigger>
            <TabsTrigger value="profils">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Profils
            </TabsTrigger>
            <TabsTrigger value="activites">Activités</TabsTrigger>
            <TabsTrigger value="affiliation">Affiliation marcheurs</TabsTrigger>
            <TabsTrigger value="marcheurs">Inscriptions</TabsTrigger>
          </TabsList>

          {/* ===== COMMUNAUTÉ ===== */}
          <TabsContent value="communaute">
            {profiles && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                <Card className="p-3 text-center">
                  <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </Card>
                {Object.entries(roleConfig).map(([key, config]) => {
                  const count = profiles.filter(p => p.role === key).length;
                  const Icon = config.icon;
                  return (
                    <Card key={key} className="p-3 text-center">
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${config.color}`} />
                      <p className="text-2xl font-bold text-foreground">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom, ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marcheur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Marches</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Formation</TableHead>
                      <TableHead>Certification</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.map(profile => {
                      const config = roleConfig[profile.role] || roleConfig.marcheur_en_devenir;
                      const Icon = config.icon;
                      return (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div>
                              <span className="font-medium">{profile.prenom} {profile.nom}</span>
                              {profile.kigo_accueil && (
                                <p className="text-xs text-muted-foreground italic">"{profile.kigo_accueil}"</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1.5 text-sm ${config.color}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {config.label}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono">{profile.marches_count}</TableCell>
                          <TableCell>{profile.ville || '—'}</TableCell>
                          <TableCell>
                            <Button
                              variant={profile.formation_validee ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleFormation.mutate({ id: profile.id, current: profile.formation_validee })}
                            >
                              <GraduationCap className="h-3.5 w-3.5 mr-1" />
                              {profile.formation_validee ? 'Validée' : 'Valider'}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={profile.certification_validee ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleCertification.mutate({ id: profile.id, current: profile.certification_validee })}
                            >
                              <Award className="h-3.5 w-3.5 mr-1" />
                              {profile.certification_validee ? 'Validée' : 'Valider'}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openEditor(profile as unknown as EditableProfile)}>
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Éditer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucun profil trouvé.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* ===== PROFILS ===== */}
          <TabsContent value="profils" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Qui marche avec nous ?</h2>
              <p className="text-sm text-muted-foreground">
                Une mosaïque vivante des marcheur·euse·s qui relient le grand public à l'agroécologie,
                à l'écotourisme et à la géopoétique. Données privées, agrégats anonymisés.
              </p>
            </div>
            <ProfilsImpactDashboard />
            {profiles && (
              <ProfilsMosaique
                profiles={profiles as unknown as (EditableProfile & { marches_count?: number })[]}
                onEdit={openEditor}
              />
            )}
          </TabsContent>

          {/* ===== ACTIVITÉS ===== */}
          <TabsContent value="activites">
            <ActivityDashboard />
          </TabsContent>

          {/* ===== AFFILIATION ===== */}
          <TabsContent value="affiliation">
            <Card className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Affiliation marcheurs</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-3 mb-4">
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><MousePointerClick className="h-4 w-4" />Clics boutons</div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{affiliateStats?.reduce((sum, item) => sum + (item.button_click_count || 0), 0) || 0}</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><Link2 className="h-4 w-4" />Liens générés</div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{affiliateStats?.reduce((sum, item) => sum + (item.generated_count || 0), 0) || 0}</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><UserPlus2 className="h-4 w-4" />Comptes créés</div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{affiliateStats?.reduce((sum, item) => sum + (item.account_created_count || 0), 0) || 0}</p>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marcheur</TableHead>
                    <TableHead>Exploration</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Clics</TableHead>
                    <TableHead>Liens</TableHead>
                    <TableHead>Vues</TableHead>
                    <TableHead>Comptes</TableHead>
                    <TableHead>Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateStats?.map((item) => (
                    <TableRow key={item.link_id}>
                      <TableCell className="font-medium">{item.marcheur_prenom || '—'} {item.marcheur_nom || ''}</TableCell>
                      <TableCell>
                        <div>
                          <p>{item.exploration_name || '—'}</p>
                          {item.marche_event_title && <p className="text-xs text-muted-foreground">{item.marche_event_title}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="uppercase text-xs tracking-wide text-muted-foreground">{item.channel}</TableCell>
                      <TableCell>{item.button_click_count}</TableCell>
                      <TableCell>{item.generated_count}</TableCell>
                      <TableCell>{item.landing_view_count}</TableCell>
                      <TableCell>{item.account_created_count}</TableCell>
                      <TableCell>{item.conversion_rate}%</TableCell>
                    </TableRow>
                  ))}
                  {!affiliateStats?.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Aucun lien affilié généré pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== MARCHEURS ===== */}
          <TabsContent value="marcheurs">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="p-3 text-center">
                <ClipboardList className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
                <p className="text-xs text-muted-foreground">Inscriptions</p>
              </Card>
              <Card className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-2xl font-bold text-foreground">{kpis.uniqueWalkers}</p>
                <p className="text-xs text-muted-foreground">Marcheurs uniques</p>
              </Card>
              <Card className="p-3 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold text-foreground">{kpis.uniqueEvents}</p>
                <p className="text-xs text-muted-foreground">Événements</p>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un marcheur..."
                  value={marcheursSearch}
                  onChange={e => setMarcheursSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Tous les événements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {uniqueEvents.map(ev => (
                    <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoadingParticipations ? (
              <p className="text-muted-foreground">Chargement des participations...</p>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marcheur</TableHead>
                      <TableHead>Événement</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipations.map(p => {
                      const profile = profileMap[p.user_id];
                      const ev = p.marche_events;
                      const typeMeta = getMarcheEventTypeMeta(ev?.event_type);
                      const TypeIcon = typeMeta?.icon;
                      const isValidated = !!p.validated_at;

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {profile ? `${profile.prenom} ${profile.nom}` : p.user_id.slice(0, 8) + '…'}
                          </TableCell>
                          <TableCell>{ev?.title || '—'}</TableCell>
                          <TableCell>
                            {typeMeta ? (
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.badgeClassName}`}>
                                {TypeIcon && <TypeIcon className="w-3 h-3" />}
                                {typeMeta.shortLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {ev ? format(new Date(ev.date_marche), 'dd MMM yyyy', { locale: fr }) : '—'}
                          </TableCell>
                          <TableCell>
                            {ev?.lieu ? (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {ev.lieu}
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {isValidated ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Présent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Inscrit
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredParticipations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Aucune participation trouvée.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityProfilesAdmin;
