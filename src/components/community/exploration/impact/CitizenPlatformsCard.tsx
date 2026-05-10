import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle2, Sparkles, Bird, Flower2, Leaf, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarcheurAliases, normalizeAlias } from '@/hooks/useMarcheurAliases';

interface MarcheurLite {
  prenom: string;
  nom: string;
  userId?: string | null;
}

interface CitizenPlatformsCardProps {
  marcheur: MarcheurLite;
  explorationId?: string;
  explorationMarcheIds: string[];
}

interface InatProfile {
  login: string;
  name: string;
  icon_url: string | null;
  observations_count: number | null;
  species_count: number | null;
  profile_url: string;
}

const normalizeStr = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

type Source = 'inaturalist' | 'ebird' | 'gbif';

interface SourceStat {
  source: Source;
  count: number;
  speciesCount: number;
  lastDate: string | null;
  lastSpecies: string | null;
  firstUrl: string | null;
  kingdoms: Record<string, number>;
}

const PLATFORM_META: Record<Source, { label: string; signupUrl: string; color: string; icon: string }> = {
  inaturalist: {
    label: 'iNaturalist',
    signupUrl: 'https://www.inaturalist.org/signup',
    color: 'emerald',
    icon: '🌿',
  },
  ebird: {
    label: 'eBird',
    signupUrl: 'https://ebird.org/register',
    color: 'sky',
    icon: '🐦',
  },
  gbif: {
    label: 'GBIF',
    signupUrl: 'https://www.gbif.org/user/profile',
    color: 'violet',
    icon: '🌍',
  },
};

const CitizenPlatformsCard: React.FC<CitizenPlatformsCardProps> = ({ marcheur, explorationId, explorationMarcheIds }) => {
  const { data: aliases } = useMarcheurAliases(marcheur.userId ?? null, marcheur.prenom, marcheur.nom);
  const aliasesKey = (aliases || []).slice().sort().join('|');

  // Re-uses the same query key shape as ContributionsSubTab → React Query dedupes the call
  const { data: observations, isLoading } = useQuery({
    queryKey: ['marcheur-contributions-species', explorationId, aliasesKey],
    queryFn: async () => {
      if (!explorationMarcheIds.length || !aliases || !aliases.length) return [];
      const aliasSet = new Set(aliases);
      const { data } = await supabase
        .from('biodiversity_snapshots')
        .select('species_data')
        .in('marche_id', explorationMarcheIds);
      if (!data) return [];

      const results: Array<{ scientificName: string; kingdom: string; date: string; source: string; originalUrl: string | null; }> = [];
      for (const snapshot of data) {
        const speciesArr = (snapshot as any).species_data as any[];
        if (!Array.isArray(speciesArr)) continue;
        for (const sp of speciesArr) {
          const attributions = sp.attributions as any[];
          if (!Array.isArray(attributions)) continue;
          for (const attr of attributions) {
            const observerNorm = normalizeAlias(attr.observerName || '');
            if (aliasSet.has(observerNorm)) {
              results.push({
                scientificName: sp.scientificName || '',
                kingdom: sp.kingdom || '',
                date: attr.date || '',
                source: attr.source || '',
                originalUrl: attr.originalUrl || null,
              });
            }
          }
        }
      }
      const seen = new Set<string>();
      return results.filter(r => {
        const key = `${r.scientificName}|${r.date}|${r.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: !!explorationId && explorationMarcheIds.length > 0 && !!aliases?.length,
    staleTime: 60_000,
  });

  // Aggregate per source
  const stats = useMemo<Record<Source, SourceStat>>(() => {
    const init = (s: Source): SourceStat => ({
      source: s, count: 0, speciesCount: 0, lastDate: null, lastSpecies: null, firstUrl: null, kingdoms: {},
    });
    const acc: Record<Source, SourceStat> = {
      inaturalist: init('inaturalist'),
      ebird: init('ebird'),
      gbif: init('gbif'),
    };
    const speciesPerSource: Record<Source, Set<string>> = {
      inaturalist: new Set(), ebird: new Set(), gbif: new Set(),
    };
    (observations || []).forEach(o => {
      const src = o.source as Source;
      if (!acc[src]) return;
      acc[src].count += 1;
      speciesPerSource[src].add(o.scientificName);
      acc[src].kingdoms[o.kingdom] = (acc[src].kingdoms[o.kingdom] || 0) + 1;
      if (!acc[src].firstUrl && o.originalUrl) acc[src].firstUrl = o.originalUrl;
      if (o.date && (!acc[src].lastDate || o.date > acc[src].lastDate)) {
        acc[src].lastDate = o.date;
        acc[src].lastSpecies = o.scientificName;
      }
    });
    (Object.keys(acc) as Source[]).forEach(s => { acc[s].speciesCount = speciesPerSource[s].size; });
    return acc;
  }, [observations]);

  const totalKingdoms = useMemo(() => {
    const k: Record<string, number> = {};
    (observations || []).forEach(o => { k[o.kingdom] = (k[o.kingdom] || 0) + 1; });
    return k;
  }, [observations]);

  // Resolve iNat profile from first observation URL
  const inatUrl = stats.inaturalist.firstUrl;
  const { data: inatProfile, isLoading: inatLoading } = useQuery<InatProfile>({
    queryKey: ['inat-profile', inatUrl],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('resolve-inaturalist-user', {
        body: { observation_url: inatUrl },
      });
      if (error) throw error;
      return data as InatProfile;
    },
    enabled: !!inatUrl,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const activeSources: Source[] = (['inaturalist', 'ebird', 'gbif'] as Source[]).filter(s => stats[s].count > 0);
  const suggestedSources: Source[] = (['inaturalist', 'ebird'] as Source[]).filter(s => stats[s].count === 0);

  if (isLoading) {
    return (
      <div className="mx-3 mb-3 p-4 rounded-2xl bg-muted/30 border border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse de vos plateformes citoyennes…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mx-3 mb-3 space-y-3"
    >
      {activeSources.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.07] via-emerald-500/[0.04] to-transparent border border-emerald-500/20 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vos contributions citoyennes
          </div>
          {activeSources.map(src => (
            <ActivePlatformCard
              key={src}
              source={src}
              stat={stats[src]}
              inatProfile={src === 'inaturalist' ? inatProfile : undefined}
              inatLoading={src === 'inaturalist' ? inatLoading : false}
              marcheurName={`${marcheur.prenom} ${marcheur.nom}`}
            />
          ))}
        </div>
      )}

      {suggestedSources.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/[0.06] to-transparent border border-amber-500/15 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            Élargir votre voix
          </div>
          {suggestedSources.map(src => (
            <SuggestedPlatformCard
              key={src}
              source={src}
              kingdoms={totalKingdoms}
              hasAnyObservation={(observations || []).length > 0}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Active platform card ──────────────────────────────────────────────
const ActivePlatformCard: React.FC<{
  source: Source;
  stat: SourceStat;
  inatProfile?: InatProfile;
  inatLoading?: boolean;
  marcheurName: string;
}> = ({ source, stat, inatProfile, inatLoading, marcheurName }) => {
  const meta = PLATFORM_META[source];
  const dateStr = stat.lastDate ? format(new Date(stat.lastDate), 'd MMM yyyy', { locale: fr }) : null;

  // Profile URL: use resolved iNat profile, else fallback to last observation, else search
  const profileUrl =
    source === 'inaturalist' && inatProfile?.profile_url
      ? inatProfile.profile_url
      : stat.firstUrl ||
        (source === 'ebird'
          ? `https://ebird.org/`
          : source === 'gbif'
          ? `https://www.gbif.org/`
          : `https://www.inaturalist.org/`);

  const initials = marcheurName.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const showAvatar = source === 'inaturalist' && inatProfile?.icon_url;
  const handle = source === 'inaturalist' && inatProfile?.login ? `@${inatProfile.login}` : marcheurName;

  return (
    <motion.a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -1 }}
      className="block rounded-xl bg-white/40 dark:bg-white/[0.03] border border-emerald-500/15 hover:border-emerald-500/40 transition-all p-2.5"
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {showAvatar ? (
            <img
              src={inatProfile!.icon_url!}
              alt={inatProfile!.login}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/40"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm ring-2 ring-emerald-500/30">
              {inatLoading && source === 'inaturalist' ? <Loader2 className="w-4 h-4 animate-spin" /> : initials || meta.icon}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">{meta.label}</span>
            <span className="text-[10px] text-muted-foreground/70 truncate">· {handle}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            <span><span className="font-bold text-emerald-600 dark:text-emerald-400">{stat.count}</span> obs ici</span>
            {stat.speciesCount > 0 && <span>· {stat.speciesCount} esp.</span>}
            {source === 'inaturalist' && inatProfile?.observations_count != null && (
              <span>· <span className="font-semibold">{inatProfile.observations_count.toLocaleString('fr-FR')}</span> au total 🌍</span>
            )}
          </div>
          {dateStr && (
            <div className="text-[9.5px] text-muted-foreground/60 mt-0.5 truncate italic">
              Dernière : {stat.lastSpecies} · {dateStr}
            </div>
          )}
        </div>

        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
      </div>
    </motion.a>
  );
};

// ─── Suggested platform card ───────────────────────────────────────────
const SuggestedPlatformCard: React.FC<{
  source: Source;
  kingdoms: Record<string, number>;
  hasAnyObservation: boolean;
}> = ({ source, kingdoms, hasAnyObservation }) => {
  const meta = PLATFORM_META[source];
  const animaliaCount = kingdoms.Animalia || 0;
  const plantaeCount = kingdoms.Plantae || 0;

  let invitation: { headline: string; sub: string; KingdomIcon: any; tone: string };

  if (source === 'ebird') {
    if (animaliaCount > 0) {
      invitation = {
        headline: `${animaliaCount} animaux identifiés — vos chants comptent`,
        sub: 'eBird est le 1er réseau ornithologique mondial. Vos observations alimentent la science citoyenne planétaire.',
        KingdomIcon: Bird,
        tone: 'sky',
      };
    } else {
      invitation = {
        headline: 'Au prochain oiseau croisé…',
        sub: 'Rejoignez eBird : vos écoutes participent à la connaissance mondiale des oiseaux.',
        KingdomIcon: Bird,
        tone: 'sky',
      };
    }
  } else if (source === 'inaturalist') {
    invitation = {
      headline: hasAnyObservation
        ? 'Faites compter chacune de vos rencontres'
        : 'La plateforme universelle du vivant',
      sub: 'iNaturalist transforme chaque photo en donnée scientifique. Plantes, animaux, champignons — tout y a sa place.',
      KingdomIcon: plantaeCount > animaliaCount ? Flower2 : Leaf,
      tone: 'emerald',
    };
  } else {
    invitation = {
      headline: 'Explorer GBIF',
      sub: 'Le portail de référence des données de biodiversité mondiale.',
      KingdomIcon: Leaf,
      tone: 'violet',
    };
  }

  const Icon = invitation.KingdomIcon;
  const toneClasses: Record<string, string> = {
    sky: 'from-sky-500/15 to-sky-500/5 text-sky-700 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/15',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15',
    violet: 'from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/15',
  };

  return (
    <div className="rounded-xl bg-white/30 dark:bg-white/[0.02] border border-amber-500/10 p-2.5">
      <div className="flex items-start gap-2.5">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toneClasses[invitation.tone].split(' ').slice(0, 2).join(' ')} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${toneClasses[invitation.tone].split(' ').find(c => c.startsWith('text-'))}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">{meta.label}</span>
            <span className="text-[9px] uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 font-bold">à rejoindre</span>
          </div>
          <p className="text-[11px] font-medium text-foreground/90 mt-0.5">{invitation.headline}</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{invitation.sub}</p>
          <a
            href={meta.signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors bg-gradient-to-br ${toneClasses[invitation.tone]}`}
          >
            Créer mon compte <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default CitizenPlatformsCard;
