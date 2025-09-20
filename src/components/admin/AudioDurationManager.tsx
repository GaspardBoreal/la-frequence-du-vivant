import React from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { recalculateDurationFromUrl } from '../../utils/audioDurationCalculator';

interface AudioDurationManagerProps {
  onRecalculationComplete?: () => void;
  marcheId?: string;
}

/**
 * Gestionnaire simplifié pour le recalcul des durées
 * Se contente d'afficher un bouton pour déclencher un recalcul manuel
 */
export const AudioDurationManager: React.FC<AudioDurationManagerProps> = ({
  onRecalculationComplete,
  marcheId
}) => {
  const [isRecalculating, setIsRecalculating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleManualRecalculation = async () => {
    if (!marcheId) {
      toast.error('ID de marche manquant');
      return;
    }

    setIsRecalculating(true);
    setProgress(0);
    
    try {
      // Récupérer tous les audios de cette marche
      const { data: audios, error } = await supabase
        .from('marche_audio')
        .select('id, url_supabase, duree_secondes')
        .eq('marche_id', marcheId);
      
      if (error) throw error;
      
      if (!audios || audios.length === 0) {
        toast.info('Aucun audio à recalculer');
        return;
      }

      let recalculatedCount = 0;
      let updatedCount = 0;
      
      // Recalculer chaque audio
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        setProgress(((i + 1) / audios.length) * 100);
        
        try {
          const result = await recalculateDurationFromUrl(audio.url_supabase);
          
          if (result.duration && result.duration !== audio.duree_secondes) {
            // Mettre à jour la durée si elle a changé
            const { error: updateError } = await supabase
              .from('marche_audio')
              .update({ 
                duree_secondes: Math.round(result.duration),
                metadata: { 
                  duration_recalculated_at: new Date().toISOString(),
                  duration_method: result.method,
                  duration_confidence: result.confidence
                }
              })
              .eq('id', audio.id);
            
            if (!updateError) updatedCount++;
          }
          
          recalculatedCount++;
          
        } catch (audioError) {
          console.warn(`Erreur recalcul audio ${audio.id}:`, audioError);
        }
      }
      
      if (updatedCount > 0) {
        toast.success(`${updatedCount} durées mises à jour sur ${recalculatedCount} traitées`);
      } else {
        toast.info(`${recalculatedCount} audios vérifiés - Durées déjà correctes`);
      }
      
      if (onRecalculationComplete) {
        onRecalculationComplete();
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du recalcul:', error);
      toast.error('Erreur lors du recalcul des durées');
    } finally {
      setIsRecalculating(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualRecalculation}
        disabled={isRecalculating}
        className="gap-2"
      >
        {isRecalculating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isRecalculating ? 'Recalcul...' : 'Recalculer durées'}
      </Button>
      
      {isRecalculating && (
        <div className="flex items-center gap-2">
          <Progress value={progress} className="w-16 h-2" />
          <span className="text-xs text-muted-foreground">
            {progress > 0 ? `${Math.round(progress)}%` : 'En cours...'}
          </span>
        </div>
      )}
    </div>
  );
};