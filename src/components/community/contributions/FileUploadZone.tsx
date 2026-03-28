import React, { useRef, useState } from 'react';
import { Upload, Globe, Lock, Loader2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [isPublic, setIsPublic] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onFilesSelected(Array.from(files), isPublic);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />
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
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
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

      <div className="flex justify-center">
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
      </div>
    </div>
  );
};

export default FileUploadZone;
