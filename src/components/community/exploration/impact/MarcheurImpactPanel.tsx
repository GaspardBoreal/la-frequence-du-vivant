import React, { useMemo, useState } from 'react';
import { Bird, Flower2, TreePine, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ImpactTeaserCard from './ImpactTeaserCard';
import ImpactStoriesViewer from './ImpactStoriesViewer';
import { useMarcheurSensibleSpecies } from '@/hooks/useMarcheurSensibleSpecies';
import { useMarcheurBadges } from '@/hooks/useMarcheurBadges';
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

  const sensible = useMarcheurSensibleSpecies(marcheur.speciesObserved);

  const { score, label } = useMemo(() => {
    // Indice de Sentinelle = diversité (5 piliers) prioritaire sur le volume
    const pillars = [
      marcheur.stats.photos > 0,
      marcheur.stats.sons > 0,
      marcheur.stats.textes > 0,
      hasTemoignage,
      sensible.bioIndicateurs.length + sensible.auxiliaires.length + sensible.eee.length > 0,
    ];
    const pillarsScore = (pillars.filter(Boolean).length / 5) * 60;
    const speciesScore = Math.min((marcheur.stats.speciesCount || 0) / 20, 1) * 25;
    const sensibleBonus = Math.min(
      (sensible.bioIndicateurs.length * 1.5 + sensible.auxiliaires.length * 1.0 + sensible.eee.length * 2.0) / 10,
      1
    ) * 15;
    const total = Math.round(pillarsScore + speciesScore + sensibleBonus);
    let lab = 'Marcheur en éveil';
    if (total >= 76) lab = 'Sentinelle de la biodiversité';
    else if (total >= 51) lab = 'Voix du Vivant';
    else if (total >= 26) lab = 'Explorateur attentif';
    return { score: total, label: lab };
  }, [marcheur.stats, hasTemoignage, sensible]);

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
        hasTemoignage={hasTemoignage}
      />
    </>
  );
};

export default MarcheurImpactPanel;
