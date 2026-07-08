import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  ExternalLink, Leaf, Bird, Bug, HelpCircle,
  MapPin, List, Music, ChevronLeft, ChevronRight, X, Users, Sparkles,
} from 'lucide-react';
import { useSpeciesPhoto } from '@/hooks/useSpeciesPhoto';
import { useSpeciesTranslation } from '@/hooks/useSpeciesTranslation';
import { useSpeciesMarches } from '@/hooks/useSpeciesMarches';
import { useSpeciesXenoCanto } from '@/hooks/useSpeciesXenoCanto';
import { useSpeciesObservers } from '@/hooks/useSpeciesObservers';
import { useSpeciesMarcheurPhotos } from '@/hooks/useSpeciesMarcheurPhotos';
import { useChatTabSnapshot } from '@/hooks/useChatPageContext';
import { useCanUseContextualChat } from '@/hooks/useCanUseContextualChat';
import SpeciesMarchesTab from './species-modal/SpeciesMarchesTab';
import SpeciesAudioPlayer from './species-modal/SpeciesAudioPlayer';
import SpeciesMiniMap from './species-modal/SpeciesMiniMap';
import SpeciesObserversTab from './species-modal/SpeciesObserversTab';
import SpeciesPhotoCarousel, { type CarouselSlide } from './species-modal/SpeciesPhotoCarousel';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';
import SpeciesTrophicPosition from './species-modal/SpeciesTrophicPosition';


import type { BiodiversitySpecies } from '@/types/biodiversity';
import { useExplorationSpeciesPool } from '@/hooks/useExplorationSpeciesPool';
import PhenoCtaButton from '@/components/phenologie/PhenoCtaButton';
import { highResDetailSrc } from '@/components/biodiversity/discover/modes/games/zoomImageSrc';

interface SpeciesGalleryDetailModalProps {
  /** Minimal identity used for hero + queries. `count` may be exact (Synthèse)
   *  or a single-day count (Pouls du vivant) — both work. */
  species: {
    name: string;
    scientificName: string;
    count: number;
    kingdom: string;
    photos?: string[];
  } | null;
  /** When present, enables marche/observer tabs and auto-resolves the trophic
   *  pool if `trophicPool` is omitted. */
  explorationId?: string;
  allEventMarches?: SpeciesMarcheData[];
  /** Full pool used to compute the trophic chain for the "Sa place" widget.
   *  If omitted and `explorationId` is provided, the pool is resolved internally. */
  trophicPool?: BiodiversitySpecies[];
  isOpen: boolean;
  onClose: () => void;
}

const getKingdomInfo = (kingdom: string) => {
  const lowerKingdom = kingdom?.toLowerCase() || '';
  if (lowerKingdom.includes('plant') || lowerKingdom.includes('flore') || lowerKingdom === 'plantae') {
    return { icon: Leaf, label: 'Flore', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  }
  if (lowerKingdom.includes('bird') || lowerKingdom.includes('aves')) {
    return { icon: Bird, label: 'Oiseau', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  }
  if (lowerKingdom.includes('insect') || lowerKingdom.includes('arthropod')) {
    return { icon: Bug, label: 'Insecte', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  }
  if (lowerKingdom.includes('animal') || lowerKingdom.includes('faune') || lowerKingdom === 'animalia') {
    return { icon: Bird, label: 'Faune', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }
  if (lowerKingdom.includes('fung')) {
    return { icon: Leaf, label: 'Champignon', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  }
  return { icon: HelpCircle, label: kingdom || 'Inconnu', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
};

const SpeciesGalleryDetailModal: React.FC<SpeciesGalleryDetailModalProps> = ({
  species,
  explorationId,
  allEventMarches,
  trophicPool,
  isOpen,
  onClose,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const isMobile = useIsMobile();

  // Fetch real-time photo data from iNaturalist when modal opens
  const { data: photoData, isLoading: photoLoading } = useSpeciesPhoto(
    isOpen ? species?.scientificName : undefined
  );

  // Fetch French translation
  const { data: translation, isLoading: translationLoading } = useSpeciesTranslation(
    species?.scientificName || '',
    species?.name
  );

  // Fetch marches where this species was observed
  const { data: speciesMarches = [], isLoading: marchesLoading } = useSpeciesMarches(
    isOpen ? species?.scientificName : undefined,
    explorationId
  );

  // Fetch audio from Xeno-Canto
  const { data: xenoCantoData, isLoading: audioLoading } = useSpeciesXenoCanto(
    isOpen ? species?.scientificName : undefined,
    species?.kingdom
  );

  // Fetch observers (marcheurs ayant vu l'espèce sur cet événement)
  const { data: observers = [], isLoading: observersLoading } = useSpeciesObservers(
    isOpen ? species?.scientificName : undefined,
    explorationId,
  );

  // Fetch photos prises par les marcheurs (table marcheur_observations)
  const { data: marcheurPhotos = [], isLoading: marcheurPhotosLoading } = useSpeciesMarcheurPhotos(
    isOpen ? species?.scientificName : undefined,
    explorationId,
  );

  const { canUse: canChat } = useCanUseContextualChat();

  // Fallback trophic pool: when parent didn't pass one but we know the exploration,
  // resolve it ourselves so the "Sa place dans la chaîne" widget renders in every
  // entry point (Synthèse, Pouls du vivant, Marche → Vivant).
  const { data: explorationPool = [] } = useExplorationSpeciesPool(
    isOpen && !trophicPool && explorationId ? explorationId : undefined,
  );
  const resolvedTrophicPool = useMemo<BiodiversitySpecies[] | undefined>(() => {
    if (trophicPool && trophicPool.length > 0) return trophicPool;
    if (!explorationPool || explorationPool.length === 0) return undefined;
    return explorationPool.map((sp) => ({
      id: sp.key,
      scientificName: sp.scientificName || sp.displayName,
      commonName: sp.commonNameFr || sp.commonName || '',
      family: '',
      kingdom: (sp.group as any) || 'Other',
      iconicTaxon: sp.group || undefined,
      observations: sp.count,
      lastSeen: '',
      photos: sp.imageUrl ? [sp.imageUrl] : undefined,
      source: 'inaturalist' as const,
      attributions: [],
    }));
  }, [trophicPool, explorationPool]);

  // Snapshot pour le ChatBot (screen-awareness) — DOIT être appelé avant tout
  // early return pour préserver l'ordre des hooks entre les renders.
  const _uniqueObserversCount = new Set(observers.map((o) => o.observerName)).size;
  useChatTabSnapshot(
    'apprendre.especeOuverte',
    isOpen && species
      ? {
          nom_fr: translation?.commonName || photoData?.commonName || species.name,
          nom_sci: species.scientificName,
          observations_total: species.count,
          marches: speciesMarches.slice(0, 20).map((m) => ({
            nom: m.marcheName,
            ville: m.ville,
            date: m.observationDate,
            obs: m.observationCount,
          })),
          observateurs_citoyens: observers.slice(0, 30).map((o) => ({
            nom: o.observerName,
            source: o.source,
            url: o.originalUrl,
            date: o.observationDate,
            lieu: o.locationName,
          })),
          observateurs_uniques: _uniqueObserversCount,
        }
      : undefined,
  );

  // Build typed gallery slides — FUSION par URL (au lieu de dédup) pour conserver
  // les deux étiquettes quand une photo terrain est aussi la référence iNat.
  const gallerySlides = useMemo<CarouselSlide[]>(() => {
    if (!species) return [];
    const refPhotos = (photoData?.photos && photoData.photos.length > 0)
      ? photoData.photos
      : species.photos || [];
    const refSet = new Set(refPhotos);
    const byUrl = new Map<string, CarouselSlide>();

    // 1. Photos terrain (marcheurs éditoriaux + observations citoyennes)
    marcheurPhotos.forEach((m) => {
      const isAlsoRef = refSet.has(m.url);
      byUrl.set(m.url, {
        url: m.url,
        source: m.source === 'citizen' ? 'citizen' : 'marcheur',
        observerName: m.observerName,
        date: m.observationDate,
        marcheName: m.marcheName,
        originalUrl: m.originalUrl,
        alsoReference: isAlsoRef,
      });
    });

    // 2. Photos locales storage (médias marcheurs sans entrée marcheur_observations)
    (species.photos || [])
      .filter((u) => u && (u.includes('supabase') || u.includes('storage')))
      .forEach((url) => {
        if (!byUrl.has(url)) {
          byUrl.set(url, { url, source: 'marcheur', observerName: 'Marcheur' });
        }
      });

    // 3. Référence iNat — n'ajoute que les URLs pas déjà présentes côté terrain
    refPhotos.forEach((url) => {
      if (byUrl.has(url)) return;
      byUrl.set(url, {
        url,
        source: 'inat',
        originalUrl: `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(species.scientificName)}`,
      });
    });

    return Array.from(byUrl.values());
  }, [photoData?.photos, marcheurPhotos, species]);

  if (!species) return null;

  // Use fetched data if available, otherwise fall back to props
  const photos = (photoData?.photos && photoData.photos.length > 0)
    ? photoData.photos
    : species.photos || [];
  const kingdom = (photoData?.kingdom && photoData.kingdom !== 'Unknown')
    ? photoData.kingdom
    : species.kingdom;

  // French name priority: translation > photoData > original
  const frenchName = translation?.commonName || photoData?.commonName || species.name;
  const isEnglishFallback = frenchName === species.name && translation?.source === 'fallback';

  const hasMarches = speciesMarches.length > 0;
  const hasAudio = xenoCantoData && xenoCantoData.recordings.length > 0;
  const hasObservers = observers.length > 0;
  const uniqueObserversCount = new Set(observers.map((o) => o.observerName)).size;
  const kingdomInfo = getKingdomInfo(kingdom);
  const KingdomIcon = kingdomInfo.icon;

  // Build external search URLs
  const gbifSearchUrl = `https://www.gbif.org/species/search?q=${encodeURIComponent(species.scientificName)}`;
  const inaturalistSearchUrl = `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(species.scientificName)}`;
  const xenoCantoSearchUrl = `https://xeno-canto.org/explore?query=${encodeURIComponent(species.scientificName)}`;

  const totalMarchesCount = speciesMarches.length;
  const isLoading = photoLoading || translationLoading;

  const lightboxPhotos = gallerySlides.map((s) => s.url);

  // Prefill enrichi pour le chatbot — partagé desktop + mobile
  const buildSpeciesChatPrefill = () => {
    const topMarches = speciesMarches.slice(0, 3).map((m) => m.marcheName).filter(Boolean);
    const lines = [
      `Parle-moi de ${frenchName} (${species.scientificName}).`,
      ``,
      `Contexte observé sur cette exploration :`,
      `- Règne : ${kingdomInfo.label}`,
      `- ${species.count} observation${species.count > 1 ? 's' : ''}${hasMarches ? ` sur ${totalMarchesCount} marche${totalMarchesCount > 1 ? 's' : ''}` : ''}`,
    ];
    if (hasObservers) {
      lines.push(`- ${uniqueObserversCount} marcheur${uniqueObserversCount > 1 ? 's' : ''} contributeur${uniqueObserversCount > 1 ? 's' : ''}`);
    }
    if (topMarches.length > 0) {
      lines.push(`- Marches concernées : ${topMarches.join(', ')}${speciesMarches.length > topMarches.length ? '…' : ''}`);
    }
    lines.push(
      ``,
      `Pourquoi cette espèce est-elle intéressante ici, que nous apprend sa présence (rôle écologique, indicateur, saisonnalité, interactions), et quelles précautions ou attentions porter ?`,
    );
    return lines.join('\n');
  };

  const openSpeciesChat = () => {
    window.dispatchEvent(
      new CustomEvent('community-chat:open', {
        detail: {
          prefill: buildSpeciesChatPrefill(),
          species: species.scientificName,
          speciesLabel: frenchName,
        },
      }),
    );
  };

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % Math.max(lightboxPhotos.length, 1));
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + Math.max(lightboxPhotos.length, 1)) % Math.max(lightboxPhotos.length, 1));
  const hasPhoto = lightboxPhotos.length > 0;

  return (
    <>
      <Sheet open={isOpen && !showLightbox} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={
            isMobile
              ? 'bg-slate-900/98 backdrop-blur-xl border-white/10 text-white p-0 gap-0 h-[95vh] w-full !max-w-full rounded-t-2xl flex flex-col overflow-hidden [&>button]:top-3 [&>button]:right-3 [&>button]:z-20 [&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/15 [&>button]:bg-black/55 [&>button]:p-0 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-lg [&>button]:backdrop-blur-md hover:[&>button]:bg-black/70 focus-visible:[&>button]:ring-2 focus-visible:[&>button]:ring-white/40 [&>button_svg]:shrink-0 [&>button_svg]:h-4.5 [&>button_svg]:w-4.5 [&>button_svg]:text-white'
              : 'bg-slate-900/98 backdrop-blur-xl border-white/10 text-white p-0 gap-0 w-full sm:!max-w-[620px] h-full flex flex-col overflow-hidden [&>button]:top-3 [&>button]:right-3 [&>button]:z-20 [&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/15 [&>button]:bg-black/55 [&>button]:p-0 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-lg [&>button]:backdrop-blur-md hover:[&>button]:bg-black/70 focus-visible:[&>button]:ring-2 focus-visible:[&>button]:ring-white/40 [&>button_svg]:shrink-0 [&>button_svg]:h-4.5 [&>button_svg]:w-4.5 [&>button_svg]:text-white'
          }
        >
          {/* Accessible title (hidden) */}

          <VisuallyHidden.Root asChild>
            <SheetTitle>Détails de l'espèce {species.scientificName}</SheetTitle>
          </VisuallyHidden.Root>

          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>
          )}

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Hero Carousel — Référence iNat ↔ Photos marcheurs */}
            <SpeciesPhotoCarousel
              slides={gallerySlides}
              isLoading={isLoading || marcheurPhotosLoading}
              onPhotoClick={(i) => {
                setCurrentPhotoIndex(i);
                setShowLightbox(true);
              }}
              emptyIcon={<KingdomIcon className="w-16 h-16 mx-auto opacity-30" />}
            />

            {/* Content */}
            <div className="px-4 md:px-5 pt-4 pb-6 space-y-5">
              {/* Identity Section */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white leading-tight">
                  {frenchName}
                  {isEnglishFallback && (
                    <span className="ml-2 text-xs text-white/40 font-normal">(nom anglais)</span>
                  )}
                </h2>
                <p className="text-sm text-white/50 italic">{species.scientificName}</p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge variant="outline" className={`${kingdomInfo.color} flex items-center gap-1`}>
                    <KingdomIcon className="w-3 h-3" />
                    {kingdomInfo.label}
                  </Badge>
                  <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
                    {species.count} observation{species.count > 1 ? 's' : ''}
                    {hasMarches && ` sur ${totalMarchesCount} marche${totalMarchesCount > 1 ? 's' : ''}`}
                    {hasObservers && ` · ${uniqueObserversCount} marcheur${uniqueObserversCount > 1 ? 's' : ''}`}
                  </Badge>
                </div>
              </div>

              {/* Place in the trophic chain — 3 interactive mini-views */}
              {resolvedTrophicPool && resolvedTrophicPool.length > 0 && species && (
                <SpeciesTrophicPosition
                  scientificName={species.scientificName}
                  commonName={frenchName}
                  speciesPool={resolvedTrophicPool as any}
                />
              )}

              {/* Carnet Phéno BBCH — visible uniquement si l'espèce est une culture suivie.
                  On choisit la meilleure photo source pour l'IA :
                    1. Photo marcheur la plus récente (résolution maximale via highResDetailSrc)
                    2. À défaut, citizen, puis 1ʳᵉ slide, puis 1ʳᵉ photo iNat. */}
              {species && (() => {
                const bestSlide =
                  [...gallerySlides]
                    .filter((s) => s.source === 'marcheur')
                    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0]
                  ?? gallerySlides.find((s) => s.source === 'citizen')
                  ?? gallerySlides[0];
                const rawUrl = bestSlide?.url ?? photos[0] ?? null;
                const aiPhotoUrl = rawUrl ? (highResDetailSrc(rawUrl) ?? rawUrl) : null;
                return (
                  <PhenoCtaButton
                    speciesScientificName={species.scientificName}
                    explorationId={explorationId ?? null}
                    photoUrl={aiPhotoUrl}
                  />
                );
              })()}





              {/* CTA IA inline (desktop) */}
              {canChat && !isMobile && (
                <Button
                  onClick={openSpeciesChat}
                  className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white border-0 shadow-lg shadow-emerald-500/20 group h-11"
                >
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Discuter de cette espèce avec l'IA
                </Button>
              )}

              {/* Marches Section - with tabs */}
              {(hasMarches || hasObservers || marchesLoading || observersLoading) && (
                <div className="space-y-3" data-chat-card data-chat-title={`Observé — ${frenchName}`}>
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Observé sur ces marches</span>
                  </div>

                  <Tabs defaultValue="list" className="w-full">
                    <TabsList className="w-full bg-white/5 border border-white/10 grid grid-cols-3 h-10">
                      <TabsTrigger value="list" className="data-[state=active]:bg-white/10 text-xs">
                        <List className="w-3 h-3 mr-1.5" />
                        Liste
                      </TabsTrigger>
                      <TabsTrigger value="map" className="data-[state=active]:bg-white/10 text-xs">
                        <MapPin className="w-3 h-3 mr-1.5" />
                        Carte
                      </TabsTrigger>
                      <TabsTrigger value="observers" className="data-[state=active]:bg-white/10 text-xs">
                        <Users className="w-3 h-3 mr-1.5" />
                        Observateurs
                        {hasObservers && (
                          <span className="ml-1 text-[10px] opacity-70">({uniqueObserversCount})</span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-3">
                      <SpeciesMarchesTab marches={speciesMarches} isLoading={marchesLoading} />
                    </TabsContent>

                    <TabsContent value="map" className="mt-3">
                      <SpeciesMiniMap marches={speciesMarches} isLoading={marchesLoading} allEventMarches={allEventMarches} />
                    </TabsContent>

                    <TabsContent value="observers" className="mt-3">
                      <SpeciesObserversTab observers={observers} isLoading={observersLoading} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Audio Section */}
              {(hasAudio || audioLoading) && (
                <SpeciesAudioPlayer
                  recordings={xenoCantoData?.recordings || []}
                  numRecordings={xenoCantoData?.numRecordings || 0}
                  scientificName={species.scientificName}
                  isLoading={audioLoading}
                />
              )}

              {/* External links */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/40 mb-2">Rechercher sur :</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[80px] bg-white/5 border-white/10 hover:bg-white/10 text-white/70 text-xs"
                    onClick={() => window.open(gbifSearchUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    GBIF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[80px] bg-white/5 border-white/10 hover:bg-white/10 text-white/70 text-xs"
                    onClick={() => window.open(inaturalistSearchUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    iNaturalist
                  </Button>
                  {(hasAudio || kingdom.toLowerCase().includes('animal') || kingdom.toLowerCase().includes('aves')) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[80px] bg-white/5 border-white/10 hover:bg-white/10 text-white/70 text-xs"
                      onClick={() => window.open(xenoCantoSearchUrl, '_blank')}
                    >
                      <Music className="w-3 h-3 mr-1" />
                      Xeno-Canto
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CTA IA sticky bottom (mobile) */}
          {canChat && isMobile && (
            <div
              className="shrink-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/0 border-t border-white/5"
            >
              <Button
                onClick={openSpeciesChat}
                className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white border-0 shadow-lg shadow-emerald-500/20 group h-12"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                Discuter de cette espèce avec l'IA
              </Button>
            </div>
          )}
          
        </SheetContent>
      </Sheet>



      {/* Lightbox - rendered in portal to avoid z-index conflicts */}
      {showLightbox && hasPhoto && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10"
              onClick={() => setShowLightbox(false)}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={lightboxPhotos[currentPhotoIndex]}
              alt={frenchName}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Navigation in lightbox */}
            {lightboxPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Caption */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-lg text-white font-medium">{frenchName}</p>
              <p className="text-sm text-white/60 italic">{species.scientificName}</p>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default SpeciesGalleryDetailModal;
