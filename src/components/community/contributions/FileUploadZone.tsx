import React, { useRef, useState } from 'react';
import { Upload, Globe, Lock, Loader2, X, Plus, Camera, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FileUploadZoneProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[], isPublic: boolean) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  label: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

const isImageAccept = (accept: string) =>
  accept.includes('image') || accept === '*' || accept.includes('*/*');

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  accept,
  multiple = true,
  onFilesSelected,
  isUploading = false,
  label,
  icon,
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null, source: 'picker' | 'camera' = 'picker') => {
    if (!files?.length) return;
    onFilesSelected(Array.from(files), isPublic);
    if (source === 'picker' && inputRef.current) inputRef.current.value = '';
    if (source === 'camera' && cameraRef.current) cameraRef.current.value = '';
  };

  const showCamera = isImageAccept(accept);

  const GpsHint = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] text-amber-300/70 hover:text-amber-200 transition-colors"
          title="Conseil GPS iPhone"
        >
          <Info className="w-3 h-3" />
          GPS iPhone ?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-xs leading-relaxed">
        <p className="font-medium mb-1">Pas de GPS sur tes photos iPhone&nbsp;?</p>
        <p className="text-muted-foreground mb-2">
          iOS supprime souvent les coordonnées quand tu choisis une photo depuis
          <em> Photothèque</em>. Pour conserver le GPS&nbsp;:
        </p>
        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
          <li>Utilise <strong>«&nbsp;Prendre une photo&nbsp;»</strong> pour shooter directement (le plus fiable).</li>
          <li>Ou ouvre la photo dans Photos → <strong>Partager → Enregistrer dans Fichiers</strong>, puis remonte-la depuis l'app Fichiers.</li>
          <li>Vérifie&nbsp;: Réglages iOS → Confidentialité → Service de localisation → <strong>Appareil photo</strong> sur «&nbsp;Lors de l'utilisation&nbsp;» avec position précise.</li>
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Sinon, on te proposera d'utiliser la position de ton téléphone à l'upload.
        </p>
      </PopoverContent>
    </Popover>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => handleFiles(e.target.files, 'picker')}
          className="hidden"
        />
        {showCamera && (
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            // capture trigger native camera on mobile; ignored on desktop
            // @ts-expect-error capture is a valid HTML attr
            capture="environment"
            onChange={e => handleFiles(e.target.files, 'camera')}
            className="hidden"
          />
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="h-8 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs gap-1.5"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {label}
        </Button>
        {showCamera && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => cameraRef.current?.click()}
            disabled={isUploading}
            className="h-8 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs gap-1.5"
            title="Prendre une photo (conserve le GPS)"
          >
            <Camera className="w-3.5 h-3.5" />
            Photo
          </Button>
        )}
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] transition-colors",
            isPublic ? "bg-blue-500/20 text-blue-300" : "bg-white/5 text-white/40"
          )}
          title={isPublic ? 'Visible par tous' : 'Privé (vous seul)'}
        >
          {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isPublic ? 'Public' : 'Privé'}
        </button>
        {showCamera && GpsHint}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={e => handleFiles(e.target.files, 'picker')}
        className="hidden"
      />
      {showCamera && (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          // @ts-expect-error capture is a valid HTML attr
          capture="environment"
          onChange={e => handleFiles(e.target.files, 'camera')}
          className="hidden"
        />
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files, 'picker'); }}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
          dragOver ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 hover:border-emerald-500/30 hover:bg-white/5",
          isUploading && "opacity-50 cursor-wait"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-emerald-300 text-xs">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {icon || <Upload className="w-6 h-6 text-emerald-400/60" />}
            <p className="text-emerald-200/60 text-xs">{label}</p>
            <p className="text-emerald-200/30 text-[10px]">Glissez-déposez ou cliquez</p>
          </div>
        )}
      </div>

      {showCamera && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
            disabled={isUploading}
            className="h-8 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs gap-1.5"
            title="Prendre une photo (conserve le GPS)"
          >
            <Camera className="w-3.5 h-3.5" />
            Prendre une photo
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors",
            isPublic ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-white/40 border border-white/10"
          )}
        >
          {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isPublic ? 'Visible par les marcheurs' : 'Privé — vous seul'}
        </button>
        {showCamera && GpsHint}
      </div>
    </div>
  );
};

export default FileUploadZone;
