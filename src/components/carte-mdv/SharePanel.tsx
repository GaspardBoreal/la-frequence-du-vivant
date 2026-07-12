import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Share2, Copy, Check, Mail, MessageCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

const SharePanel: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const title = 'Découvrez la carte des Marches du Vivant';
  const text = 'La carte vivante des marches en France : biodiversité, poésie, territoires. Rejoignez une marche près de chez vous.';

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title, text, url }); } catch { /* cancelled */ }
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!(navigator as any).share;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Partager</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-1">
        <p className="text-xs text-muted-foreground px-1 pb-1">Partagez cette vue (filtres inclus)</p>
        {canNativeShare && (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={nativeShare}>
            <Share2 className="h-4 w-4" /> Partager…
          </Button>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={copy}>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copié' : 'Copier le lien'}
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
          <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`}>
            <Mail className="h-4 w-4" /> Email
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default SharePanel;
