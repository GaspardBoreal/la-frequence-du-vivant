import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image as ImageIcon, Link, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface CoverEditorProps {
  coverImageUrl?: string;
  explorationCoverUrl?: string;
  onCoverChange: (url: string | undefined) => void;
}

type CoverSource = 'none' | 'exploration' | 'custom' | 'url';

const CoverEditor: React.FC<CoverEditorProps> = ({
  coverImageUrl,
  explorationCoverUrl,
  onCoverChange,
}) => {
  const [source, setSource] = useState<CoverSource>(
    coverImageUrl 
      ? (coverImageUrl === explorationCoverUrl ? 'exploration' : 'custom')
      : explorationCoverUrl ? 'exploration' : 'none'
  );
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSourceChange = (newSource: CoverSource) => {
    setSource(newSource);
    
    switch (newSource) {
      case 'none':
        onCoverChange(undefined);
        break;
      case 'exploration':
        onCoverChange(explorationCoverUrl);
        break;
      case 'custom':
        // Keep current if already custom, otherwise wait for upload
        if (!coverImageUrl || coverImageUrl === explorationCoverUrl) {
          onCoverChange(undefined);
        }
        break;
      case 'url':
        // Wait for URL input
        break;
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onCoverChange(urlInput.trim());
      toast.success('URL de couverture mise à jour');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    try {
      // Compress image if needed
      let processedFile = file;
      if (file.size > 1024 * 1024) { // > 1MB
        processedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `epub-cover-${Date.now()}.${fileExt}`;
      const filePath = `epub-covers/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('marche-photos')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('marche-photos')
        .getPublicUrl(filePath);

      onCoverChange(urlData.publicUrl);
      toast.success('Image de couverture téléchargée');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCover = () => {
    setSource('none');
    onCoverChange(undefined);
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Image de couverture</Label>
      
      <RadioGroup 
        value={source} 
        onValueChange={(value) => handleSourceChange(value as CoverSource)}
        className="grid gap-2"
      >
        {/* No cover option */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="cover-none" />
          <Label htmlFor="cover-none" className="text-sm font-normal cursor-pointer">
            Aucune couverture
          </Label>
        </div>

        {/* Use exploration cover */}
        {explorationCoverUrl && (
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="exploration" id="cover-exploration" />
            <Label htmlFor="cover-exploration" className="text-sm font-normal cursor-pointer flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Utiliser l'image de l'exploration
            </Label>
          </div>
        )}

        {/* Custom upload */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="cover-custom" />
          <Label htmlFor="cover-custom" className="text-sm font-normal cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Télécharger une image
          </Label>
        </div>

        {/* URL option */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" id="cover-url" />
          <Label htmlFor="cover-url" className="text-sm font-normal cursor-pointer flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL externe
          </Label>
        </div>
      </RadioGroup>

      {/* Custom upload UI */}
      {source === 'custom' && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir une image
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              JPG, PNG ou WebP • Max 5 Mo • Recommandé: 1600×2400px
            </p>
          </CardContent>
        </Card>
      )}

      {/* URL input UI */}
      {source === 'url' && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://exemple.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
            Appliquer
          </Button>
        </div>
      )}

      {/* Preview */}
      {coverImageUrl && (
        <Card className="overflow-hidden">
          <div className="relative aspect-[2/3] max-h-48 bg-muted">
            <img
              src={coverImageUrl}
              alt="Aperçu couverture"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemoveCover}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CoverEditor;
