import React, { useState } from 'react';
import { Grid3x3, Play, Printer, Sparkles, Loader2 } from 'lucide-react';
import {
  useConvivialitePhotos,
  useDeleteConvivialitePhoto,
  useReportConvivialitePhoto,
  useCanUploadConvivialite,
  useReorderConvivialitePhotos,
  type ConvivialitePhoto,
} from '@/hooks/useConvivialitePhotos';
import ConvivialiteMosaic from './ConvivialiteMosaic';
import ConvivialiteSlideshow from './ConvivialiteSlideshow';
import ConvivialitePrintLayout from './ConvivialitePrintLayout';
import ConvivialiteUploadFAB from './ConvivialiteUploadFAB';
import ConvivialiteReportDialog from './ConvivialiteReportDialog';

export interface ConvivialiteContentProps {
  explorationId: string | undefined;
  explorationName?: string;
  userId?: string;
  userRole?: string | null;
  isAdmin?: boolean;
  /** When true, renders header/buttons with light-on-dark styling (used by the immersive overlay). */
  variant?: 'inline' | 'immersive';
}

type Mode = 'mosaic' | 'slideshow' | 'print';

const ConvivialiteContent: React.FC<ConvivialiteContentProps> = ({
  explorationId,
  explorationName,
  userId,
  userRole,
  isAdmin,
  variant = 'inline',
}) => {
  const [mode, setMode] = useState<Mode>('mosaic');
  const [reportPhoto, setReportPhoto] = useState<ConvivialitePhoto | null>(null);
  const { data: photos = [], isLoading } = useConvivialitePhotos(explorationId);
  const { canUpload } = useCanUploadConvivialite(userId, explorationId, userRole, isAdmin);
  const { mutate: deletePhoto } = useDeleteConvivialitePhoto(explorationId);
  const { mutate: reportPhotoMut } = useReportConvivialitePhoto();
  const { mutate: reorderPhotos } = useReorderConvivialitePhotos(explorationId);

  const canReorder = !!isAdmin || canUpload;

  const visiblePhotos = photos.filter(p => isAdmin || !p.is_hidden);
  const uniqueAuthors = new Set(visiblePhotos.map(p => p.user_id)).size;

  const handleDelete = (photo: ConvivialitePhoto) => {
    if (window.confirm('Retirer définitivement cette photo du mur ?')) {
      deletePhoto(photo);
    }
  };

  const handleReportConfirm = (raison: string) => {
    if (!reportPhoto || !userId) return;
    reportPhotoMut({ photoId: reportPhoto.id, reporterUserId: userId, raison });
    setReportPhoto(null);
  };

  const isImmersive = variant === 'immersive';

  return (
    <div className={isImmersive ? '' : 'relative'}>
      {/* Sub-header : compteur + sélecteur de mode */}
      <div
        className={`flex items-center justify-between gap-3 mb-4 flex-wrap ${
          isImmersive ? '' : 'pb-3 border-b border-border/40'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className={`w-4 h-4 shrink-0 ${isImmersive ? 'text-amber-400' : 'text-amber-500'}`} />
          <p
            className={`text-[11px] truncate ${
              isImmersive ? 'text-white/60' : 'text-muted-foreground'
            }`}
          >
            {visiblePhotos.length} {visiblePhotos.length > 1 ? 'instants partagés' : 'instant partagé'}
            {uniqueAuthors > 0 && ` · ${uniqueAuthors} marcheur${uniqueAuthors > 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <ModeButton variant={variant} active={mode === 'mosaic'} onClick={() => setMode('mosaic')} icon={Grid3x3} label="Mosaïque" />
          <ModeButton variant={variant} active={mode === 'slideshow'} onClick={() => setMode('slideshow')} icon={Play} label="Diaporama" />
          <ModeButton variant={variant} active={mode === 'print'} onClick={() => setMode('print')} icon={Printer} label="Impression" />
          {mode === 'print' && (
            <button
              onClick={() => window.print()}
              className="ml-2 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium"
            >
              Imprimer
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div
          className={`flex items-center justify-center py-32 ${
            isImmersive ? 'text-white/60' : 'text-muted-foreground'
          }`}
        >
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement du mur…
        </div>
      ) : mode === 'mosaic' ? (
        <ConvivialiteMosaic
          photos={visiblePhotos}
          explorationId={explorationId}
          currentUserId={userId}
          isAdmin={isAdmin}
          canReorder={canReorder}
          canReattribute={!!isAdmin || ['ambassadeur','sentinelle'].includes(userRole || '')}
          onReport={(p) => setReportPhoto(p)}
          onDelete={handleDelete}
          onReorder={(orderedIds) => reorderPhotos(orderedIds)}
        />
      ) : mode === 'slideshow' ? (
        <ConvivialiteSlideshow photos={visiblePhotos} />
      ) : (
        <ConvivialitePrintLayout photos={visiblePhotos} explorationName={explorationName} />
      )}

      <ConvivialiteUploadFAB
        explorationId={explorationId}
        userId={userId}
        canUpload={canUpload}
      />

      <ConvivialiteReportDialog
        open={!!reportPhoto}
        onOpenChange={(v) => !v && setReportPhoto(null)}
        onConfirm={handleReportConfirm}
      />
    </div>
  );
};

const ModeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  variant: 'inline' | 'immersive';
}> = ({ active, onClick, icon: Icon, label, variant }) => {
  const isImmersive = variant === 'immersive';
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
        active
          ? isImmersive
            ? 'bg-white/20 text-white'
            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : isImmersive
            ? 'text-white/60 hover:text-white hover:bg-white/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default ConvivialiteContent;
