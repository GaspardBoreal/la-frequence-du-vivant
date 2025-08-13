import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Leaf, Thermometer, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GeographicInsightsMapProps {
  detailed?: boolean;
}

export const GeographicInsightsMap: React.FC<GeographicInsightsMapProps> = ({ detailed = false }) => {
  const { data: marchesData, isLoading } = useQuery({
    queryKey: ['marches-with-data'],
    queryFn: async () => {
      const { data } = await supabase
        .from('marches')
        .select(`
          *,
          biodiversity_snapshots(total_species, recent_observations, created_at),
          weather_snapshots(temperature_avg, humidity_avg, created_at)
        `)
        .not('biodiversity_snapshots', 'is', null)
        .order('created_at', { ascending: false });
      return data;
    }
  });

  const enrichedMarches = useMemo(() => {
    if (!marchesData) return [];
    
    return marchesData.map(marche => {
      const biodiversityData = marche.biodiversity_snapshots || [];
      const weatherData = marche.weather_snapshots || [];
      
      const latestBio = biodiversityData[0];
      const latestWeather = weatherData[0];
      
      const totalSpecies = biodiversityData.reduce((sum, snapshot) => sum + (snapshot.total_species || 0), 0);
      const avgTemp = weatherData.length > 0 
        ? weatherData.reduce((sum, snapshot) => sum + (snapshot.temperature_avg || 0), 0) / weatherData.length
        : null;
      
      return {
        ...marche,
        enrichedData: {
          totalSpecies,
          latestSpeciesCount: latestBio?.total_species || 0,
          recentObservations: latestBio?.recent_observations || 0,
          avgTemperature: avgTemp ? Math.round(avgTemp * 10) / 10 : null,
          dataQuality: biodiversityData.length + weatherData.length,
          lastUpdate: latestBio?.created_at || latestWeather?.created_at
        }
      };
    }).sort((a, b) => b.enrichedData.dataQuality - a.enrichedData.dataQuality);
  }, [marchesData]);

  const regionStats = useMemo(() => {
    if (!enrichedMarches) return [];
    
    const grouped = enrichedMarches.reduce((acc: Record<string, any>, marche) => {
      const region = marche.region || 'Non défini';
      if (!acc[region]) {
        acc[region] = {
          region,
          marches: 0,
          totalSpecies: 0,
          totalObservations: 0,
          avgTemp: 0,
          tempCount: 0,
          topMarche: null
        };
      }
      
      acc[region].marches += 1;
      acc[region].totalSpecies += marche.enrichedData.totalSpecies;
      acc[region].totalObservations += marche.enrichedData.recentObservations;
      
      if (marche.enrichedData.avgTemperature !== null) {
        acc[region].avgTemp += marche.enrichedData.avgTemperature;
        acc[region].tempCount += 1;
      }
      
      if (!acc[region].topMarche || marche.enrichedData.latestSpeciesCount > acc[region].topMarche.enrichedData.latestSpeciesCount) {
        acc[region].topMarche = marche;
      }
      
      return acc;
    }, {});
    
    return Object.values(grouped).map((region: any) => ({
      ...region,
      avgTemp: region.tempCount > 0 ? Math.round((region.avgTemp / region.tempCount) * 10) / 10 : null,
      avgSpeciesPerMarche: region.marches > 0 ? Math.round(region.totalSpecies / region.marches) : 0
    })).sort((a: any, b: any) => b.totalSpecies - a.totalSpecies);
  }, [enrichedMarches]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-96 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {!detailed ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Aperçu Géographique
            </CardTitle>
            <CardDescription>
              Distribution des données par région
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regionStats.slice(0, 5).map((region: any, index) => (
                <motion.div
                  key={region.region}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{region.region}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        {region.totalSpecies} espèces
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {region.marches} marchés
                      </span>
                      {region.avgTemp && (
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          {region.avgTemp}°C
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {region.avgSpeciesPerMarche} esp/marché
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Top: {region.topMarche?.nom_marche}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Regional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionStats.map((region: any, index) => (
              <Card key={region.region} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {region.region}
                  </CardTitle>
                  <CardDescription>
                    {region.marches} marché(s) analysé(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total espèces</span>
                      <Badge variant="secondary">{region.totalSpecies}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Observations</span>
                      <Badge variant="outline">{region.totalObservations}</Badge>
                    </div>
                    {region.avgTemp && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Temp. moyenne</span>
                        <Badge variant="outline">{region.avgTemp}°C</Badge>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">Marché top biodiversité:</div>
                      <div className="text-sm font-medium">{region.topMarche?.nom_marche}</div>
                      <div className="text-xs text-muted-foreground">
                        {region.topMarche?.enrichedData.latestSpeciesCount} espèces
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Performing Markets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Marchés les Plus Performants
              </CardTitle>
              <CardDescription>
                Classement par richesse en données collectées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrichedMarches.slice(0, 10).map((marche, index) => (
                  <motion.div
                    key={marche.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={index < 3 ? "default" : "outline"}
                        className={index < 3 ? "bg-gradient-to-r from-yellow-400 to-orange-500" : ""}
                      >
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{marche.nom_marche}</div>
                        <div className="text-sm text-muted-foreground">
                          {marche.ville}, {marche.region}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-1">
                          <Leaf className="w-3 h-3" />
                          {marche.enrichedData.latestSpeciesCount}
                        </Badge>
                        {marche.enrichedData.avgTemperature && (
                          <Badge variant="outline" className="gap-1">
                            <Thermometer className="w-3 h-3" />
                            {marche.enrichedData.avgTemperature}°C
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score: {marche.enrichedData.dataQuality} collectes
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};