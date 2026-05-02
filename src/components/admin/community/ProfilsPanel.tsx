import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProfilsImpactDashboard from './ProfilsImpactDashboard';
import ProfilsMosaique from './ProfilsMosaique';
import MarcheurEditSheet, { type EditableProfile } from './MarcheurEditSheet';

interface Props {
  title?: string;
  subtitle?: string;
}

/**
 * Bloc "Profils" factorisé : header + dashboard d'impact + mosaïque + sheet d'édition.
 * Utilisé identiquement dans /admin/community (onglet Profils) et /admin/marche-events.
 * Tout ajout fonctionnel se fait ici (ou dans ses enfants) et s'applique aux deux pages.
 */
export const ProfilsPanel: React.FC<Props> = ({
  title = 'Qui marche avec nous ?',
  subtitle = "Une mosaïque vivante des marcheur·euse·s qui relient le grand public à l'agroécologie, à l'écotourisme et à la géopoétique. Données privées, agrégats anonymisés.",
}) => {
  const [editing, setEditing] = useState<EditableProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEditor = (p: EditableProfile) => {
    setEditing(p);
    setEditOpen(true);
  };

  const { data: profiles } = useQuery({
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ProfilsImpactDashboard />
      {profiles && (
        <ProfilsMosaique
          profiles={profiles as unknown as (EditableProfile & { marches_count?: number })[]}
          onEdit={openEditor}
        />
      )}
      <MarcheurEditSheet profile={editing} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
};

export default ProfilsPanel;
