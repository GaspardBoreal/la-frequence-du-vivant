import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  proprieteId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  label?: string;
}

/** Télécharge le Pack Vivant consolidé de tous les événements rattachés à une propriété. */
const PackVivantProprieteButton: React.FC<Props> = ({ proprieteId, variant = 'default', size = 'sm', className, label }) => {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (loading) return;
    setLoading(true);
    const id = toast.loading('Composition du Pack Vivant de la propriété…', {
      description: 'Tous les événements rattachés, doublons repérés.',
    });
    try {
      const { data, error } = await supabase.functions.invoke('generate-pack-vivant-propriete', {
        body: { propriete_id: proprieteId },
      });
      if (error) throw error;
      if (!data?.url) throw new Error(data?.error || 'Aucun fichier retourné');
      toast.success('Pack Vivant prêt — téléchargement en cours', {
        id,
        description: `${data.events} événement(s) · ${data.species_count} espèces · ${data.clean_count} observations (${data.raw_count - data.clean_count} doublons retirés)`,
      });
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.filename || 'pack-vivant-propriete.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      console.error('[PackVivantPropriete]', e);
      toast.error("Impossible de générer l'export", { id, description: e?.message || 'Réessayez dans un instant.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={run} disabled={loading} variant={variant} size={size} className={className}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {label || 'Exporter la biodiversité'}
    </Button>
  );
};

export default PackVivantProprieteButton;
