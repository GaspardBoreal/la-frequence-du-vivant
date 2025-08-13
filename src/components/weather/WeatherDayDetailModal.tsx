import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Thermometer, Droplets, Wind, Sun, Eye, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface WeatherDayDetailModalProps {
  date: Date;
  weather: any;
  isOpen: boolean;
  onClose: () => void;
}

const WeatherDayDetailModal: React.FC<WeatherDayDetailModalProps> = ({
  date,
  weather,
  isOpen,
  onClose
}) => {
  if (!weather) return null;

  const getWeatherDescription = () => {
    const conditions = [];
    
    if (weather.precipitation_total > 10) {
      conditions.push('Pluvieux');
    } else if (weather.precipitation_total > 0) {
      conditions.push('Légères précipitations');
    }
    
    if (weather.wind_speed_avg > 30) {
      conditions.push('Venteux');
    }
    
    if (weather.sunshine_hours > 10) {
      conditions.push('Ensoleillé');
    }
    
    if (weather.temperature_avg < 5) {
      conditions.push('Froid');
    } else if (weather.temperature_avg > 25) {
      conditions.push('Chaud');
    }
    
    return conditions.length > 0 ? conditions.join(', ') : 'Conditions normales';
  };

  const getComfortLevel = () => {
    const temp = weather.temperature_avg;
    const humidity = weather.humidity_avg;
    
    if (temp >= 18 && temp <= 24 && humidity >= 40 && humidity <= 60) {
      return { level: 'Excellent', color: 'bg-green-500', value: 90 };
    } else if (temp >= 15 && temp <= 27 && humidity >= 30 && humidity <= 70) {
      return { level: 'Bon', color: 'bg-blue-500', value: 70 };
    } else if (temp >= 10 && temp <= 30) {
      return { level: 'Moyen', color: 'bg-yellow-500', value: 50 };
    } else {
      return { level: 'Faible', color: 'bg-red-500', value: 30 };
    }
  };

  const comfort = getComfortLevel();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Weather Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résumé météorologique</span>
                <Badge variant="outline">{getWeatherDescription()}</Badge>
              </CardTitle>
              <CardDescription>
                Conditions observées pour cette journée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Thermometer className="w-4 h-4" />
                    Température
                  </div>
                  {weather.temperature_avg && (
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{Math.round(weather.temperature_avg)}°C</p>
                      <div className="text-xs text-muted-foreground">
                        Min: {weather.temperature_min ? Math.round(weather.temperature_min) : '-'}°C | 
                        Max: {weather.temperature_max ? Math.round(weather.temperature_max) : '-'}°C
                      </div>
                    </div>
                  )}
                </div>

                {/* Humidity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Droplets className="w-4 h-4" />
                    Humidité
                  </div>
                  {weather.humidity_avg && (
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{Math.round(weather.humidity_avg)}%</p>
                      <div className="text-xs text-muted-foreground">
                        Min: {weather.humidity_min ? Math.round(weather.humidity_min) : '-'}% | 
                        Max: {weather.humidity_max ? Math.round(weather.humidity_max) : '-'}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Wind */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wind className="w-4 h-4" />
                    Vent
                  </div>
                  {weather.wind_speed_avg && (
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{Math.round(weather.wind_speed_avg)} km/h</p>
                      <div className="text-xs text-muted-foreground">
                        Moyenne
                      </div>
                    </div>
                  )}
                </div>

                {/* Sunshine */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sun className="w-4 h-4" />
                    Ensoleillement
                  </div>
                  {weather.sunshine_hours && (
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{Math.round(weather.sunshine_hours)}h</p>
                      <div className="text-xs text-muted-foreground">
                        Durée
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Precipitation Details */}
          {weather.precipitation_total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Précipitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total des précipitations</span>
                    <span className="font-bold">{weather.precipitation_total} mm</span>
                  </div>
                  {weather.precipitation_days && (
                    <div className="flex items-center justify-between">
                      <span>Jours de pluie</span>
                      <span className="font-bold">{weather.precipitation_days} jour(s)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comfort Index */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Index de Confort
              </CardTitle>
              <CardDescription>
                Évaluation basée sur la température et l'humidité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Niveau de confort</span>
                  <Badge className={comfort.color}>{comfort.level}</Badge>
                </div>
                <Progress value={comfort.value} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {comfort.level === 'Excellent' && 'Conditions idéales pour les activités extérieures'}
                  {comfort.level === 'Bon' && 'Conditions favorables avec quelques réserves'}
                  {comfort.level === 'Moyen' && 'Conditions acceptables mais pas optimales'}
                  {comfort.level === 'Faible' && 'Conditions peu favorables pour les activités extérieures'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Raw Data Preview */}
          {weather.raw_data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Données techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs bg-muted p-3 rounded-lg font-mono overflow-x-auto">
                  Source: {weather.source} | Date: {weather.snapshot_date}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeatherDayDetailModal;