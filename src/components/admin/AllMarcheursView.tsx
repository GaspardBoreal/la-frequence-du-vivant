import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Leaf, Eye, Search, Loader2 } from 'lucide-react';
import MarcheurObservationsManager from './MarcheurObservationsManager';
import type { ExplorationMarcheur } from '@/hooks/useExplorationMarcheurs';

const roleLabels: Record<string, string> = {
  principal: 'Principal',
  invité: 'Invité',
  scientifique: 'Scientifique',
  marcheur: 'Marcheur',
};

const roleColors: Record<string, string> = {
  principal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  invité: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  scientifique: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  marcheur: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

interface MarcheurWithExploration extends ExplorationMarcheur {
  explorationId: string;
  explorationName: string;
}

export default function AllMarcheursView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [observationsDialogOpen, setObservationsDialogOpen] = useState(false);
  const [selectedMarcheur, setSelectedMarcheur] = useState<MarcheurWithExploration | null>(null);

  const { data: marcheurs, isLoading } = useQuery({
    queryKey: ['all-marcheurs'],
    queryFn: async (): Promise<MarcheurWithExploration[]> => {
      const { data, error } = await supabase
        .from('exploration_marcheurs')
        .select('*, explorations(name)')
        .order('nom', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch observation counts
      const ids = data.map(m => m.id);
      const { data: observations } = await supabase
        .from('marcheur_observations')
        .select('marcheur_id, species_scientific_name')
        .in('marcheur_id', ids);

      const obsByMarcheur = new Map<string, string[]>();
      (observations || []).forEach(obs => {
        const existing = obsByMarcheur.get(obs.marcheur_id) || [];
        if (!existing.includes(obs.species_scientific_name)) {
          existing.push(obs.species_scientific_name);
        }
        obsByMarcheur.set(obs.marcheur_id, existing);
      });

      return data.map(m => {
        const species = obsByMarcheur.get(m.id) || [];
        const exploration = m.explorations as any;
        return {
          id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          fullName: `${m.prenom} ${m.nom}`,
          role: (m.role || 'marcheur') as ExplorationMarcheur['role'],
          bioCoute: m.bio_courte || undefined,
          avatarUrl: m.avatar_url || undefined,
          couleur: m.couleur || '#10b981',
          isPrincipal: m.is_principal || false,
          ordre: m.ordre || 1,
          observationsCount: species.length,
          speciesObserved: species,
          explorationId: m.exploration_id,
          explorationName: exploration?.name || 'Inconnue',
        };
      });
    },
  });

  const roles = ['principal', 'invité', 'scientifique', 'marcheur'];

  const filtered = useMemo(() => {
    if (!marcheurs) return [];
    return marcheurs.filter(m => {
      const matchSearch = !search || 
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.explorationName.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || m.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [marcheurs, search, roleFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement de tous les marcheurs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Tous les marcheurs</h3>
          <p className="text-sm text-muted-foreground">
            {marcheurs?.length || 0} marcheur{(marcheurs?.length || 0) > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou exploration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={roleFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter(null)}
          >
            Tous
          </Button>
          {roles.map(r => (
            <Button
              key={r}
              variant={roleFilter === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(roleFilter === r ? null : r)}
            >
              {roleLabels[r]}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((marcheur) => (
            <Card key={marcheur.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                      style={{ backgroundColor: marcheur.couleur }}
                    >
                      {marcheur.prenom[0]}{marcheur.nom[0]}
                    </div>
                    <div>
                      <CardTitle className="text-base">{marcheur.fullName}</CardTitle>
                      <Badge variant="outline" className={`mt-1 text-xs ${roleColors[marcheur.role]}`}>
                        {roleLabels[marcheur.role]}
                      </Badge>
                    </div>
                  </div>
                  {marcheur.isPrincipal && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      ★ Principal
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="secondary" className="text-xs">
                  {marcheur.explorationName}
                </Badge>

                {marcheur.bioCoute && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {marcheur.bioCoute}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">
                    {marcheur.observationsCount} espèce{marcheur.observationsCount > 1 ? 's' : ''} observée{marcheur.observationsCount > 1 ? 's' : ''}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => {
                    setSelectedMarcheur(marcheur);
                    setObservationsDialogOpen(true);
                  }}
                >
                  <Eye className="h-3 w-3" />
                  Observations
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {search || roleFilter ? 'Aucun marcheur ne correspond aux filtres' : 'Aucun marcheur enregistré'}
          </p>
        </Card>
      )}

      {/* Observations Dialog */}
      {selectedMarcheur && (
        <Dialog open={observationsDialogOpen} onOpenChange={(open) => {
          setObservationsDialogOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['all-marcheurs'] });
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: selectedMarcheur.couleur }}
                >
                  {selectedMarcheur.prenom[0]}{selectedMarcheur.nom[0]}
                </div>
                <div className="flex items-center gap-2">
                  <span>Observations de {selectedMarcheur.fullName}</span>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                    {selectedMarcheur.observationsCount} espèce{selectedMarcheur.observationsCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <MarcheurObservationsManager
                marcheur={selectedMarcheur}
                explorationId={selectedMarcheur.explorationId}
                onObservationsSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ['all-marcheurs'] });
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
