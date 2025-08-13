import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WeatherCalendarView from '@/components/weather/WeatherCalendarView';
import WeatherTimelineView from '@/components/weather/WeatherTimelineView';
import WeatherComparisonView from '@/components/weather/WeatherComparisonView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WeatherCalendarTabProps {
  onOpenFullCalendar?: () => void;
}

export const WeatherCalendarTab: React.FC<WeatherCalendarTabProps> = ({ onOpenFullCalendar }) => {
  const [activeView, setActiveView] = useState('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Calendrier Météorologique Interactif
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Explorez l'historique météorologique jour par jour avec des vues adaptées
                </CardDescription>
              </div>
            </div>
            {onOpenFullCalendar && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onOpenFullCalendar}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                <ExternalLink className="w-4 h-4" />
                Version complète
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">37</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">Jours de données</p>
            </div>
            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">21</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">Locations couvertes</p>
            </div>
            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">Hier</p>
              <p className="text-sm text-blue-600 dark:text-blue-500">Dernière mise à jour</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Calendar Views */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                Timeline
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Comparaison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              <WeatherCalendarView 
                searchQuery={searchQuery} 
                selectedLocation={selectedLocation} 
              />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <WeatherTimelineView 
                searchQuery={searchQuery} 
                selectedLocation={selectedLocation} 
              />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <WeatherComparisonView 
                searchQuery={searchQuery} 
                selectedLocation={selectedLocation} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};