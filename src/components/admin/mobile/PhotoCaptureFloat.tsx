import React, { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Camera, Image, Upload, X, Loader2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { toast } from 'sonner';
import { processPhoto, ProcessedPhoto } from '../../../utils/photoUtils';

// Offset constant pour éviter les barres système mobiles
const CONTROL_OFFSET = 'clamp(96px, 14vh, 180px)';

interface PhotoCaptureFloatProps {
  marcheId: string;
  onPhotoCaptured: (photo: ProcessedPhoto) => void;
  disabled?: boolean;
  pendingCount?: number;
}

const PhotoCaptureFloat: React.FC<PhotoCaptureFloatProps> = ({
  marcheId,
  onPhotoCaptured,
  disabled = false,
  pendingCount = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      toast.success('📸 Caméra prête !');
    } catch (error) {
      console.error('Erreur caméra:', error);
      toast.error('Impossible d\'accéder à la caméra');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const simulateProgress = (callback: () => void) => {
    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          callback();
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (context) {
      context.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          setIsProcessing(true);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `photo-marche-${timestamp}.jpg`, { type: 'image/jpeg' });
          
          simulateProgress(async () => {
            try {
              const processedPhoto = await processPhoto(file);
              onPhotoCaptured(processedPhoto);
              toast.success('📷 Photo capturée et ajoutée !');
              stopCamera();
              setIsOpen(false);
            } catch (error) {
              console.error('Erreur traitement photo:', error);
              toast.error('Erreur lors du traitement de la photo');
            } finally {
              setIsProcessing(false);
              setProcessingProgress(0);
            }
          });
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    simulateProgress(async () => {
      try {
        const processedPhoto = await processPhoto(file);
        onPhotoCaptured(processedPhoto);
        toast.success('🖼️ Photo importée et ajoutée !');
        setIsOpen(false);
      } catch (error) {
        console.error('Erreur import photo:', error);
        toast.error('Erreur lors de l\'import de la photo');
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <div className="relative">
            <Button 
              className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl animate-pulse hover:animate-none bg-primary hover:bg-primary/90"
              disabled={disabled}
            >
              <Camera className="w-8 h-8" />
            </Button>
            {pendingCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 min-w-6 h-6 rounded-full bg-accent text-accent-foreground animate-bounce"
              >
                {pendingCount}
              </Badge>
            )}
          </div>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>📸 Capturer une photo</SheetTitle>
            <SheetDescription>
              Prenez une photo ou importez-en une depuis votre galerie
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-full mt-6">
            {isProcessing ? (
              <div className="space-y-6 py-8">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <h4 className="text-lg font-semibold">📸 Traitement en cours...</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Compression et optimisation de la photo
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              </div>
            ) : !isCapturing ? (
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={startCamera}
                  className="h-16 text-lg"
                  variant="default"
                  disabled={isProcessing}
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Prendre une photo
                </Button>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 text-lg"
                  variant="outline"
                  disabled={isProcessing}
                >
                  <Image className="w-6 h-6 mr-2" />
                  Choisir dans la galerie
                </Button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div 
                  className="relative flex-1 bg-black rounded-lg overflow-hidden"
                  style={{ 
                    paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${CONTROL_OFFSET} + 16px)` 
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Zone de contrôle repositionnée plus haut */}
                  <div 
                    className="absolute left-0 right-0 bg-black/50 backdrop-blur-sm p-4 rounded-t-xl z-20"
                    style={{ 
                      bottom: `calc(env(safe-area-inset-bottom, 0px) + ${CONTROL_OFFSET})` 
                    }}
                  >
                    <div className="flex justify-center gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          onClick={capturePhoto}
                          className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-100 shadow-lg border-2 border-white"
                          aria-label="Prendre la photo"
                        >
                          <div className="w-8 h-8 rounded-full border-2 border-black" />
                        </Button>
                        <span className="text-xs text-white font-medium">Capturer</span>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          onClick={stopCamera}
                          className="w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg border-2 border-red-300"
                          aria-label="Annuler la capture"
                        >
                          <X className="w-6 h-6" />
                        </Button>
                        <span className="text-xs text-white font-medium">Annuler</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default PhotoCaptureFloat;