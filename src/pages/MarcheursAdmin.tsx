import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import MarcheursManager from '@/components/admin/MarcheursManager';

interface ExplorationWithCount {
  id: string;
  name: string;
  slug: string;
  marcheursCount: number;
}

const MarcheursAdmin: React.FC = () => {
  const [selectedExplorationId, setSelectedExplorationId] = useState<string>('');

  // Fetch explorations with marcheurs count
  const { data: explorations, isLoading: loadingExplorations } = useQuery({
    queryKey: ['explorations-with-marcheurs-count'],
    queryFn: async () => {
      const { data: explorationsData, error: expError } = await supabase
        .from('explorations')
        .select('id, name, slug')
        .order('name');

      if (expError) throw expError;

      // Get marcheurs count per exploration
      const { data: marcheursData, error: marcheursError } = await supabase
        .from('exploration_marcheurs')
        .select('exploration_id');

      if (marcheursError) throw marcheursError;

      // Count marcheurs per exploration
      const countMap = new Map<string, number>();
      marcheursData?.forEach((m) => {
        const count = countMap.get(m.exploration_id) || 0;
        countMap.set(m.exploration_id, count + 1);
      });

      const result: ExplorationWithCount[] = (explorationsData || []).map((exp) => ({
        id: exp.id,
        name: exp.name,
        slug: exp.slug,
        marcheursCount: countMap.get(exp.id) || 0,
      }));

      return result;
    },
  });

  const selectedExploration = explorations?.find((e) => e.id === selectedExplorationId);
  const totalMarcheurs = explorations?.reduce((sum, e) => sum + e.marcheursCount, 0) || 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/access-admin-gb2025">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour admin
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">Gestion des Équipages</h1>
          </div>
          <p className="text-muted-foreground">
            Gérer les marcheurs et leurs observations par exploration
          </p>
          {totalMarcheurs > 0 && (
            <Badge variant="secondary" className="mt-2">
              {totalMarcheurs} marcheur{totalMarcheurs > 1 ? 's' : ''} au total
            </Badge>
          )}
        </div>

        {/* Exploration Selector */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">
              Sélectionner une exploration :
            </label>
            {loadingExplorations ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <Select
                value={selectedExplorationId}
                onValueChange={setSelectedExplorationId}
              >
                <SelectTrigger className="w-full sm:w-[400px]">
                  <SelectValue placeholder="Choisir une exploration..." />
                </SelectTrigger>
                <SelectContent>
                  {explorations?.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{exp.name}</span>
                        {exp.marcheursCount > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {exp.marcheursCount} marcheur{exp.marcheursCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </Card>

        {/* Marcheurs Manager */}
        {selectedExplorationId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                Équipage : {selectedExploration?.name}
              </h2>
            </div>
            <MarcheursManager explorationId={selectedExplorationId} />
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Aucune exploration sélectionnée
            </h3>
            <p className="text-sm text-muted-foreground">
              Choisissez une exploration dans le menu ci-dessus pour gérer son équipage de marcheurs.
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Gestion des équipages - Gaspard Boréal © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default MarcheursAdmin;
