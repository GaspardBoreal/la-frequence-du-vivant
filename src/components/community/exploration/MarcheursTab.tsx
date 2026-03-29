import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, BookOpen, Leaf, Copy, Share2, Users, Sprout, ChevronDown, ExternalLink, Eye, Image, FileText } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useExplorationParticipants, MarcheurWithStats, SpeciesObservation } from '@/hooks/useExplorationParticipants';
import { useSpeciesTranslationBatch } from '@/hooks/useSpeciesTranslation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MarcheursTabProps {
  explorationId?: string;
  marcheEventId?: string;
  explorationName?: string;
}

const StatBadge: React.FC<{ icon: React.ElementType; count: number; label: string; delay: number }> = ({ icon: Icon, count, label, delay }) => {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 dark:bg-white/5 text-[11px] text-muted-foreground"
      title={label}
    >
      <Icon className="w-3 h-3" />
      <span className="font-semibold text-foreground">{count}</span>
    </motion.div>
  );
};

// --- Photo gallery in drawer for community members ---
const ContributionsGallery: React.FC<{ userId: string; marcheEventId?: string; stats: MarcheurWithStats['stats']; prenom: string }> = ({ userId, marcheEventId, stats, prenom }) => {
  const { data: recentPhotos, isLoading } = useQuery({
    queryKey: ['marcheur-gallery', userId, marcheEventId],
    queryFn: async () => {
      let query = supabase
        .from('marcheur_medias')
        .select('id, url_fichier, external_url, titre, type_media')
        .eq('user_id', userId)
        .eq('is_public', true)
        .in('type_media', ['photo', 'video'])
        .order('created_at', { ascending: false })
        .limit(6);
      if (marcheEventId) query = query.eq('marche_event_id', marcheEventId);
      const { data } = await query;
      return data || [];
    },
    staleTime: 60_000,
  });

  const totalContribs = stats.photos + stats.videos + stats.sons + stats.textes;
  if (totalContribs === 0) return null;

  const photos = recentPhotos || [];

  return (
    <div className="px-3 pt-3 pb-1 space-y-3">
      {/* Contribution summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-xs font-medium text-foreground">
          Contributions de {prenom}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {(stats.photos + stats.videos) > 0 && (
            <span className="flex items-center gap-0.5">
              <Camera className="w-3 h-3" /> {stats.photos + stats.videos}
            </span>
          )}
          {stats.sons > 0 && (
            <span className="flex items-center gap-0.5">
              <Mic className="w-3 h-3" /> {stats.sons}
            </span>
          )}
          {stats.textes > 0 && (
            <span className="flex items-center gap-0.5">
              <BookOpen className="w-3 h-3" /> {stats.textes}
            </span>
          )}
        </div>
      </div>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {photos.map((photo, i) => {
            const url = photo.url_fichier || photo.external_url;
            if (!url) return null;
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0"
              >
                <img
                  src={url}
                  alt={photo.titre || `Photo ${i + 1}`}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-border/50 hover:ring-emerald-500/40 transition-all"
                />
              </motion.div>
            );
          })}
          {(stats.photos + stats.videos) > photos.length && (
            <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground">
                +{(stats.photos + stats.videos) - photos.length}
              </span>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-xl bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
      )}
    </div>
  );
};

const SpeciesDrawer: React.FC<{ marcheur: MarcheurWithStats }> = ({ marcheur }) => {
  const species = marcheur.speciesObserved || [];
  const speciesForTranslation = species.map(s => ({ scientificName: s.scientificName }));
  const { data: translations } = useSpeciesTranslationBatch(speciesForTranslation);
  const translationMap = new Map(translations?.map(t => [t.scientificName, t]) || []);

  if (species.length === 0) return null;

  return (
    <div className="px-3 pb-3 space-y-3">
      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
        <Leaf className="w-3.5 h-3.5" />
        {species.length} espèce{species.length > 1 ? 's' : ''} identifiée{species.length > 1 ? 's' : ''} par {marcheur.prenom}
      </p>

      <div className="space-y-2">
        {species.map((obs, i) => {
          const translation = translationMap.get(obs.scientificName);
          const frenchName = translation?.commonName;
          return (
            <motion.div
              key={obs.scientificName}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 dark:bg-white/[0.03] border border-border/50"
            >
              {obs.photoUrl ? (
                <img
                  src={obs.photoUrl}
                  alt={obs.scientificName}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-emerald-500/20 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-4 h-4 text-emerald-500/60" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate italic">
                  {obs.scientificName}
                </p>
                {frenchName && (
                  <p className="text-[10px] text-muted-foreground truncate capitalize">
                    {frenchName}
                  </p>
                )}
                {obs.observationDate && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {new Date(obs.observationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// CTA Science block (shared)
const CitizenScienceCTA: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500/5 to-amber-500/5 border border-emerald-500/15"
  >
    <p className="text-[11px] font-medium text-foreground mb-1">
      🔬 Devenez contributeur citoyen !
    </p>
    <p className="text-[10px] text-muted-foreground mb-2.5 leading-relaxed">
      Chaque observation nourrit la connaissance du vivant. Créez un compte pour que vos découvertes comptent dans la science mondiale.
    </p>
    <div className="flex gap-2">
      <a
        href="https://www.inaturalist.org/signup"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 transition-colors"
      >
        iNaturalist <ExternalLink className="w-2.5 h-2.5" />
      </a>
      <a
        href="https://ebird.org/register"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-colors"
      >
        eBird <ExternalLink className="w-2.5 h-2.5" />
      </a>
    </div>
  </motion.div>
);

const MarcheurCard: React.FC<{ marcheur: MarcheurWithStats; index: number; isExpanded: boolean; onToggle: () => void; marcheEventId?: string }> = ({ marcheur, index, isExpanded, onToggle, marcheEventId }) => {
  const initials = `${marcheur.prenom?.[0] || ''}${marcheur.nom?.[0] || ''}`.toUpperCase();
  const hasSpecies = (marcheur.speciesObserved || []).length > 0;
  const totalContribs = marcheur.totalContributions || 0;
  const hasContent = totalContribs > 0 || hasSpecies;
  const isCommunity = marcheur.source === 'community';
  const userId = isCommunity ? marcheur.id.replace('community-', '') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="rounded-xl bg-card border border-border hover:border-emerald-500/30 transition-colors overflow-hidden"
    >
      <button
        onClick={hasContent ? onToggle : undefined}
        className={`flex items-center gap-3 p-3 w-full text-left group ${hasContent ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Avatar className="w-10 h-10 ring-2 ring-offset-1 ring-offset-background" style={{ '--tw-ring-color': marcheur.couleur } as React.CSSProperties}>
          {marcheur.avatarUrl ? (
            <AvatarImage src={marcheur.avatarUrl} alt={`${marcheur.prenom} ${marcheur.nom}`} />
          ) : null}
          <AvatarFallback
            className="text-xs font-bold text-white"
            style={{ backgroundColor: marcheur.couleur }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {marcheur.prenom} {marcheur.nom}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {marcheur.source === 'crew' ? marcheur.role.replace('_', ' ') : marcheur.role.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <StatBadge icon={Camera} count={marcheur.stats.photos + marcheur.stats.videos} label="Photos & vidéos" delay={0.1 + index * 0.06} />
          <StatBadge icon={Mic} count={marcheur.stats.sons} label="Sons" delay={0.15 + index * 0.06} />
          <StatBadge icon={BookOpen} count={marcheur.stats.textes} label="Textes" delay={0.2 + index * 0.06} />
          <StatBadge icon={Leaf} count={marcheur.stats.speciesCount} label="Espèces" delay={0.25 + index * 0.06} />
        </div>

        {hasContent && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      {/* Hint banner — only visible when collapsed and has contributions */}
      {!isExpanded && hasContent && (
        <motion.button
          onClick={onToggle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.06 }}
          className="w-full px-3 pb-2.5 pt-0 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
        >
          <Eye className="w-3 h-3 animate-pulse" />
          <span className="font-medium">
            Voir ses contributions · {totalContribs} partage{totalContribs > 1 ? 's' : ''}
          </span>
        </motion.button>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-emerald-500/10"
          >
            {/* Section A: contributions gallery (community members) */}
            {isCommunity && userId && (
              <ContributionsGallery
                userId={userId}
                marcheEventId={marcheEventId}
                stats={marcheur.stats}
                prenom={marcheur.prenom}
              />
            )}

            {/* Section B: species observations */}
            <SpeciesDrawer marcheur={marcheur} />

            {/* CTA if has any content */}
            {hasContent && <CitizenScienceCTA />}

            {/* Empty encouragement for community with no species */}
            {isCommunity && !hasSpecies && totalContribs > 0 && (
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] text-muted-foreground italic">
                  Identifiez les espèces rencontrées lors de vos marches via l'onglet Vivant 🌿
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MarcheursTab: React.FC<MarcheursTabProps> = ({ explorationId, marcheEventId, explorationName }) => {
  const { data: marcheurs, isLoading } = useExplorationParticipants(explorationId, marcheEventId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalContributions = marcheurs?.reduce((sum, m) => sum + m.totalContributions, 0) || 0;

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Rejoins-moi sur les Marches du Vivant${explorationName ? ` — ${explorationName}` : ''} 🌿`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Marches du Vivant', text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié !');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié dans le presse-papier');
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-28" />
              <div className="h-2.5 bg-muted rounded w-16" />
            </div>
            <div className="flex gap-1">
              <div className="w-10 h-6 bg-muted rounded-full" />
              <div className="w-10 h-6 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  if (!marcheurs?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-emerald-500/15 flex items-center justify-center mb-4">
          <Sprout className="w-7 h-7 text-emerald-400/60" />
        </div>
        <h3 className="text-foreground text-sm font-semibold mb-1">
          Soyez le premier à documenter
        </h3>
        <p className="text-muted-foreground text-xs max-w-xs mb-4">
          Cette exploration attend ses premiers récits. Partagez vos photos, sons et observations pour enrichir le vivant.
        </p>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="w-3.5 h-3.5" />
          Inviter un marcheur
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">{marcheurs.length} marcheur{marcheurs.length > 1 ? 's' : ''}</span>
        </div>
        {totalContributions > 0 && (
          <span className="text-muted-foreground text-xs">
            · {totalContributions} contribution{totalContributions > 1 ? 's' : ''} publique{totalContributions > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {marcheurs.map((m, i) => (
          <MarcheurCard
            key={m.id}
            marcheur={m}
            index={i}
            isExpanded={expandedId === m.id}
            onToggle={() => setExpandedId(prev => prev === m.id ? null : m.id)}
            marcheEventId={marcheEventId}
          />
        ))}
      </div>

      {/* Engagement block */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-amber-500/5 border border-emerald-500/15"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Sprout className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-0.5">Invitez un marcheur</p>
            <p className="text-xs text-muted-foreground mb-3">
              Chaque marcheur enrichit le récit collectif du vivant. Partagez cette exploration !
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs h-8">
                <Copy className="w-3 h-3" />
                Copier le lien
              </Button>
              <Button size="sm" onClick={handleShare} className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Share2 className="w-3 h-3" />
                Partager
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MarcheursTab;
