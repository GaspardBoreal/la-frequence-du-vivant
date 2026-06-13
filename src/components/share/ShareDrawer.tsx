import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Copy, Film, Calendar, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
}

/**
 * Coquille du Partage évolutif.
 * Aujourd'hui : onglet « Lien » fonctionnel.
 * Demain : on branchera les générateurs de reels dynamiques dans les onglets
 * « Cette semaine », « Ce mois-ci », « Par département » sans toucher au reste.
 */
const ShareDrawer: React.FC<ShareDrawerProps> = ({ open, onOpenChange, url, title }) => {
  const [dept, setDept] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Partager La Fréquence du Vivant
          </SheetTitle>
          <SheetDescription>
            Partagez la page ou bientôt un reel dynamique sur les collectes de données.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="link" className="mt-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="link" className="text-xs"><LinkIcon className="w-3 h-3 mr-1" />Lien</TabsTrigger>
            <TabsTrigger value="week" className="text-xs"><Film className="w-3 h-3 mr-1" />Semaine</TabsTrigger>
            <TabsTrigger value="month" className="text-xs"><Calendar className="w-3 h-3 mr-1" />Mois</TabsTrigger>
            <TabsTrigger value="dept" className="text-xs"><MapPin className="w-3 h-3 mr-1" />Dept.</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 pt-4">
            {title && <p className="text-sm font-medium text-foreground">{title}</p>}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground break-all">
              {url}
            </div>
            <Button onClick={copy} className="w-full"><Copy className="w-4 h-4 mr-2" />Copier le lien</Button>
          </TabsContent>

          {(['week', 'month'] as const).map((k) => (
            <TabsContent key={k} value={k} className="pt-4">
              <div className="rounded-xl border border-dashed border-emerald-300/50 bg-emerald-50/40 p-6 text-center space-y-3">
                <Film className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-sm font-medium text-foreground">Reel data {k === 'week' ? 'de la semaine' : 'du mois'}</p>
                <p className="text-xs text-muted-foreground">
                  Bientôt : génération automatique d'un reel vidéo mettant en scène les collectes biodiversité {k === 'week' ? 'des 7 derniers jours' : 'des 30 derniers jours'}.
                </p>
                <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  En préparation
                </span>
              </div>
            </TabsContent>
          ))}

          <TabsContent value="dept" className="pt-4 space-y-3">
            <div className="rounded-xl border border-dashed border-emerald-300/50 bg-emerald-50/40 p-6 text-center space-y-3">
              <MapPin className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-sm font-medium text-foreground">Reel par département</p>
              <input
                type="text"
                placeholder="Ex : 16, 24, 33..."
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-center"
              />
              <p className="text-xs text-muted-foreground">
                Bientôt : reel sur mesure pour un département choisi.
              </p>
              <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                En préparation
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ShareDrawer;
