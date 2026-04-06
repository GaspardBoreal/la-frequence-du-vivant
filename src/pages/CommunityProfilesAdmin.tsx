import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, GraduationCap, Award, Footprints, Eye, Heart, Shield, Link2, MousePointerClick, UserPlus2 } from 'lucide-react';
import { toast } from 'sonner';
import ActivityDashboard from '@/components/admin/ActivityDashboard';

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

        {/* Stats */}
        {profiles && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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

        {/* Search */}
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
          <div className="space-y-6">
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
                      </TableRow>
                    );
                  })}
                  {filtered?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun profil trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

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

            <ActivityDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityProfilesAdmin;
