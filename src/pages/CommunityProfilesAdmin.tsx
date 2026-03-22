import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, GraduationCap, Award, Footprints, Eye, Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
        )}
      </div>
    </div>
  );
};

export default CommunityProfilesAdmin;
