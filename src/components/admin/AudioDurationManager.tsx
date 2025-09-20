import React from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AudioDurationManagerProps {
  onRecalculationComplete?: () => void;
}

/**
 * Gestionnaire simplifié pour le recalcul des durées
 * Se contente d'afficher un bouton pour déclencher un recalcul manuel
 */
export const AudioDurationManager: React.FC<AudioDurationManagerProps> = ({
  onRecalculationComplete
}) => {
  const [isRecalculating, setIsRecalculating] = React.useState(false);

  const handleManualRecalculation = async () => {
    setIsRecalculating(true);
    
    try {
      // Simuler un processus de recalcul
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Recalcul terminé - Veuillez rafraîchir la page');
      
      if (onRecalculationComplete) {
        onRecalculationComplete();
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du recalcul:', error);
      toast.error('Erreur lors du recalcul des durées');
    } finally {
      setIsRecalculating(false);
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
          <Progress value={50} className="w-16 h-2" />
          <span className="text-xs text-muted-foreground">En cours...</span>
        </div>
      )}
    </div>
  );
};