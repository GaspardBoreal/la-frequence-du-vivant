import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Droplets, 
  Thermometer, 
  Activity, 
  Eye, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  TrendingUp,
  Waves,
  Beaker,
  Ruler,
  AlertCircle,
  Database,
  Gauge
} from 'lucide-react';
import { formatComplexData, getDataAvailability, ContexteMetricData } from '@/utils/contexteDataMapper';

interface ContexteMetricProps extends ContexteMetricData {
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ContexteMetricCard: React.FC<ContexteMetricProps> = ({
  title,
  data,
  icon: Icon,
  variant = 'default',
  metricType = 'description',
  unit,
  className = ''
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const availability = getDataAvailability(data);
  const formattedData = formatComplexData(data);
  
  // Debug log
  console.log(`ContexteMetricCard ${title}:`, { data, formattedData, availability });

  // Styles dynamiques basés sur la disponibilité des données
  const getVariantStyles = () => {
    const baseStyles = "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group cursor-pointer";
    
    switch (availability) {
      case 'available':
        return `${baseStyles} border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-emerald-500/20`;
      case 'partial':
        return `${baseStyles} border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-amber-500/20`;
      case 'missing':
        return `${baseStyles} border-red-500/40 bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-red-500/20`;
      default:
        return `${baseStyles} border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 shadow-primary/10`;
    }
  };

  const getQualityBadge = () => {
    switch (availability) {
      case 'available':
        return <Badge className="bg-success/20 text-success border-success/30">LIVE DATA</Badge>;
      case 'partial':
        return <Badge className="bg-warning/20 text-warning border-warning/30">PARTIEL</Badge>;
      case 'missing':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">MANQUANT</Badge>;
    }
  };

  const getMetricIcon = () => {
    if (Icon) return <Icon className="w-4 h-4" />;
    
    switch (metricType) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'ph':
        return <Beaker className="w-4 h-4" />;
      case 'flow':
        return <Waves className="w-4 h-4" />;
      case 'quality':
        return <Activity className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getStatusIndicator = () => {
    switch (availability) {
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'missing':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className={`${getVariantStyles()} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getMetricIcon()}
            <span className="text-sm font-semibold">{title}</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIndicator()}
            {getQualityBadge()}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Affichage immédiat de la donnée */}
          <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {Icon && <Icon className="w-4 h-4 text-primary/70" />}
                <h3 className="font-semibold text-sm text-foreground/90">{title}</h3>
              </div>
              {getQualityBadge()}
            </div>
            
            {/* Valeur principale avec animation */}
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary/90 group-hover:text-primary transition-colors">
                {formattedData}
                {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
              </div>
              
              {/* Indicateur de qualité visuel */}
              <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 group-hover:opacity-80 ${
                    availability === 'available' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                    availability === 'partial' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ 
                    width: availability === 'available' ? '100%' : 
                           availability === 'partial' ? '60%' : '20%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bouton pour voir les détails */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Voir les détails
                </span>
                <TrendingUp className="w-4 h-4" />
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {getMetricIcon()}
                  {title}
                  {getQualityBadge()}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Valeur principale */}
                <div className="text-center p-6 rounded-lg bg-primary/5 border">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {formattedData}
                    {unit && <span className="text-lg text-muted-foreground ml-2">{unit}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">Valeur actuelle</p>
                </div>

                {/* Détails bruts */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Données brutes</h4>
                  <div className="bg-muted/20 p-4 rounded-lg border">
                    <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">
                      {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
                    </pre>
                  </div>
                </div>

                {/* Interprétation contextuelle */}
                {metricType === 'ph' && data && (
                  <div className="space-y-2 p-4 bg-info/5 border border-info/20 rounded-lg">
                    <h4 className="font-semibold text-info">Interprétation pH</h4>
                    <p className="text-sm">
                      {parseFloat(data) < 6.5 ? '🔴 Eau acide - peut affecter la biodiversité' : 
                       parseFloat(data) > 8.5 ? '🔴 Eau basique - surveillance recommandée' : 
                       '🟢 pH optimal pour la vie aquatique'}
                    </p>
                  </div>
                )}

                {metricType === 'temperature' && data && (
                  <div className="space-y-2 p-4 bg-info/5 border border-info/20 rounded-lg">
                    <h4 className="font-semibold text-info">Contexte thermique</h4>
                    <p className="text-sm">
                      {parseFloat(data) < 10 ? '🔵 Eau froide - typique des sources de montagne' : 
                       parseFloat(data) > 25 ? '🔴 Eau chaude - possible pollution thermique' : 
                       '🟢 Température modérée et favorable'}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};