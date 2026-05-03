import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Music, Plus, Globe, User, Users, Headphones } from 'lucide-react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import {
  useUploadAudio,
  useUpdateContribution,
  useDeleteContribution,
} from '@/hooks/useMarcheurContributions';
import FileUploadZone from '@/components/community/contributions/FileUploadZone';
import ContributionItem from '@/components/community/contributions/ContributionItem';
import SortToggle from '@/components/community/contributions/SortToggle';

type SortOrder = 'desc' | 'asc';

export interface MarcheurAudioPanelProps {
  /** User-id du marcheur dont on affiche les sons (auth.users) */
  ownerUserId: string | null;
  /** Crew-id éditorial éventuel (exploration_marcheurs.id) - support de la ré-attribution */
  ownerCrewId?: string | null;
  /** Marches concernées (admin audios) */
  marcheIds: string[];
  /** Events concernés (sons marcheurs) */
  marcheEventIds: string[];
  /** Si true, affiche bouton "Ajouter un son" + actions modifier/supprimer */
  canUpload?: boolean;
  /** Marche pour rattacher l'upload (sinon premier de marcheIds) */
  activeMarcheId?: string;
  /** Event pour rattacher l'upload (sinon premier de marcheEventIds) */
  activeMarcheEventId?: string;
  /** Padding/contexte d'affichage */
  variant?: 'modal' | 'inline';
  /** Identifiant viewer (pour distinguer "Mes sons" vs "Des marcheurs") */
  viewerUserId?: string | null;
}

/**
 * Lecteur audio partagé : utilisé à la fois par
 *  - MarcheDetailModal > onglet "Écouter" (Marches > Voir > Écouter)
 *  - MarcheursTab > sous-onglet "Écoute" (Marcheurs > Marcheurs)
 *
 * Affiche : audios admin (marche_audio) + sons du marcheur (marcheur_audio)
 * en respectant la ré-attribution (attributed_marcheur_id).
 */
const MarcheurAudioPanel: React.FC<MarcheurAudioPanelProps> = ({
  ownerUserId,
  ownerCrewId,
  marcheIds,
  marcheEventIds,
  canUpload = false,
  activeMarcheId,
  activeMarcheEventId,
  variant = 'inline',
  viewerUserId,
}) => {
  const { trackActivity } = useActivityTracker();
  const [sort, setSort] = useState<SortOrder>('asc');
  const [showUpload, setShowUpload] = useState(false);

  const effectiveViewerUserId = viewerUserId ?? ownerUserId ?? null;

  // ── Admin audios (marche_audio) ──
  const { data: adminAudio } = useQuery({
    queryKey: ['marcheur-panel-admin-audio', marcheIds],
    queryFn: async () => {
      if (!marcheIds.length) return [];
      const { data } = await supabase
        .from('marche_audio')
        .select('id, url_supabase, titre, duree_secondes, type_audio, marche_id')
        .in('marche_id', marcheIds)
        .order('ordre')
        .limit(50);
      return data || [];
    },
    enabled: marcheIds.length > 0,
    staleTime: 60_000,
  });

  // ── Sons du marcheur (marcheur_audio) ──
  const { data: ownerAudio } = useQuery({
    queryKey: ['marcheur-panel-owner-audio', ownerUserId, ownerCrewId, marcheEventIds, sort],
    queryFn: async () => {
      if (!marcheEventIds.length || (!ownerUserId && !ownerCrewId)) return [];
      const orParts: string[] = [];
      if (ownerUserId) orParts.push(`user_id.eq.${ownerUserId}`);
      if (ownerCrewId) orParts.push(`attributed_marcheur_id.eq.${ownerCrewId}`);
      const { data } = await supabase
        .from('marcheur_audio')
        .select('*')
        .in('marche_event_id', marcheEventIds)
        .or(orParts.join(','))
        .order('created_at', { ascending: sort === 'asc' });

      // Filtre RLS-friendly : viewer voit ses propres + les publics
      return (data || []).filter((a: any) => {
        if (a.is_public) return true;
        return effectiveViewerUserId && a.user_id === effectiveViewerUserId;
      });
    },
    enabled: marcheEventIds.length > 0 && !!(ownerUserId || ownerCrewId),
    staleTime: 30_000,
  });

  const uploadAudio = useUploadAudio(effectiveViewerUserId || '');
  const updateContrib = useUpdateContribution();
  const deleteContrib = useDeleteContribution();

  // "Mes sons" = sons appartenant au viewer (uploadeur réel) parmi ceux affichés
  const myAudio = (ownerAudio || []).filter(
    (a: any) => effectiveViewerUserId && a.user_id === effectiveViewerUserId,
  );
  const othersAudio = (ownerAudio || []).filter(
    (a: any) => !effectiveViewerUserId || a.user_id !== effectiveViewerUserId,
  );

  const padding = variant === 'modal' ? '' : 'px-3 pt-3 pb-3';

  const isEmpty =
    !adminAudio?.length && !myAudio.length && !othersAudio.length && !showUpload;

  const targetEventId = activeMarcheEventId || marcheEventIds[0];
  const targetMarcheId = activeMarcheId || marcheIds[0];

  return (
    <div className={`space-y-4 ${padding}`}>
      <div className="flex items-center justify-between">
        {canUpload && targetEventId ? (
          <button
            onClick={() => setShowUpload(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un son
          </button>
        ) : (
          <span />
        )}
        <SortToggle sort={sort} onToggle={() => setSort(s => (s === 'desc' ? 'asc' : 'desc'))} />
      </div>

      {showUpload && canUpload && targetEventId && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <FileUploadZone
            accept="audio/*"
            label="Enregistrements sonores"
            icon={<Music className="w-6 h-6 text-violet-400/60" />}
            isUploading={uploadAudio.isPending}
            onFilesSelected={(files, isPublic) => {
              uploadAudio.mutate({
                files,
                marcheEventId: targetEventId,
                isPublic,
                marcheId: targetMarcheId,
              });
              if (effectiveViewerUserId) {
                trackActivity(effectiveViewerUserId, 'media_upload', 'audio', {
                  marcheEventId: targetEventId,
                  metadata: { count: files.length },
                });
              }
            }}
          />
        </motion.div>
      )}

      {/* Admin audio */}
      {adminAudio && adminAudio.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-emerald-400/50" />
            <span className="text-emerald-200/60 text-[10px] uppercase tracking-wider">
              De l'exploration
            </span>
          </div>
          <div className="space-y-2">
            {adminAudio.map((audio: any) => (
              <div
                key={audio.id}
                className="bg-white/5 rounded-lg border border-white/10 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-xs font-medium truncate">
                      {audio.titre || 'Enregistrement'}
                    </p>
                    {audio.duree_secondes && (
                      <p className="text-muted-foreground text-[10px]">
                        {Math.floor(audio.duree_secondes / 60)}:
                        {String(audio.duree_secondes % 60).padStart(2, '0')}
                      </p>
                    )}
                  </div>
                </div>
                <audio controls className="w-full h-8" preload="none">
                  <source src={audio.url_supabase} />
                </audio>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mes sons */}
      {myAudio.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300/80 text-[10px] uppercase tracking-wider">
              Mes sons ({myAudio.length})
            </span>
          </div>
          <div className="space-y-2">
            {myAudio.map((a: any) => (
              <ContributionItem
                key={a.id}
                id={a.id}
                type="audio"
                titre={a.titre}
                description={a.description}
                url={a.url_fichier}
                isPublic={a.is_public}
                sharedToWeb={(a as any).shared_to_web}
                isOwner={true}
                createdAt={a.created_at}
                onUpdate={(id, updates) =>
                  updateContrib.mutate({ table: 'marcheur_audio', id, updates })
                }
                onDelete={(id) =>
                  deleteContrib.mutate({
                    table: 'marcheur_audio',
                    id,
                    storageUrl: a.url_fichier,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Sons des autres */}
      {othersAudio.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-blue-300/80 text-[10px] uppercase tracking-wider">
              Des marcheurs ({othersAudio.length})
            </span>
          </div>
          <div className="space-y-2">
            {othersAudio.map((a: any) => (
              <ContributionItem
                key={a.id}
                id={a.id}
                type="audio"
                titre={a.titre}
                url={a.url_fichier}
                isPublic={a.is_public}
                isOwner={false}
                createdAt={a.created_at}
              />
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="px-3 py-6 text-center">
          <Headphones className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground italic">
            {canUpload
              ? 'Aucun enregistrement sonore — Appuyez sur + pour partager vos sons'
              : 'Aucun enregistrement sonore partagé'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MarcheurAudioPanel;
