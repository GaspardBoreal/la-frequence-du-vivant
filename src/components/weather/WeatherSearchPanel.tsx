import React, { useState } from 'react';
import { Search, Filter, X, Calendar, MapPin, Thermometer, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useWeatherSearchData } from '@/hooks/useWeatherCalendarData';

interface WeatherSearchPanelProps {
  onClose: () => void;
}

const WeatherSearchPanel: React.FC<WeatherSearchPanelProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempRange, setTempRange] = useState([0, 40]);
  const [humidityRange, setHumidityRange] = useState([0, 100]);
  const [selectedDateFrom, setSelectedDateFrom] = useState<Date | undefined>();
  const [selectedDateTo, setSelectedDateTo] = useState<Date | undefined>();
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const { data: searchResults, isLoading } = useWeatherSearchData(searchQuery);

  const regions = ['France', 'Europe', 'Amérique du Nord', 'Asie'];

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTempRange([0, 40]);
    setHumidityRange([0, 100]);
    setSelectedDateFrom(undefined);
    setSelectedDateTo(undefined);
    setSelectedRegions([]);
  };

  const predefinedSearches = [
    { label: 'Jours les plus chauds', query: 'température > 30°C' },
    { label: 'Jours de pluie', query: 'précipitations > 0' },
    { label: 'Conditions idéales', query: '18-24°C, humidité 40-60%' },
    { label: 'Temps venteux', query: 'vent > 20 km/h' },
    { label: 'Journées ensoleillées', query: 'ensoleillement > 8h' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Recherche Avancée
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Recherche textuelle</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Rechercher par date, lieu, conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Predefined Searches */}
        <div className="space-y-2">
          <Label>Recherches rapides</Label>
          <div className="flex flex-wrap gap-2">
            {predefinedSearches.map((search, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => setSearchQuery(search.label)}
              >
                {search.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Période</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {selectedDateFrom 
                    ? format(selectedDateFrom, 'dd/MM/yyyy', { locale: fr })
                    : 'Date de début'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDateFrom}
                  onSelect={setSelectedDateFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {selectedDateTo 
                    ? format(selectedDateTo, 'dd/MM/yyyy', { locale: fr })
                    : 'Date de fin'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDateTo}
                  onSelect={setSelectedDateTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Temperature Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Température ({tempRange[0]}°C - {tempRange[1]}°C)
          </Label>
          <Slider
            value={tempRange}
            onValueChange={setTempRange}
            min={-20}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Humidity Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            Humidité ({humidityRange[0]}% - {humidityRange[1]}%)
          </Label>
          <Slider
            value={humidityRange}
            onValueChange={setHumidityRange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Regions */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Régions
          </Label>
          <div className="flex flex-wrap gap-2">
            {regions.map(region => (
              <Badge
                key={region}
                variant={selectedRegions.includes(region) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleRegion(region)}
              >
                {region}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-2">
            <Label>Résultats de recherche</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Recherche en cours...</p>
              ) : searchResults?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
              ) : (
                searchResults?.slice(0, 5).map((result: any, index: number) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded text-muted-foreground">
                    {format(new Date(result.snapshot_date), 'dd/MM/yyyy', { locale: fr })} - {result.marches?.ville} 
                    {result.temperature_avg && ` - ${Math.round(result.temperature_avg)}°C`}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={clearFilters} className="flex-1">
            Effacer
          </Button>
          <Button onClick={onClose} className="flex-1">
            Appliquer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherSearchPanel;