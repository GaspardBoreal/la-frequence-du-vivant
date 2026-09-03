import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ACCEPTED_TRACK_EXTENSIONS } from '@/lib/geo/parseTrackFile';

interface TrackDropzoneProps {
  onFile: (file: File) => void;
  isParsing?: boolean;
  error?: string | null;
  fileName?: string | null;
}

const TrackDropzone: React.FC<TrackDropzoneProps> = ({ onFile, isParsing, error, fileName }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`p-8 border-2 border-dashed transition-colors text-center ${
        dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TRACK_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />

      {isParsing ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Lecture du tracé…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <UploadCloud className="w-10 h-10 text-primary/70" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Déposez un fichier KML, KMZ ou GPX
            </p>
            <p className="text-xs text-muted-foreground">
              Lecture entièrement dans le navigateur — rien n'est écrit avant votre validation. 10 Mo maximum.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Choisir un fichier
          </Button>
          {fileName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {fileName}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </Card>
  );
};

export default TrackDropzone;
