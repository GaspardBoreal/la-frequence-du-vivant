import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  Info, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Waves,
  Thermometer,
  Beaker
} from 'lucide-react';

interface ContexteMetricProps {
  title: string;
  data: any;
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
  metricType: 'text' | 'numeric' | 'quality' | 'temperature' | 'ph' | 'flow';
  unit?: string;
  className?: string;
}

export const ContexteMetricCard: React.FC<ContexteMetricProps> = ({
  title,
  data,
  icon,
  variant,
  metricType,
  unit = '',
  className = ''
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30',
          text: 'text-primary',
          hover: 'hover:from-primary/30 hover:to-primary/10',
          badge: 'bg-primary/10 text-primary'
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-success/20 to-success/5 border-success/30',
          text: 'text-success',
          hover: 'hover:from-success/30 hover:to-success/10',
          badge: 'bg-success/10 text-success'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30',
          text: 'text-warning',
          hover: 'hover:from-warning/30 hover:to-warning/10',
          badge: 'bg-warning/10 text-warning'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-info/20 to-info/5 border-info/30',
          text: 'text-info',
          hover: 'hover:from-info/30 hover:to-info/10',
          badge: 'bg-info/10 text-info'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-muted/20 to-muted/5 border-border/30',
          text: 'text-muted-foreground',
          hover: 'hover:from-muted/30 hover:to-muted/10',
          badge: 'bg-muted/10 text-muted-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (metricType) {
      case 'numeric':
        return `${parseFloat(value).toFixed(1)}${unit}`;
      case 'temperature':
        return `${parseFloat(value).toFixed(1)}°C`;
      case 'ph':
        const phVal = parseFloat(value);
        return `pH ${phVal.toFixed(2)}`;
      case 'quality':
        return getQualityBadge(value);
      case 'flow':
        return `${parseFloat(value).toFixed(2)} m³/s`;
      default:
        return String(value);
    }
  };

  const getQualityBadge = (quality: string) => {
    const qualityLower = String(quality).toLowerCase();
    if (qualityLower.includes('excellent') || qualityLower.includes('très bon')) {
      return <Badge className="bg-success/20 text-success border-success/30">Excellent</Badge>;
    }
    if (qualityLower.includes('bon') || qualityLower.includes('satisfaisant')) {
      return <Badge className="bg-info/20 text-info border-info/30">Bon</Badge>;
    }
    if (qualityLower.includes('moyen') || qualityLower.includes('passable')) {
      return <Badge className="bg-warning/20 text-warning border-warning/30">Moyen</Badge>;
    }
    if (qualityLower.includes('mauvais') || qualityLower.includes('dégradé')) {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Mauvais</Badge>;
    }
    return <Badge variant="outline">{quality}</Badge>;
  };

  const getMetricIcon = () => {
    switch (metricType) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'ph':
        return <Beaker className="w-4 h-4" />;
      case 'flow':
        return <Waves className="w-4 h-4" />;
      case 'quality':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return icon;
    }
  };

  const getStatusIndicator = () => {
    if (!data) return <XCircle className="w-5 h-5 text-muted-foreground" />;
    
    if (metricType === 'quality') {
      const qualityLower = String(data).toLowerCase();
      if (qualityLower.includes('excellent') || qualityLower.includes('très bon')) {
        return <CheckCircle className="w-5 h-5 text-success" />;
      }
      if (qualityLower.includes('bon')) {
        return <CheckCircle className="w-5 h-5 text-info" />;
      }
      if (qualityLower.includes('moyen')) {
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      }
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getProgressValue = () => {
    if (metricType === 'ph' && data) {
      const phVal = parseFloat(data);
      return Math.min(100, Math.max(0, ((phVal - 6) / 2) * 100)); // pH 6-8 = 0-100%
    }
    if (metricType === 'temperature' && data) {
      const tempVal = parseFloat(data);
      return Math.min(100, Math.max(0, (tempVal / 30) * 100)); // 0-30°C = 0-100%
    }
    return data ? 75 : 0; // Default progress for available data
  };

  if (!data) {
    return (
      <Card className={`${styles.bg} ${styles.hover} border-dashed opacity-50 transition-all duration-300 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full bg-muted/20 ${styles.text}`}>
              {getMetricIcon()}
            </div>
            <div>
              <h4 className="font-medium text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1">Donnée non disponible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`${styles.bg} ${styles.hover} border transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:scale-105 cursor-pointer group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${styles.text} bg-background/50 backdrop-blur-sm transition-transform duration-300 ${isHovered ? 'rotate-6 scale-110' : ''}`}>
              {getMetricIcon()}
            </div>
            <div>
              <span className="text-sm font-medium">{title}</span>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIndicator()}
                {metricType === 'quality' ? (
                  formatValue(data)
                ) : (
                  <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                    {formatValue(data)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetail(true)}
            className={`opacity-0 group-hover:opacity-100 transition-all duration-300 ${styles.text} hover:bg-background/20`}
          >
            <Info className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de progression animée */}
        {(metricType === 'ph' || metricType === 'temperature' || metricType === 'numeric') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Niveau</span>
              <span className={styles.text}>{getProgressValue().toFixed(0)}%</span>
            </div>
            <Progress 
              value={isHovered ? getProgressValue() : 0}
              className="h-2 bg-background/50"
            />
          </div>
        )}

        {/* Indicateur de tendance */}
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className={`w-3 h-3 ${styles.text}`} />
          <span className="text-muted-foreground">
            {data ? 'Données disponibles' : 'Collecte en cours'}
          </span>
        </div>

        {/* Action rapide */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-between text-xs ${styles.text} hover:bg-background/20 transition-all duration-300`}
            >
              Voir les détails
              <ChevronRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-3 ${styles.text}`}>
                {getMetricIcon()}
                {title}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-96 pr-4">
              <div className="space-y-6">
                {/* Valeur principale */}
                <div className={`text-center p-6 rounded-lg ${styles.bg}`}>
                  <div className={`text-3xl font-bold ${styles.text} mb-2`}>
                    {formatValue(data)}
                  </div>
                  <p className="text-sm text-muted-foreground">Valeur mesurée</p>
                </div>

                {/* Détails techniques */}
                <div className="space-y-4">
                  <h4 className="font-medium">Informations détaillées</h4>
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
                    </pre>
                  </div>
                </div>

                {/* Interprétation */}
                {metricType === 'ph' && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Interprétation</h4>
                    <p className="text-sm text-muted-foreground">
                      {parseFloat(data) < 7 ? 'Eau acide' : parseFloat(data) > 7 ? 'Eau basique' : 'Eau neutre'}
                    </p>
                  </div>
                )}

                {metricType === 'temperature' && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Contexte thermique</h4>
                    <p className="text-sm text-muted-foreground">
                      {parseFloat(data) < 15 ? 'Eau froide' : parseFloat(data) < 25 ? 'Température modérée' : 'Eau chaude'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};