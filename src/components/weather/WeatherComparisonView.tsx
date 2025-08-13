import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Filter, Plus, X, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useWeatherComparisonData } from '@/hooks/useWeatherCalendarData';

interface WeatherComparisonViewProps {
  searchQuery: string;
  selectedLocation: string | null;
}

const WeatherComparisonView: React.FC<WeatherComparisonViewProps> = ({
  searchQuery,
  selectedLocation
}) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: comparisonData, isLoading } = useWeatherComparisonData(
    selectedDates,
    selectedLocation
  );

  const addDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!selectedDates.includes(dateStr) && selectedDates.length < 4) {
      setSelectedDates([...selectedDates, dateStr]);
    }
    setShowDatePicker(false);
  };

  const removeDate = (dateStr: string) => {
    setSelectedDates(selectedDates.filter(d => d !== dateStr));
  };

  const chartData = comparisonData?.reduce((acc: any[], item: any) => {
    const existingDate = acc.find(d => d.date === item.snapshot_date);
    if (existingDate) {
      // Aggregate multiple locations for same date
      existingDate.temperature = (existingDate.temperature + (item.temperature_avg || 0)) / 2;
      existingDate.humidity = (existingDate.humidity + (item.humidity_avg || 0)) / 2;
      existingDate.precipitation += item.precipitation_total || 0;
      existingDate.wind = (existingDate.wind + (item.wind_speed_avg || 0)) / 2;
      existingDate.locations++;
    } else {
      acc.push({
        date: item.snapshot_date,
        formattedDate: format(new Date(item.snapshot_date), 'dd/MM/yyyy', { locale: fr }),
        temperature: item.temperature_avg || 0,
        humidity: item.humidity_avg || 0,
        precipitation: item.precipitation_total || 0,
        wind: item.wind_speed_avg || 0,
        sunshine: item.sunshine_hours || 0,
        locations: 1
      });
    }
    return acc;
  }, []) || [];

  const radarData = chartData.map(item => ({
    date: item.formattedDate,
    temperature: Math.round((item.temperature + 10) * 2), // Normalize for radar
    humidity: item.humidity,
    precipitation: Math.min(item.precipitation * 10, 100), // Cap at 100 for visualization
    wind: Math.min(item.wind * 2, 100),
    sunshine: item.sunshine * 4
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement de la comparaison...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Comparaison de Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedDates.map(dateStr => (
                <Badge key={dateStr} variant="default" className="flex items-center gap-2">
                  {format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeDate(dateStr)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
              
              {selectedDates.length < 4 && (
                <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter une date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      onSelect={(date) => date && addDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {selectedDates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sélectionnez jusqu'à 4 dates pour les comparer
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Charts */}
      {chartData.length > 0 && (
        <>
          {/* Bar Chart Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Comparaison Détaillée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="formattedDate" 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        switch (name) {
                          case 'temperature': return [`${Math.round(value)}°C`, 'Température'];
                          case 'humidity': return [`${Math.round(value)}%`, 'Humidité'];
                          case 'precipitation': return [`${value}mm`, 'Précipitations'];
                          case 'wind': return [`${Math.round(value)}km/h`, 'Vent'];
                          default: return [value, name];
                        }
                      }}
                    />
                    <Legend />
                    <Bar dataKey="temperature" fill="hsl(var(--primary))" name="Température (°C)" />
                    <Bar dataKey="humidity" fill="hsl(var(--secondary))" name="Humidité (%)" />
                    <Bar dataKey="precipitation" fill="hsl(var(--accent))" name="Précipitations (mm)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vue d'Ensemble Comparative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                      tickCount={5}
                    />
                    {chartData.map((_, index) => (
                      <Radar
                        key={index}
                        name={chartData[index].formattedDate}
                        dataKey={`date`}
                        stroke={`hsl(${index * 90}, 70%, 50%)`}
                        fill={`hsl(${index * 90}, 70%, 50%)`}
                        fillOpacity={0.1}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Les valeurs sont normalisées pour la visualisation radar</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tableau Comparatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Température</th>
                      <th className="text-right py-2">Humidité</th>
                      <th className="text-right py-2">Précipitations</th>
                      <th className="text-right py-2">Vent</th>
                      <th className="text-right py-2">Ensoleillement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{item.formattedDate}</td>
                        <td className="text-right py-2">{Math.round(item.temperature)}°C</td>
                        <td className="text-right py-2">{Math.round(item.humidity)}%</td>
                        <td className="text-right py-2">{item.precipitation}mm</td>
                        <td className="text-right py-2">{Math.round(item.wind)}km/h</td>
                        <td className="text-right py-2">{Math.round(item.sunshine)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedDates.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Sélectionnez des dates pour commencer la comparaison</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeatherComparisonView;