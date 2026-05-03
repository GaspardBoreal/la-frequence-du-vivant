import React from 'react';
import { Card } from '@/components/ui/card';
import { useCommunityImpactAggregatesByExploration } from '@/hooks/useCommunityImpactAggregates';
import ProfilsWidgets from './ProfilsWidgets';

interface Props {
  explorationId?: string;
  explorationName?: string;
}

/**
 * Affiche les 3 widgets Profils (Pyramide des âges, Tisser la diversité,
 * Mosaïque des activités) pour les marcheur·euse·s d'une exploration.
 * Réutilise `ProfilsWidgets` pour mutualiser le rendu avec l'admin.
 */
export const ProfilsScopeContainer: React.FC<Props> = ({ explorationId, explorationName }) => {
  const { data, isLoading } = useCommunityImpactAggregatesByExploration(explorationId ?? null);

  if (!explorationId) {
    return (
      <div className="text-muted-foreground text-sm py-8 text-center">
        Aucune exploration sélectionnée.
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-muted-foreground text-sm py-8 text-center">Chargement des profils…</div>;
  }

  if (data.total === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Aucun profil renseigné pour les marcheur·euse·s de cette exploration.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Qui marche {explorationName ? `sur ${explorationName}` : 'sur cette exploration'} ?
        </h3>
        <p className="text-xs text-muted-foreground">
          {data.total} marcheur·euse·s · données agrégées et anonymisées
        </p>
      </div>
      <ProfilsWidgets data={data} />
    </div>
  );
};

export default ProfilsScopeContainer;
