import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ExternalLink, Leaf, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import type { CitizenContributor } from '@/hooks/useExplorationCitizenContributors';

interface InatProfile {
  login: string;
  name: string;
  icon_url: string | null;
  observations_count: number | null;
  species_count: number | null;
  profile_url: string;
}

const useInatProfile = (firstUrl: string | null) =>
  useQuery<InatProfile>({
    queryKey: ['inat-profile', firstUrl],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('resolve-inaturalist-user', {
        body: { observation_url: firstUrl },
      });
      if (error) throw error;
      return data as InatProfile;
    },
    enabled: !!firstUrl,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

const ContributorRow: React.FC<{ c: CitizenContributor }> = ({ c }) => {
  const { data: profile, isLoading } = useInatProfile(c.firstUrl);
  const initials = c.observerName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const profileUrl = profile?.profile_url || c.firstUrl || 'https://www.inaturalist.org/';
  const handle = profile?.login ? `@${profile.login}` : null;

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-500/[0.06] transition-colors"
      title={`Voir le profil iNaturalist de ${c.observerName}`}
    >
      <Avatar className="w-8 h-8 ring-1 ring-emerald-500/30">
        {profile?.icon_url ? (
          <AvatarImage src={profile.icon_url} alt={c.observerName} />
        ) : null}
        <AvatarFallback className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : initials || '·'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {c.observerName}
          {handle && (
            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">{handle}</span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {c.speciesCount} espèce{c.speciesCount > 1 ? 's' : ''} · {c.obsCount} obs
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
    </a>
  );
};

interface Props {
  contributors: CitizenContributor[];
}

const CitizenContributorsAggregateRow: React.FC<Props> = ({ contributors }) => {
  const [expanded, setExpanded] = useState(false);

  if (!contributors || contributors.length === 0) return null;

  const totalObs = contributors.reduce((sum, c) => sum + c.obsCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl bg-muted/30 border border-emerald-500/15 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-emerald-500/[0.04] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">
            +{contributors.length} contributeur{contributors.length > 1 ? 's' : ''} citoyen{contributors.length > 1 ? 's' : ''} iNaturalist
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalObs} observation{totalObs > 1 ? 's' : ''} rattachées à cette exploration
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-2 pt-1 space-y-0.5 border-t border-emerald-500/10">
              {contributors.map((c) => (
                <ContributorRow key={`${c.source}|${c.observerName}`} c={c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CitizenContributorsAggregateRow;
