import { useState } from 'react';
import { XenoCantoRecording } from '@/types/biodiversity';

interface MiniSpectrogramPreviewProps {
  recording: XenoCantoRecording;
  className?: string;
}

export const MiniSpectrogramPreview = ({ recording, className }: MiniSpectrogramPreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageError || !recording.sono?.small) {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-primary/5 rounded border-2 border-dashed border-primary/20 flex items-center justify-center ${className}`}>
        <div className="text-xs text-primary/60 font-medium">Audio</div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded border border-primary/20 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 animate-pulse" />
      )}
      <img
        src={recording.sono.small}
        alt={`Spectrogramme ${recording.fileName}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        style={{ opacity: isLoading ? 0 : 1 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
};