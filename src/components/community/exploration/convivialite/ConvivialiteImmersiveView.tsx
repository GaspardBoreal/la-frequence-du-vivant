import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Grid3x3, Play, Printer, Sparkles, Loader2 } from 'lucide-react';
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

interface Props {
  open: boolean;
  onClose: () => void;
  explorationId: string | undefined;
  explorationName?: string;
  userId?: string;
  userRole?: string | null;
  isAdmin?: boolean;
}

type Mode = 'mosaic' | 'slideshow' | 'print';

const ConvivialiteImmersiveView: React.FC<Props> = ({
  open, onClose, explorationId, explorationName, userId, userRole, isAdmin,
}) => {
  const [mode, setMode] = useState<Mode>('mosaic');
  const [reportPhoto, setReportPhoto] = useState<ConvivialitePhoto | null>(null);
  const { data: photos = [], isLoading } = useConvivialitePhotos(explorationId);
  const { canUpload } = useCanUploadConvivialite(userId, explorationId, userRole, isAdmin);
  const { mutate: deletePhoto } = useDeleteConvivialitePhoto(explorationId);
  const { mutate: reportPhotoMut } = useReportConvivialitePhoto();
  const { mutate: reorderPhotos } = useReorderConvivialitePhotos(explorationId);

  // Droit de réordonner = mêmes profils que ceux qui peuvent uploader (ambassadeur, sentinelle, organisateur, admin)
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-gradient-to-br from-neutral-950 via-emerald-950/40 to-neutral-950 overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-white font-semibold text-sm truncate">
                    Convivialité {explorationName ? `— ${explorationName}` : ''}
                  </h2>
                  <p className="text-white/50 text-[11px]">
                    {visiblePhotos.length} {visiblePhotos.length > 1 ? 'instants partagés' : 'instant partagé'}
                    {uniqueAuthors > 0 && ` par ${uniqueAuthors} marcheur${uniqueAuthors > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <ModeButton active={mode === 'mosaic'} onClick={() => setMode('mosaic')} icon={Grid3x3} label="Mosaïque" />
                <ModeButton active={mode === 'slideshow'} onClick={() => setMode('slideshow')} icon={Play} label="Diaporama" />
                <ModeButton
                  active={mode === 'print'}
                  onClick={() => setMode('print')}
                  icon={Printer}
                  label="Impression"
                />
                {mode === 'print' && (
                  <button
                    onClick={() => window.print()}
                    className="ml-2 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium"
                  >
                    Imprimer
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="ml-2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-32 text-white/60">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Chargement du mur…
              </div>
            ) : mode === 'mosaic' ? (
              <ConvivialiteMosaic
                photos={visiblePhotos}
                currentUserId={userId}
                isAdmin={isAdmin}
                canReorder={canReorder}
                onReport={(p) => setReportPhoto(p)}
                onDelete={handleDelete}
                onReorder={(orderedIds) => reorderPhotos(orderedIds)}
              />
            ) : mode === 'slideshow' ? (
              <ConvivialiteSlideshow photos={visiblePhotos} />
            ) : (
              <ConvivialitePrintLayout photos={visiblePhotos} explorationName={explorationName} />
            )}
          </div>

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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ComponentType<any>; label: string }> = ({
  active, onClick, icon: Icon, label,
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
      active
        ? 'bg-white/20 text-white'
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default ConvivialiteImmersiveView;
