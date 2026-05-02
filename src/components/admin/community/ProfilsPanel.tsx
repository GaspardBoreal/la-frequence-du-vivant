import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProfilsImpactDashboard from './ProfilsImpactDashboard';
import ProfilsMosaique from './ProfilsMosaique';
import MarcheurEditSheet, { type EditableProfile } from './MarcheurEditSheet';

export type ProfilsScope =
  | { type: 'all' }
  | { type: 'event'; eventId: string };

interface Props {
  title?: string;
  subtitle?: string;
  /**
   * Restreint l'onglet aux participant·e·s d'un événement précis.
   * Sans scope (ou `type: 'all'`), comportement global identique aux pages
   * /admin/community et /admin/marche-events.
   */
  scope?: ProfilsScope;
}

/**
 * Bloc "Profils" factorisé : header + dashboard d'impact + mosaïque + sheet d'édition.
 * Utilisé identiquement dans :
 *  - /admin/community (onglet Profils) — scope global
 *  - /admin/marche-events (onglet Profils) — scope global
 *  - /admin/marche-events/:id (onglet Profils) — scope événement
 *
 * Tout ajout fonctionnel se fait ici (ou dans ses enfants) et s'applique aux trois.
 */
export const ProfilsPanel: React.FC<Props> = ({
  title = 'Qui marche avec nous ?',
  subtitle = "Une mosaïque vivante des marcheur·euse·s qui relient le grand public à l'agroécologie, à l'écotourisme et à la géopoétique. Données privées, agrégats anonymisés.",
  scope = { type: 'all' },
}) => {
  const [editing, setEditing] = useState<EditableProfile | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEditor = (p: EditableProfile) => {
    setEditing(p);
    setEditOpen(true);
  };

  const eventId = scope.type === 'event' ? scope.eventId : null;

  // 1. Si scope=event, récupérer d'abord les user_id des participant·e·s.
  const { data: participantIds } = useQuery({
    queryKey: ['marche-participation-user-ids', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marche_participations')
        .select('user_id')
        .eq('marche_event_id', eventId!);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.user_id as string);
    },
    enabled: !!eventId,
  });

  // 2. Charger les profils — globalement ou filtrés sur les participant·e·s.
  const { data: profiles } = useQuery({
    queryKey:
      scope.type === 'event'
        ? ['community-profiles-by-event', eventId, participantIds?.length ?? 0]
        : ['community-profiles-admin'],
    queryFn: async () => {
      let q = supabase.from('community_profiles').select('*').order('created_at', { ascending: false });
      if (scope.type === 'event') {
        if (!participantIds || participantIds.length === 0) return [];
        q = q.in('user_id', participantIds);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: scope.type === 'all' || !!participantIds,
  });

  const profilesList = useMemo(
    () => (profiles ?? []) as unknown as (EditableProfile & { marches_count?: number })[],
    [profiles],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ProfilsImpactDashboard eventId={eventId} />
      <ProfilsMosaique profiles={profilesList} onEdit={openEditor} />
      <MarcheurEditSheet profile={editing} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
};

export default ProfilsPanel;
