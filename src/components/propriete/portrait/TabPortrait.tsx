import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Images, LayoutGrid, MapPin, Printer, Save, Loader2, Pencil, Eye, Sparkles, Map as MapIcon } from 'lucide-react';
import { PortraitCadastre } from './PortraitCadastre';
import {
  GALLERY_MAX,
  useCanCurateGallery,
  usePropertyGallery,
  usePropertyGalleryCandidates,
  useSavePropertyGallery,
  type GalleryCandidate,
} from '@/hooks/propriete/usePropertyGallery';
import { GalleryLightTable } from './GalleryLightTable';
import { GalleryBento } from './GalleryBento';
import { GalleryConstellation } from './GalleryConstellation';
import { GalleryMotion } from './GalleryMotion';
import { PortraitPrintLayout } from './PortraitPrintLayout';

interface Props {
  proprieteId: string;
  proprieteNom: string;
  proprieteVille?: string | null;
  proprieteAdresse?: string | null;
  proprieteCodePostal?: string | null;
  proprieteCenter?: [number, number] | null;
}

type ViewMode = 'bento' | 'motion' | 'constellation';
type SubTab = 'galerie' | 'cadastre';

const keyOf = (c: { source_table: string; source_id: string }) =>
  `${c.source_table}::${c.source_id}`;

export const TabPortrait: React.FC<Props> = ({
  proprieteId,
  proprieteNom,
  proprieteVille,
  proprieteAdresse,
  proprieteCodePostal,
  proprieteCenter,
}) => {
  const { data: photos = [], isLoading } = usePropertyGallery(proprieteId);
  const { data: canCurate = false } = useCanCurateGallery(proprieteId);

  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('bento');
  const [viewModeTouched, setViewModeTouched] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('galerie');

  const gpsCount = useMemo(() => photos.filter((p) => p.lat != null && p.lng != null).length, [photos]);
  const gpsRatio = photos.length > 0 ? gpsCount / photos.length : 0;

  // Auto-bascule initiale : si peu de photos GPS, on préfère la vue Mouvement à la Mosaïque
  // (Mosaïque reste le default neutre ; Constellation cartographique n'est proposée qu'avec ≥ 1 GPS)
  useEffect(() => {
    if (viewModeTouched || photos.length === 0) return;
    if (gpsRatio >= 0.3) setViewMode('bento');
    // sinon on garde bento par défaut, l'utilisateur bascule sur Mouvement à la main
  }, [gpsRatio, photos.length, viewModeTouched]);

  const pickView = (v: ViewMode) => { setViewMode(v); setViewModeTouched(true); };

  const { data: candidates = [], isLoading: loadingCandidates } =
    usePropertyGalleryCandidates(proprieteId, editMode);

  // État local pendant l'édition (ordre + sélection)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  useEffect(() => {
    if (editMode) {
      setSelectedKeys(photos.map((p) => keyOf(p)));
    }
  }, [editMode, photos]);

  const saveMut = useSavePropertyGallery(proprieteId);

  const handleToggle = (k: string) => {
    setSelectedKeys((prev) =>
      prev.includes(k)
        ? prev.filter((x) => x !== k)
        : prev.length >= GALLERY_MAX
          ? prev
          : [...prev, k]
    );
  };

  const handleSave = async () => {
    const byKey = new Map<string, GalleryCandidate>(candidates.map((c) => [keyOf(c), c]));
    const items = selectedKeys
      .map((k) => byKey.get(k))
      .filter(Boolean)
      .map((c) => ({
        source_table: c!.source_table,
        source_id: c!.source_id,
        url: c!.url,
        author_name: c!.author_name,
        photo_date: c!.photo_date,
        lat: c!.lat,
        lng: c!.lng,
        caption: null,
      }));
    await saveMut.mutateAsync(items);
    setEditMode(false);
  };

  // Impression via portail body : contourne l'isolation cassée quand la layout est profondément imbriquée
  const portalRef = useRef<HTMLDivElement | null>(null);
  if (typeof document !== 'undefined' && !portalRef.current) {
    const existing = document.getElementById('portrait-print-portal') as HTMLDivElement | null;
    portalRef.current = existing ?? Object.assign(document.createElement('div'), { id: 'portrait-print-portal' });
    if (!existing) document.body.appendChild(portalRef.current);
  }

  useEffect(() => {
    if (!printMode) return;
    let cancelled = false;
    document.body.classList.add('portrait-printing');

    const waitForImages = async () => {
      const node = portalRef.current;
      if (!node) return;
      const imgs = Array.from(node.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((res) => {
                const done = () => res();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
              })
        )
      );
      // petit délai pour laisser le layout se stabiliser
      await new Promise((r) => setTimeout(r, 150));
      if (!cancelled) window.print();
    };
    waitForImages();

    const onAfter = () => setPrintMode(false);
    window.addEventListener('afterprint', onAfter);
    return () => {
      cancelled = true;
      document.body.classList.remove('portrait-printing');
      window.removeEventListener('afterprint', onAfter);
    };
  }, [printMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement du portrait…
      </div>
    );
  }

  const empty = photos.length === 0 && !editMode;

  return (
    <div className="space-y-5">
      {/* Sous-onglets Portrait */}
      <div className="flex items-center gap-1 rounded-full bg-muted/40 p-1 w-fit border border-border/60">
        <SubTabPill active={subTab === 'galerie'} onClick={() => setSubTab('galerie')} icon={Images} label="Galerie" />
        <SubTabPill active={subTab === 'cadastre'} onClick={() => setSubTab('cadastre')} icon={MapIcon} label="Cadastre" />
      </div>

      {subTab === 'cadastre' ? (
        <PortraitCadastre proprieteId={proprieteId} proprieteCenter={proprieteCenter} />
      ) : (
        <>
          {/* En-tête */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
          <h2 className="text-xl md:text-2xl font-serif italic text-foreground flex items-center gap-2">
            <Images className="w-5 h-5 text-amber-600" />
            Portrait du site
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mt-1">
            Composez la carte de visite photographique de votre site — jusqu'à {GALLERY_MAX} clichés
            choisis parmi les photographies des marches réalisées.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!editMode && photos.length > 0 && (
            <>
              <ViewButton active={viewMode === 'bento'} onClick={() => pickView('bento')} icon={LayoutGrid} label="Mosaïque" />
              <ViewButton active={viewMode === 'motion'} onClick={() => pickView('motion')} icon={Sparkles} label="Mouvement" />
              <ViewButton
                active={viewMode === 'constellation'}
                onClick={() => gpsCount > 0 && pickView('constellation')}
                icon={MapPin}
                label="Carte"
                disabled={gpsCount === 0}
                title={gpsCount === 0 ? 'Aucune photo géolocalisée' : `${gpsCount}/${photos.length} photos géolocalisées`}
              />
              <button
                onClick={() => setPrintMode(true)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5"
                title="Imprimer le cahier photo"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimer
              </button>
            </>
          )}
          {canCurate && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              {photos.length === 0 ? 'Composer' : 'Modifier'}
            </button>
          )}
          {editMode && (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saveMut.isPending}
                className="text-xs px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 disabled:opacity-60"
              >
                {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Enregistrer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenu */}
      {editMode ? (
        loadingCandidates ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement des photos disponibles…
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucune photographie disponible pour ce site. Reliez cette propriété à des marches
            réalisées pour alimenter la table lumineuse.
          </div>
        ) : (
          <GalleryLightTable
            candidates={candidates}
            selectedKeys={selectedKeys}
            onToggle={handleToggle}
            onReorder={setSelectedKeys}
          />
        )
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 p-10 text-center">
          <Images className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <div className="text-sm font-medium">Le portrait de votre site n'est pas encore composé.</div>
          <p className="text-xs text-muted-foreground mt-1">
            {canCurate
              ? 'Cliquez sur « Composer » pour choisir jusqu\'à 12 photographies parmi celles des marches.'
              : 'Seul le propriétaire ou un prestataire peut composer cette galerie.'}
          </p>
        </div>
      ) : viewMode === 'bento' ? (
        <div className="space-y-2">
          <GalleryBento
            photos={photos}
            onReorder={canCurate ? (reordered) => {
              saveMut.mutate(reordered.map((p) => ({
                source_table: p.source_table,
                source_id: p.source_id,
                url: p.url,
                author_name: p.author_name,
                photo_date: p.photo_date,
                lat: p.lat,
                lng: p.lng,
                caption: p.caption,
              })));
            } : undefined}
          />
          {canCurate && (
            <p className="text-[11px] text-muted-foreground italic pl-1">
              La première photo ouvre le cahier imprimé — cliquez ✦ sur une vignette pour changer d'ouverture, ou glissez pour réordonner.
            </p>
          )}
        </div>
      ) : viewMode === 'motion' ? (
        <GalleryMotion photos={photos} />
      ) : (
        <GalleryConstellation photos={photos} fallbackCenter={proprieteCenter ?? null} />
      )}

      {/* Version imprimable — rendue dans un portail sur <body> pendant l'impression uniquement */}
      {printMode && photos.length > 0 && portalRef.current && createPortal(
        <PortraitPrintLayout
          photos={photos}
          proprieteNom={proprieteNom}
          proprieteVille={proprieteVille}
          publicUrl={typeof window !== 'undefined' ? window.location.href : undefined}
        />,
        portalRef.current
      )}
        </>
      )}
    </div>
  );
};

const SubTabPill: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);


const ViewButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  disabled?: boolean;
  title?: string;
}> = ({ active, onClick, icon: Icon, label, disabled, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
      disabled
        ? 'text-muted-foreground/40 cursor-not-allowed'
        : active
          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);
