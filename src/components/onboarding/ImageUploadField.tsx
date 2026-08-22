import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Link2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadGalleryImage } from '@/lib/onboarding/uploadGalleryImage';

interface ImageUploadFieldProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  /** Construit le chemin de stockage à partir de l'extension retenue. */
  buildPath: (ext: string) => string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, value, onChange, buildPath }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const url = await uploadGalleryImage(file, buildPath);
      onChange(url);
      toast.success('Image téléversée');
    } catch (e: any) {
      toast.error(e?.message || 'Téléversement impossible');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>

      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
            {busy ? 'Téléversement…' : 'Téléverser une image'}
          </Button>

          {value && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange('')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Retirer
            </Button>
          )}

          <Button type="button" variant="ghost" size="sm" onClick={() => setShowUrl((v) => !v)}>
            <Link2 className="mr-2 h-4 w-4" />
            ou coller une URL
          </Button>

          <p className="w-full text-xs text-muted-foreground">JPG, PNG, WebP ou HEIC — 5 Mo max, réduit à 1600 px.</p>
        </div>
      </div>

      {(showUrl || (value && !value.startsWith('http'))) && (
        <Input
          className="mt-3"
          placeholder="https://…"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
    </div>
  );
};

export default ImageUploadField;
