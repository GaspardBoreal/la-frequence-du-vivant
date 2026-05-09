import React, { useMemo, useState } from 'react';
import { Bird, Flower2, TreePine, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ImpactTeaserCard from './ImpactTeaserCard';
import ImpactStoriesViewer from './ImpactStoriesViewer';
import { useMarcheurSensibleSpecies } from '@/hooks/useMarcheurSensibleSpecies';
import { useMarcheurBadges } from '@/hooks/useMarcheurBadges';
import { useMarcheurPratiques } from '@/hooks/useCurationMarcheurs';
import { computeSentinelleIndex } from '@/lib/sentinelleIndex';
import type { MarcheurWithStats } from '@/hooks/useExplorationParticipants';

interface Props {
  marcheur: MarcheurWithStats;
  explorationId?: string;
  explorationMarcheIds?: string[];
  totalMarchesCount?: number;
  isExpanded: boolean;
  hasTemoignage: boolean;
}

/**
 * Wahouhh Impact panel: teaser card + Stories swipables (Spotify-Wrapped style).
 * Replaces the legacy flat block.
 */
const MarcheurImpactPanel: React.FC<Props> = ({
  marcheur, explorationId, explorationMarcheIds: rawIds, totalMarchesCount: rawCount, isExpanded, hasTemoignage,
}) => {
  const explorationMarcheIds = rawIds || [];
  const totalMarchesCount = rawCount || 0;
  const [storiesOpen, setStoriesOpen] = useState(false);

  // Snapshot data for pioneer count + taxonomy fallback
  const { data: snapshotsData } = useQuery({
    queryKey: ['marcheur-impact-snapshots', explorationId],
    queryFn: async () => {
      if (!explorationMarcheIds.length) return [];
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('marche_id, snapshot_date, total_species, birds_count, plants_count, fungi_count')
        .in('marche_id', explorationMarcheIds);
      return data || [];
    },
    enabled: isExpanded && !!explorationId && explorationMarcheIds.length > 0,
    staleTime: 5 * 60_000,
  });

  const snapshots = snapshotsData || [];

  const pioneerCount = useMemo(() => {
    if (!snapshots.length && explorationMarcheIds.length > 0) {
      return Math.min(marcheur.totalContributions > 0 ? explorationMarcheIds.length : 0, explorationMarcheIds.length);
    }
    const snapshotMarcheIds = new Set(snapshots.map(s => s.marche_id));
    const without = explorationMarcheIds.filter(id => !snapshotMarcheIds.has(id));
    return marcheur.totalContributions > 0 ? without.length : 0;
  }, [snapshots, explorationMarcheIds, marcheur.totalContributions]);

  const taxonomicGroups = useMemo(() => {
    const species = marcheur.speciesObserved || [];
    const groups: { label: string; count: number; icon: React.ElementType; color: string }[] = [];
    const sb = snapshots.reduce((s, snap) => s + (snap.birds_count || 0), 0);
    const sp = snapshots.reduce((s, snap) => s + (snap.plants_count || 0), 0);
    const sf = snapshots.reduce((s, snap) => s + (snap.fungi_count || 0), 0);
    const birdsLocal = species.filter(s => s.scientificName.toLowerCase().includes('aves')).length;
    const plantsLocal = species.filter(s => s.scientificName.toLowerCase().includes('plant')).length;
    const fungiLocal = species.filter(s => s.scientificName.toLowerCase().includes('fung')).length;

    const birds = Math.max(birdsLocal, sb > 0 ? 1 : 0);
    const plants = Math.max(plantsLocal, sp > 0 ? 1 : 0);
    const fungi = Math.max(fungiLocal, sf > 0 ? 1 : 0);
    const others = Math.max(species.length - birdsLocal - plantsLocal - fungiLocal, 0);

    if (birds > 0) groups.push({ label: 'Oiseaux', count: birds, icon: Bird, color: 'text-sky-400' });
    if (plants > 0) groups.push({ label: 'Plantes', count: plants, icon: Flower2, color: 'text-green-400' });
    if (fungi > 0) groups.push({ label: 'Champignons', count: fungi, icon: TreePine, color: 'text-amber-400' });
    if (others > 0) groups.push({ label: 'Autre vivant', count: others, icon: Leaf, color: 'text-emerald-400' });
    return groups;
  }, [marcheur.speciesObserved, snapshots]);

  const sensible = useMarcheurSensibleSpecies(marcheur.speciesObserved, explorationId);

  // IMPORTANT : useMarcheurPratiques attend le crewId base (exploration_marcheurs.id),
  // pas l'ID UI synthétique. Sans crewId, aucune pratique ne peut être rattachée.
  const { data: pratiquesPortees = [] } = useMarcheurPratiques(marcheur.crewId ?? null);
  const pratiquesScopeCount = useMemo(
    () => (explorationId ? pratiquesPortees.filter(p => p.exploration_id === explorationId).length : pratiquesPortees.length),
    [pratiquesPortees, explorationId],
  );

  const sentinelle = useMemo(() => computeSentinelleIndex({
    photos: marcheur.stats.photos,
    sons: marcheur.stats.sons,
    textes: marcheur.stats.textes,
    hasTemoignage,
    speciesCount: marcheur.stats.speciesCount || 0,
    bioCount: sensible.bioIndicateurs.length,
    auxCount: sensible.auxiliaires.length,
    eeeCount: sensible.eee.length,
    pratiquesCount: pratiquesScopeCount,
  }), [marcheur.stats, hasTemoignage, sensible, pratiquesScopeCount]);

  const score = sentinelle.total;
  const label = sentinelle.label;

  const badgesResult = useMarcheurBadges({
    marcheur,
    sensible,
    pioneerCount,
    taxonomicFamilies: taxonomicGroups.length,
    hasTemoignage,
  });

  return (
    <>
      <ImpactTeaserCard
        marcheur={marcheur}
        sensible={sensible}
        badgesResult={badgesResult}
        sentinelleScore={score}
        sentinelleLabel={label}
        hasTemoignage={hasTemoignage}
        onOpen={() => setStoriesOpen(true)}
      />
      <ImpactStoriesViewer
        open={storiesOpen}
        onOpenChange={setStoriesOpen}
        marcheur={marcheur}
        sensible={sensible}
        badgesResult={badgesResult}
        pioneerCount={pioneerCount}
        taxonomicFamilies={taxonomicGroups}
        sentinelleScore={score}
        sentinelleLabel={label}
        sentinelleBreakdown={sentinelle.breakdown}
        sentinelleNextTip={sentinelle.nextTip}
        hasTemoignage={hasTemoignage}
      />
    </>
  );
};

export default MarcheurImpactPanel;
