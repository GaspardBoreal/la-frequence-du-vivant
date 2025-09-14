import React, { useState, useRef } from 'react';
import { Button } from '../../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import { Camera, Image, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { processPhoto, ProcessedPhoto } from '../../../utils/photoUtils';

interface PhotoCaptureFloatProps {
  marcheId: string;
  onPhotoCaptured: (photo: ProcessedPhoto) => void;
  disabled?: boolean;
}

const PhotoCaptureFloat: React.FC<PhotoCaptureFloatProps> = ({
  marcheId,
  onPhotoCaptured,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
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
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `photo-marche-${timestamp}.jpg`, { type: 'image/jpeg' });
          
          try {
            const processedPhoto = await processPhoto(file);
            onPhotoCaptured(processedPhoto);
            toast.success('📷 Photo capturée !');
            stopCamera();
            setIsOpen(false);
          } catch (error) {
            console.error('Erreur traitement photo:', error);
            toast.error('Erreur lors du traitement de la photo');
          }
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const processedPhoto = await processPhoto(file);
      onPhotoCaptured(processedPhoto);
      toast.success('🖼️ Photo importée !');
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur import photo:', error);
      toast.error('Erreur lors de l\'import de la photo');
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl animate-pulse hover:animate-none bg-primary hover:bg-primary/90"
            disabled={disabled}
          >
            <Camera className="w-8 h-8" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>📸 Capturer une photo</SheetTitle>
            <SheetDescription>
              Prenez une photo ou importez-en une depuis votre galerie
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-full mt-6">
            {!isCapturing ? (
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={startCamera}
                  className="h-16 text-lg"
                  variant="default"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Prendre une photo
                </Button>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 text-lg"
                  variant="outline"
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
                <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <Button
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-black" />
                    </Button>
                    
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      className="w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <X className="w-6 h-6" />
                    </Button>
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