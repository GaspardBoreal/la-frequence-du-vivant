import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Thermometer, Droplets, Wind, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeatherCalendarData } from '@/hooks/useWeatherCalendarData';
import WeatherDayDetailModal from './WeatherDayDetailModal';

interface WeatherCalendarViewProps {
  searchQuery: string;
  selectedLocation: string | null;
}

const WeatherCalendarView: React.FC<WeatherCalendarViewProps> = ({
  searchQuery,
  selectedLocation
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: weatherData, isLoading } = useWeatherCalendarData(
    format(currentDate, 'yyyy-MM'),
    selectedLocation
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const getWeatherForDate = (date: Date) => {
    if (!weatherData) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return weatherData.find(w => w.snapshot_date === dateStr);
  };

  const getTemperatureColor = (temp: number | undefined) => {
    if (!temp) return 'bg-muted';
    if (temp < 0) return 'bg-blue-500';
    if (temp < 10) return 'bg-blue-400';
    if (temp < 20) return 'bg-green-400';
    if (temp < 30) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (date: Date, weather: any) => {
    if (weather && isSameMonth(date, currentDate)) {
      setSelectedDate(date);
      setShowDetailModal(true);
    }
  };

  const filteredWeatherData = useMemo(() => {
    if (!weatherData || !searchQuery) return weatherData;
    
    return weatherData.filter(weather => {
      const searchLower = searchQuery.toLowerCase();
      const dateStr = format(new Date(weather.snapshot_date), 'dd/MM/yyyy', { locale: fr });
      const dayName = format(new Date(weather.snapshot_date), 'EEEE', { locale: fr });
      
      return dateStr.includes(searchLower) || 
             dayName.toLowerCase().includes(searchLower) ||
             (weather.temperature_avg && weather.temperature_avg.toString().includes(searchLower));
    });
  }, [weatherData, searchQuery]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement du calendrier...</CardTitle>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const weather = getWeatherForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const hasData = !!weather;

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    relative p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200
                    ${isCurrentMonth ? 'bg-card hover:bg-accent' : 'bg-muted/30'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    ${hasData ? 'hover:shadow-md' : 'opacity-50'}
                  `}
                  onClick={() => handleDayClick(day, weather)}
                >
                  <div className="flex flex-col h-full">
                    <span className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                    
                    {hasData && weather && (
                      <div className="flex-1 space-y-1">
                        {/* Temperature */}
                        {weather.temperature_avg && (
                          <div className={`text-xs px-1 py-0.5 rounded text-white ${getTemperatureColor(weather.temperature_avg)}`}>
                            {Math.round(weather.temperature_avg)}°C
                          </div>
                        )}
                        
                        {/* Weather indicators */}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {weather.precipitation_total > 0 && (
                            <Droplets className="w-3 h-3 text-blue-500" />
                          )}
                          {weather.wind_speed_avg > 20 && (
                            <Wind className="w-3 h-3 text-gray-500" />
                          )}
                          {weather.sunshine_hours > 8 && (
                            <Sun className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!hasData && isCurrentMonth && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">-</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-muted-foreground">Froid (&lt; 10°C)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span className="text-muted-foreground">Doux (10-20°C)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span className="text-muted-foreground">Chaud (20-30°C)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span className="text-muted-foreground">Très chaud (&gt; 30°C)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Detail Modal */}
      {selectedDate && (
        <WeatherDayDetailModal
          date={selectedDate}
          weather={getWeatherForDate(selectedDate)}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

export default WeatherCalendarView;