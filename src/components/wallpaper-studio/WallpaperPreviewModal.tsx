import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Share2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { renderWallpaper, canvasToBlob, downloadBlob, type Theme } from './renderer/wallpaperCanvas';
import type { PickedPhoto, EventSnapshot } from './renderer/photoPicker';
import InstallTutorialDialog from './InstallTutorialDialog';

interface Proposal {
  seed: number;
  previewUrl: string;
  photos: PickedPhoto[];
  event: EventSnapshot | null;
  theme: Theme;
  category: string;
  ambiance: string;
}

const RESOLUTIONS: { id: string; label: string; w: number; h: number; icon: React.ElementType }[] = [
  { id: '1920x1080', label: 'Full HD 16:9', w: 1920, h: 1080, icon: Monitor },
  { id: '2560x1440', label: '2K 16:9', w: 2560, h: 1440, icon: Monitor },
  { id: '3840x2160', label: '4K UHD 16:9', w: 3840, h: 2160, icon: Monitor },
  { id: '3440x1440', label: 'Ultra-wide 21:9', w: 3440, h: 1440, icon: Monitor },
  { id: '1170x2532', label: 'Mobile 9:19.5', w: 1170, h: 2532, icon: Smartphone },
  { id: '2048x1536', label: 'Tablette 4:3', w: 2048, h: 1536, icon: Tablet },
];

const WallpaperPreviewModal: React.FC<{ open: boolean; onClose: () => void; proposal: Proposal }> = ({
  open, onClose, proposal,
}) => {
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [downloading, setDownloading] = useState(false);
  const [showTuto, setShowTuto] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const hasSource = proposal.photos.length > 0;

  useEffect(() => {
    // Save to DB on open (once)
    if (!open || savedId || !hasSource) return;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase.from('wallpaper_generations').insert({
          user_id: userData?.user?.id ?? null,
          theme: proposal.theme,
          scope: proposal.event ? 'event' : 'all',
          event_id: proposal.event?.id ?? null,
          category: proposal.category,
          ambiance: proposal.ambiance,
          photo_urls: proposal.photos.map((p) => p.url),
          species_names: proposal.photos.map((p) => p.scientificName).filter(Boolean) as string[],
          resolution: resolution.id,
          preview_url: proposal.previewUrl,
          is_public: true,
          event_name_snapshot: proposal.event?.title ?? null,
          event_date_snapshot: proposal.event?.date ?? null,
          event_commune_snapshot: proposal.event?.commune ?? null,
          event_gps_snapshot: proposal.event ? { lat: proposal.event.lat, lng: proposal.event.lng } : null,
        }).select('id').maybeSingle();
        if (!error && data?.id) setSavedId(data.id);
      } catch {}
    })();
  }, [open]); // eslint-disable-line

  async function handleDownload() {
    if (!hasSource) return;
    setDownloading(true);
    try {
      const qrTarget = proposal.event?.slug
        ? `https://la-frequence-du-vivant.com/m/${proposal.event.slug}`
        : proposal.theme === 'frequence'
        ? 'https://la-frequence-du-vivant.com'
        : 'https://la-frequence-du-vivant.com/marches-du-vivant';
      const canvas = await renderWallpaper({
        width: resolution.w,
        height: resolution.h,
        theme: proposal.theme,
        photos: proposal.photos,
        event: proposal.event,
        category: proposal.category,
        ambiance: proposal.ambiance,
        qrTarget,
        seed: proposal.seed,
      });
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.93);
      const label = proposal.theme === 'frequence' ? 'frequence-du-vivant' : 'marches-du-vivant';
      const evt = proposal.event?.title ? `-${proposal.event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '';
      downloadBlob(blob, `${label}${evt}-${resolution.id}.jpg`);
      if (savedId) {
        try { await supabase.rpc('increment_wallpaper_download', { wp_id: savedId }); } catch {}
      }
      setShowTuto(true);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare(target: 'linkedin' | 'whatsapp' | 'twitter') {
    const url = 'https://la-frequence-du-vivant.com/materiel-pedagogique#studio-fonds-ecran';
    const text = proposal.theme === 'frequence'
      ? 'J\'ai créé mon fond d\'écran avec La Fréquence du Vivant 🌿'
      : 'Mon fond d\'écran des Marches du Vivant 🌿';
    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };
    window.open(shareUrls[target], '_blank', 'noopener,noreferrer');
    if (savedId) {
      try { await supabase.rpc('increment_wallpaper_share', { wp_id: savedId }); } catch {}
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-crimson text-2xl">Ton fond d'écran vivant</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="rounded-xl overflow-hidden bg-black/40 border border-border/30">
              <img src={proposal.previewUrl} alt="Aperçu" className="w-full h-auto" />
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Résolution</div>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {RESOLUTIONS.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setResolution(r)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          resolution.id === r.id ? 'border-amber-500 bg-amber-500/10' : 'border-border/40 hover:bg-card/40'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <div className="text-sm font-medium">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.w} × {r.h}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleDownload}
                disabled={downloading || !hasSource}
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-700 to-amber-500 text-white"
              >
                {downloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Télécharger .jpg
              </Button>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Partager</div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                    <Share2 className="w-4 h-4 mr-1" /> LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('whatsapp')}>
                    <Share2 className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                    <Share2 className="w-4 h-4 mr-1" /> X
                  </Button>
                </div>
              </div>

              {!hasSource && (
                <div className="text-xs text-muted-foreground italic">
                  Fond ouvert depuis la galerie — pour le régénérer en haute résolution, relance une composition depuis le Studio.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InstallTutorialDialog open={showTuto} onClose={() => setShowTuto(false)} />
    </>
  );
};

export default WallpaperPreviewModal;
