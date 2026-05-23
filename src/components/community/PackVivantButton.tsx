import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Level = 'public' | 'walker' | 'organizer';

interface PackVivantButtonProps {
  explorationId: string;
  level?: Level;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  label?: string;
}

const LEVEL_COPY: Record<Level, { idle: string; running: string; success: string }> = {
  public: {
    idle: 'Télécharger le rapport',
    running: 'Composition de votre rapport…',
    success: 'Rapport prêt — téléchargement en cours',
  },
  walker: {
    idle: 'Mon Pack Vivant',
    running: 'Composition de votre Pack Vivant…',
    success: 'Pack Vivant prêt — téléchargement en cours',
  },
  organizer: {
    idle: 'Pack Vivant complet',
    running: 'Génération du Pack complet…',
    success: 'Pack complet prêt — téléchargement en cours',
  },
};

/**
 * Universal Pack Vivant download button.
 * Calls the `generate-pack-vivant` edge function, retrieves a signed URL,
 * and triggers the browser download.
 */
const PackVivantButton: React.FC<PackVivantButtonProps> = ({
  explorationId,
  level = 'walker',
  variant = 'default',
  size = 'default',
  className,
  label,
}) => {
  const [loading, setLoading] = useState(false);
  const copy = LEVEL_COPY[level];

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading(copy.running, {
      description: 'Quelques secondes — espèces, observations, GPS, photos…',
    });
    try {
      const { data, error } = await supabase.functions.invoke('generate-pack-vivant', {
        body: { exploration_id: explorationId, level },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Aucune URL retournée');

      toast.success(copy.success, {
        id: toastId,
        description: `${data.species_count} espèces · ${data.observation_count} observations`,
      });

      // Trigger download
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename || 'pack-vivant.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      console.error('[PackVivantButton]', e);
      toast.error('Impossible de générer le Pack Vivant', {
        id: toastId,
        description: e?.message || 'Réessayez dans un instant.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : level === 'organizer' ? (
        <Sparkles className="w-4 h-4 mr-2" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {label || copy.idle}
    </Button>
  );
};

export default PackVivantButton;
