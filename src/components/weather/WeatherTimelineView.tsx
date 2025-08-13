import React, { useState, useMemo } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, ChevronLeft, ChevronRight, Thermometer, Droplets, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useWeatherTimelineData } from '@/hooks/useWeatherCalendarData';

interface WeatherTimelineViewProps {
  searchQuery: string;
  selectedLocation: string | null;
}

const WeatherTimelineView: React.FC<WeatherTimelineViewProps> = ({
  searchQuery,
  selectedLocation
}) => {
  const [timeRange, setTimeRange] = useState(30); // days
  const [startDate, setStartDate] = useState(() => 
    format(subDays(new Date(), timeRange), 'yyyy-MM-dd')
  );
  
  const endDate = format(addDays(new Date(startDate), timeRange), 'yyyy-MM-dd');

  const { data: weatherData, isLoading } = useWeatherTimelineData(
    startDate,
    endDate,
    selectedLocation
  );

  const chartData = useMemo(() => {
    if (!weatherData) return [];

    // Group by date and calculate averages
    const groupedData = weatherData.reduce((acc: any, item: any) => {
      const date = item.snapshot_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          temperatures: [],
          humidity: [],
          precipitation: [],
          wind: [],
          sunshine: []
        };
      }
      
      if (item.temperature_avg) acc[date].temperatures.push(item.temperature_avg);
      if (item.humidity_avg) acc[date].humidity.push(item.humidity_avg);
      if (item.precipitation_total) acc[date].precipitation.push(item.precipitation_total);
      if (item.wind_speed_avg) acc[date].wind.push(item.wind_speed_avg);
      if (item.sunshine_hours) acc[date].sunshine.push(item.sunshine_hours);
      
      return acc;
    }, {});

    return Object.values(groupedData).map((group: any) => ({
      date: group.date,
      formattedDate: format(new Date(group.date), 'dd/MM', { locale: fr }),
      fullDate: format(new Date(group.date), 'dd MMMM yyyy', { locale: fr }),
      temperature: group.temperatures.length > 0 
        ? Math.round(group.temperatures.reduce((a: number, b: number) => a + b, 0) / group.temperatures.length)
        : null,
      humidity: group.humidity.length > 0
        ? Math.round(group.humidity.reduce((a: number, b: number) => a + b, 0) / group.humidity.length)
        : null,
      precipitation: group.precipitation.length > 0
        ? group.precipitation.reduce((a: number, b: number) => a + b, 0)
        : 0,
      wind: group.wind.length > 0
        ? Math.round(group.wind.reduce((a: number, b: number) => a + b, 0) / group.wind.length)
        : null,
      sunshine: group.sunshine.length > 0
        ? Math.round(group.sunshine.reduce((a: number, b: number) => a + b, 0) / group.sunshine.length)
        : null,
      dataPoints: group.temperatures.length
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weatherData]);

  const navigateTime = (direction: 'prev' | 'next') => {
    const currentStart = new Date(startDate);
    const newStart = direction === 'prev' 
      ? subDays(currentStart, timeRange)
      : addDays(currentStart, timeRange);
    setStartDate(format(newStart, 'yyyy-MM-dd'));
  };

  const setTimeRangeAndUpdate = (days: number) => {
    setTimeRange(days);
    setStartDate(format(subDays(new Date(), days), 'yyyy-MM-dd'));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement de la timeline...</CardTitle>
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
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Timeline Météorologique
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateTime('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {format(new Date(startDate), 'dd MMM', { locale: fr })} - {format(new Date(endDate), 'dd MMM yyyy', { locale: fr })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateTime('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90, 365].map(days => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRangeAndUpdate(days)}
              >
                {days}j
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Temperature Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5" />
            Évolution des Températures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="formattedDate" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  label={{ value: '°C', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelFormatter={(value, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? item.fullDate : value;
                  }}
                  formatter={(value: any, name: string) => [
                    `${Math.round(value)}°C`,
                    'Température moyenne'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Humidity & Precipitation Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Humidité et Précipitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="formattedDate" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="humidity"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  label={{ value: '%', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="precipitation"
                  orientation="right"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'mm', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  labelFormatter={(value, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? item.fullDate : value;
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'humidity') return [`${Math.round(value)}%`, 'Humidité'];
                    if (name === 'precipitation') return [`${value}mm`, 'Précipitations'];
                    return [value, name];
                  }}
                />
                <Line 
                  yAxisId="humidity"
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
                <Line 
                  yAxisId="precipitation"
                  type="monotone" 
                  dataKey="precipitation" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques de la période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {chartData.length > 0 && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Température moyenne</p>
                  <p className="text-xl font-bold">
                    {Math.round(chartData.reduce((acc, item) => acc + (item.temperature || 0), 0) / chartData.filter(item => item.temperature).length)}°C
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Humidité moyenne</p>
                  <p className="text-xl font-bold">
                    {Math.round(chartData.reduce((acc, item) => acc + (item.humidity || 0), 0) / chartData.filter(item => item.humidity).length)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Précipitations totales</p>
                  <p className="text-xl font-bold">
                    {Math.round(chartData.reduce((acc, item) => acc + item.precipitation, 0))}mm
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Points de données</p>
                  <p className="text-xl font-bold">
                    {chartData.reduce((acc, item) => acc + item.dataPoints, 0)}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherTimelineView;