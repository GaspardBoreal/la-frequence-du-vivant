import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Monitor, Smartphone, Apple, Laptop } from 'lucide-react';

type OS = 'windows' | 'mac' | 'ios' | 'android';

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'mac';
  return 'windows';
}

const STEPS: Record<OS, { icon: React.ElementType; title: string; steps: string[] }> = {
  windows: {
    icon: Monitor,
    title: 'Windows',
    steps: [
      'Ouvre le dossier « Téléchargements »',
      'Clic droit sur l\'image téléchargée',
      'Choisis « Choisir comme arrière-plan du bureau »',
    ],
  },
  mac: {
    icon: Laptop,
    title: 'macOS',
    steps: [
      'Ouvre le fichier téléchargé dans Aperçu',
      'Menu Fichier › Définir comme fond d\'écran',
      'Ou : clic droit sur le bureau › Modifier le fond d\'écran',
    ],
  },
  ios: {
    icon: Apple,
    title: 'iPhone / iPad',
    steps: [
      'Ouvre l\'image téléchargée dans Photos',
      'Bouton Partager › « Utiliser en fond d\'écran »',
      'Ajuste et confirme',
    ],
  },
  android: {
    icon: Smartphone,
    title: 'Android',
    steps: [
      'Ouvre l\'image dans Galerie',
      'Menu ⋮ › « Définir comme fond d\'écran »',
      'Choisis l\'écran d\'accueil ou de verrouillage',
    ],
  },
};

const InstallTutorialDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const os = useMemo(() => detectOS(), []);
  const primary = STEPS[os];
  const others = (Object.keys(STEPS) as OS[]).filter((k) => k !== os);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-crimson text-2xl">Installer ton fond d'écran</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <PrimaryCard os={os} data={primary} />
          <div>
            <div className="text-sm text-muted-foreground mb-3">Autres appareils</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {others.map((k) => {
                const d = STEPS[k];
                const Icon = d.icon;
                return (
                  <details key={k} className="rounded-xl border border-border/40 bg-card/30 p-3">
                    <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium">
                      <Icon className="w-4 h-4" /> {d.title}
                    </summary>
                    <ol className="mt-2 text-xs text-muted-foreground list-decimal list-inside space-y-1">
                      {d.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PrimaryCard: React.FC<{ os: OS; data: typeof STEPS[OS] }> = ({ data }) => {
  const Icon = data.icon;
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-emerald-700/10 to-amber-500/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
          <Icon className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Détecté</div>
          <div className="font-crimson text-xl">{data.title}</div>
        </div>
      </div>
      <ol className="space-y-2">
        {data.steps.map((s, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-foreground pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default InstallTutorialDialog;
