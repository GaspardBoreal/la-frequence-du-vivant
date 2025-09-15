import React, { useState } from 'react';
import { Camera, Mic, FileText, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import PhotoCaptureFloat from './PhotoCaptureFloat';
import AudioCaptureFloat from './AudioCaptureFloat';
import TexteCaptureFloat from './TexteCaptureFloat';
import { useMarcheTextes } from '@/hooks/useMarcheTextes';
import { ProcessedPhoto } from '../../../utils/photoUtils';

interface MediaCaptureFloatProps {
  marcheId: string;
  onPhotoCaptured?: (photo: ProcessedPhoto) => void;
  onAudioUploaded?: () => void;
  pendingPhotosCount?: number;
  disabled?: boolean;
}

type CaptureType = 'photo' | 'audio' | 'text' | null;

export const MediaCaptureFloat: React.FC<MediaCaptureFloatProps> = ({
  marcheId,
  onPhotoCaptured,
  onAudioUploaded,
  pendingPhotosCount = 0,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCapture, setActiveCapture] = useState<CaptureType>(null);
  
  const { data: textes } = useMarcheTextes(marcheId);
  const textesCount = textes?.length || 0;

  const captureOptions = [
    {
      type: 'photo' as const,
      icon: Camera,
      label: 'Photo',
      count: pendingPhotosCount,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'audio' as const,
      icon: Mic,
      label: 'Audio',
      count: 0, // Audio doesn't have a pending count in the current implementation
      color: 'from-green-500 to-emerald-500'
    },
    {
      type: 'text' as const,
      icon: FileText,
      label: 'Texte',
      count: textesCount,
      color: 'from-purple-500 to-violet-500'
    }
  ];

  const handleOptionClick = (type: CaptureType) => {
    setActiveCapture(type);
    setIsExpanded(false);
  };

  const handleClose = () => {
    setActiveCapture(null);
  };

  

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3"
            >
              {captureOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.div
                    key={option.type}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <Button
                      onClick={() => handleOptionClick(option.type)}
                      className={`
                        h-14 w-14 rounded-full shadow-lg
                        bg-gradient-to-r ${option.color}
                        hover:scale-110 transition-all duration-200
                        border-2 border-white/20
                      `}
                      disabled={disabled}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </Button>
                    {option.count > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {option.count}
                      </Badge>
                    )}
                    <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900/90 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                      {option.label}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              h-16 w-16 rounded-full shadow-xl
              bg-gradient-to-r from-primary to-primary/80
              hover:from-primary/90 hover:to-primary/70
              border-4 border-white/20
              transition-all duration-300
            `}
            disabled={disabled}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Plus className="h-6 w-6 text-white" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Hidden capture components - they handle their own modals */}
      <div className="hidden">
        {activeCapture === 'photo' && (
          <PhotoCaptureFloat
            marcheId={marcheId}
            onPhotoCaptured={onPhotoCaptured}
            pendingCount={pendingPhotosCount}
            disabled={disabled}
          />
        )}
        {activeCapture === 'audio' && (
          <AudioCaptureFloat
            marcheId={marcheId}
            onAudioUploaded={onAudioUploaded}
          />
        )}
        {activeCapture === 'text' && (
          <TexteCaptureFloat marcheId={marcheId} />
        )}
      </div>

      {/* Custom sheets for each capture type */}
      <Sheet open={activeCapture === 'photo'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Capturer une photo</SheetTitle>
            <SheetDescription>
              Utilisez l'appareil photo ou sélectionnez une image depuis votre galerie
            </SheetDescription>
          </SheetHeader>
          {activeCapture === 'photo' && (
            <div className="mt-4">
              <PhotoCaptureFloat
                marcheId={marcheId}
                onPhotoCaptured={(photo) => {
                  onPhotoCaptured?.(photo);
                  handleClose();
                }}
                pendingCount={pendingPhotosCount}
                disabled={disabled}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={activeCapture === 'audio'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Enregistrer un audio</SheetTitle>
            <SheetDescription>
              Enregistrez des sons ambiants ou des commentaires vocaux
            </SheetDescription>
          </SheetHeader>
          {activeCapture === 'audio' && (
            <div className="mt-4">
              <AudioCaptureFloat
                marcheId={marcheId}
                onAudioUploaded={() => {
                  onAudioUploaded?.();
                  handleClose();
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={activeCapture === 'text'} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Ajouter un texte</SheetTitle>
            <SheetDescription>
              Créez des textes littéraires, poétiques ou descriptifs
            </SheetDescription>
          </SheetHeader>
          {activeCapture === 'text' && (
            <div className="mt-4">
              <TexteCaptureFloat marcheId={marcheId} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MediaCaptureFloat;