import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe2, Copy, ExternalLink, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useToggleEventPublic, buildPublicEventUrl } from '@/hooks/usePublicEvent';
import { cn } from '@/lib/utils';

interface Props {
  eventId: string;
  isPublic: boolean;
  publicSlug: string | null;
}

const PublishPublicPanel: React.FC<Props> = ({ eventId, isPublic, publicSlug }) => {
  const toggle = useToggleEventPublic(eventId);
  const [copied, setCopied] = useState(false);
  const url = publicSlug ? buildPublicEventUrl(publicSlug) : null;

  const handleToggle = async (next: boolean) => {
    try {
      const res = await toggle.mutateAsync(next);
      toast.success(next ? 'Marche publiée publiquement' : 'Publication désactivée');
      if (next && res.public_slug) {
        navigator.clipboard?.writeText(buildPublicEventUrl(res.public_slug)).catch(() => {});
      }
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors du basculement');
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Lien copié');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        isPublic
          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-amber-500/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
          : 'border-dashed'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', isPublic ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground')}>
          <Globe2 className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">
                {isPublic ? 'Page publique active' : 'Publication publique'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic
                  ? 'Toute personne disposant du lien peut consulter cette marche en lecture seule.'
                  : 'Activez pour rendre cette marche partageable via une URL publique (lecture seule).'}
              </p>
            </div>
            <Switch checked={isPublic} disabled={toggle.isPending} onCheckedChange={handleToggle} />
          </div>

          {isPublic && url && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input value={url} readOnly className="font-mono text-xs h-9" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(url, '_blank')} className="shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(url + '?utm_source=share&utm_medium=whatsapp')}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                >
                  <Share2 className="h-3 w-3" /> WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url + '?utm_source=share&utm_medium=facebook')}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                >
                  <Share2 className="h-3 w-3" /> Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url + '?utm_source=share&utm_medium=linkedin')}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-500 hover:bg-sky-500/20"
                >
                  <Share2 className="h-3 w-3" /> LinkedIn
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url + '?utm_source=share&utm_medium=twitter')}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
                >
                  <Share2 className="h-3 w-3" /> X / Twitter
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent('Découvre cette marche du vivant')}&body=${encodeURIComponent(url + '?utm_source=share&utm_medium=email')}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-foreground hover:bg-muted/70"
                >
                  <Share2 className="h-3 w-3" /> Email
                </a>
              </div>

              <PublicEventMetricsPanel eventId={eventId} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PublishPublicPanel;
