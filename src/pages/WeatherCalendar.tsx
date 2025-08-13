import React, { useState } from 'react';
import { Calendar, MapPin, TrendingUp, Search, Filter, Download, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import WeatherCalendarView from '@/components/weather/WeatherCalendarView';
import WeatherTimelineView from '@/components/weather/WeatherTimelineView';
import WeatherComparisonView from '@/components/weather/WeatherComparisonView';
import WeatherSearchPanel from '@/components/weather/WeatherSearchPanel';
import SEOHead from '@/components/SEOHead';

const WeatherCalendar = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const locations = [
    { id: 'all', name: 'Tous les emplacements', count: 145 },
    { id: 'france', name: 'France', count: 89 },
    { id: 'europe', name: 'Europe', count: 34 },
    { id: 'autres', name: 'Autres régions', count: 22 }
  ];

  return (
    <>
      <SEOHead 
        title="Calendrier Météorologique Interactif"
        description="Explorez l'historique météorologique complet avec un calendrier interactif. Analysez les tendances, comparez les périodes et découvrez les patterns climatiques."
        keywords="météo, calendrier, historique, climat, données, analyse, territoriale"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Calendrier Météorologique Interactif
                </h1>
                <p className="text-muted-foreground">
                  Explorez l'historique météorologique et découvrez les patterns climatiques
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Emplacements</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">145</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Jours de données</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">2,847</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">Aujourd'hui</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Historique</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">365j</p>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une date, un lieu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {locations.map((location) => (
                  <Badge
                    key={location.id}
                    variant={selectedLocation === location.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedLocation(
                      selectedLocation === location.id ? null : location.id
                    )}
                  >
                    {location.name} ({location.count})
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Search Panel */}
          {showAdvancedFilters && (
            <div className="mb-6">
              <WeatherSearchPanel onClose={() => setShowAdvancedFilters(false)} />
            </div>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Comparaison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              <WeatherCalendarView 
                searchQuery={searchQuery}
                selectedLocation={selectedLocation}
              />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <WeatherTimelineView 
                searchQuery={searchQuery}
                selectedLocation={selectedLocation}
              />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <WeatherComparisonView 
                searchQuery={searchQuery}
                selectedLocation={selectedLocation}
              />
            </TabsContent>
          </Tabs>

          {/* Export Actions */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-2">
            <Button size="sm" className="shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeatherCalendar;